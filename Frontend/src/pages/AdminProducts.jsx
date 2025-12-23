import React, { useEffect, useState } from 'react';
import '../Style/AdminDashboard.css';
import '../Style/AdminProducts.css';
import SkeletonLoader from '../Components/SkeletonLoader.jsx';
import truncateTitle from '../utils/truncateTitle';
import LazyImage from '../Components/LazyImage';
import { getAllCachedProducts } from '../utils/productCache';

// Small helper component to show truncated title with an expand toggle (admin-only list)
function TitleWithToggle({ title, id }) {
  const [open, setOpen] = useState(false);
  const short = truncateTitle(title, 3) || 'Untitled';
  const wordCount = (String(title || '').trim().split(/\s+/).filter(Boolean)).length;
  const showToggle = wordCount > 3; // only show toggle when title is longer than 3 words

  return (
    <div className={`title-toggle ${open ? 'open' : ''} ${showToggle ? 'has-toggle' : ''}`}>
      {/* show short/3-word title inline to avoid layout shifts */}
      <span className="title-text" title={open ? '' : title}>{short}</span>

      {showToggle ? (
        <>
          <button
            className="chev-btn"
            aria-label={open ? 'Hide full title' : 'Show full title'}
            onClick={(e) => { e.stopPropagation(); setOpen(o => !o); }}
            aria-expanded={open}
          >
            <svg className="chev-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          {/* absolute overlay for full title; does not change card height */}
          <div className={`title-expanded ${open ? 'show' : ''}`} role="dialog" aria-hidden={!open}>
            {title}
          </div>
        </>
      ) : null}
    </div>
  );
}

const AdminProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cached = getAllCachedProducts();
    if (cached && Array.isArray(cached.products) && cached.products.length) {
      setProducts(cached.products);
    }

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const API = import.meta.env.VITE_API_URL;
        // Request a large limit so backend returns up to its max (backend caps limit at 100)
        const res = await fetch(`${API}/api/products?limit=100`);
        const data = await res.json();
        if (res.ok) {
          setProducts(data.products || []);
        }
      } catch (err) {
        console.error('fetch admin products', err);
      } finally { setLoading(false); }
    };

    fetchProducts();
  }, []);

  const remove = async (id) => {
    if (!confirm('Delete product? This is permanent.')) return;
    const token = localStorage.getItem('adminToken');
    if (!token) return alert('Admin login required');
    try {
      const API = import.meta.env.VITE_API_URL;
      const res = await fetch(`${API}/api/admin/product/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (!res.ok) return alert(data.message || 'Failed to delete');
      setProducts(prev => prev.filter(p => p._id !== id));
    } catch (err) { console.error(err); alert('Failed to delete product'); }
  };

  return (
    <div className="admin-products">
      <header className="orders-header">
        <div>
          <h1>Products</h1>
          <p className="sub">Manage products you uploaded — quick edit and delete</p>
        </div>
        <div className="actions"><div className="total-stat">{products.length} items</div></div>
      </header>

      {loading ? (
        <div className="products-grid skeleton-grid"><SkeletonLoader count={12} /></div>
      ) : products.length === 0 ? (
        <div className="orders-empty">You have not uploaded any products yet.</div>
      ) : (
        <div className="products-grid">
          {products.map(p => (
            <article className="product-card admin" key={p._id}>
              <LazyImage src={(p.images && p.images.length ? p.images[0] : p.img) || '/placeholder-product.png'} alt={p.title} />
              <div className="product-meta">
                <div className="price">AED {p.price}</div>
                <div className={`title ${p._id}`}>{/* title + toggle handled below */}
                  {/* truncated by default, admin can expand */}
                  <TitleWithToggle title={p.title} id={p._id} />
                </div>
              </div>
              <div className="product-actions">
                <button className="btn-sm" onClick={() => navigator.clipboard?.writeText(p._id || '') || alert('Copied id')}>Copy ID</button>
                <button className="btn-sm btn-danger" onClick={() => remove(p._id)}>Delete</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminProducts;
