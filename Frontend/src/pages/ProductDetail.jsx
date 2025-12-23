import React, { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import '../Style/ProductDetail.css';
import Orderform from "../pages/Orderform.jsx";
import LazyImage from '../Components/LazyImage';
// Footer provided by layout
import { getAllCachedProducts } from '../utils/productCache';

const API = import.meta.env.VITE_API_URL;

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const [product, setProduct] = useState(location.state?.product || null);
  const [mainImage, setMainImage] = useState(null);
  const [actionState, setActionState] = useState({ adding: false, added: false, buyNowLoading: false });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(!product);
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      const imgs = (product.images && product.images.length) ? product.images : (product.img ? [product.img] : []);
      setMainImage(imgs[0] || null);
      return; // already have product via navigation state
    }
    // try to read from shared cache for instant display
    const cached = getAllCachedProducts();
    const maybe = (cached && Array.isArray(cached.products))
      ? cached.products.find(p => String(p._id || p.id) === String(id))
      : null;

    if (maybe) {
      setProduct(maybe);
      setLoading(false);
    }

    // always fetch latest from API in background
    const fetchProduct = async () => {
      try {
        if (!maybe) setLoading(true);
        const res = await fetch(`${API}/api/products/${id}`);
        if (!res.ok) throw new Error('Failed to fetch product');
        const data = await res.json();
        setProduct(data.product || null);
      } catch (err) {
        console.error(err);
        setError('Could not load product details');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // whenever product changes (e.g., fetched) set the default main image
  useEffect(() => {
    if (!product) return;
    const imgs = (product.images && product.images.length) ? product.images : (product.img ? [product.img] : []);
    setMainImage(imgs[0] || null);
  }, [product]);

  if (loading) return <div className="product-detail">Loading product…</div>;
  if (error) return <div className="product-detail error">{error}</div>;
  if (!product) return <div className="product-detail">Product not found.</div>;

  return (
    <>
    <div className="product-detail">
      <div className="detail-header">
        <div className="detail-image-wrap">
          <LazyImage src={mainImage || product.img || '/placeholder-product.svg'} alt={product.title} className="detail-image" />
          {/* thumbnail selector (click to change main image) */}
          {(product.images && product.images.length > 0) && (
            <div className="thumbnail-list" role="tablist" aria-label="Product image thumbnails">
              {product.images.map((it, idx) => (
                <button
                  key={idx}
                  type="button"
                  className={`thumbnail ${it === mainImage ? 'active' : ''}`}
                  onClick={() => setMainImage(it)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setMainImage(it) }}
                  aria-label={`Show image ${idx + 1}`}
                >
                  <LazyImage src={it} alt={`thumbnail-${idx+1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

          <div className="detail-meta">
          <h1 className="detail-title">{product.title} </h1>
          {product.price && <div className="detail-price">{product.price} AED</div>}
          
          <Orderform product={product} />
         

          
        </div>
      </div>

    </div>

    <div className="detail-about">
            <h3>About</h3>
            <p>{product.description || 'No additional information provided for this product.'}</p>
    </div>
    {/* Footer rendered globally by PublicLayout */}
    </>
  );
};

export default ProductDetail;
