import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import '../Style/AllProducts.css';
import Products from '../Components/products.jsx';
// Footer provided by layout

const API = import.meta.env.VITE_API_URL;
const PRODUCTS_PER_PAGE = 6;

const AllProducts = () => {
  const [search, setSearch] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const pageSentinelRef = useRef(null);
  const isMountedRef = useRef(true);

  const fetchProductsPage = useCallback(async (p = 1) => {
    if (!isMountedRef.current) return;
    
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/products?page=${p}&limit=${PRODUCTS_PER_PAGE}`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      
      if (!isMountedRef.current) return;
      
      // Reset products if fetching first page, else append
      if (p === 1) {
        setProducts(data.products || []);
        setPages(data.pages || 1);
        setPage(1);
      } else {
        setProducts(prev => [...prev, ...(data.products || [])]);
        setPage(data.page || p);
      }
      
      // Check if there are more products to load
      setHasMore((data.page || p) < (data.pages || 1));
    } catch (err) {
      console.error('Error fetching products:', err);
      if (isMountedRef.current) {
        setHasMore(false);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Fetch products on mount
  useEffect(() => {
    isMountedRef.current = true;
    fetchProductsPage(1);
    
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Infinite scroll observer
  useEffect(() => {
    const node = pageSentinelRef.current;
    if (!node) return;
    
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !loading && page > 0) {
          fetchProductsPage(page + 1);
        }
      });
    }, { rootMargin: '400px' });
    
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, loading, page, fetchProductsPage]);

  const filteredProducts = useMemo(() => {
    return isSearched
      ? products.filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
      : [];
  }, [isSearched, products, search]);

  return (
    <div className="AllProducts-page">

      <div className="container">
        <header style={{marginTop:20, marginBottom:10}}>
          <h1>All Products</h1>
          <p className="sub">Browse all available products</p>
        </header>

        <div className="products-container">
          {isSearched && filteredProducts.length > 0 && (
            <div style={{gridColumn: '1 / -1', marginBottom: 20}}>
              <button className="btn" onClick={() => { setSearch(''); setIsSearched(false); }} style={{backgroundColor: '#ff7a00', color: 'white'}}>
                ← Back to All Products
              </button>
            </div>
          )}

          {!isSearched && (() => {
            return products.map((product) => (
              <Products key={product._id || product.id} product={product} />
            ));
          })()}
          {!isSearched && hasMore && (
            <div key={`page-sentinel`} ref={pageSentinelRef} style={{ gridColumn: '1 / -1', height: '1px' }} />
          )}
          {!isSearched && loading && (
            <div style={{gridColumn: "1 / -1", textAlign: "center", padding: "20px"}}>
              <p>Loading products...</p>
            </div>
          )}

          {isSearched && filteredProducts.length > 0 && (() => {
            return filteredProducts.map((product) => (
              <Products key={product._id || product.id} product={product} />
            ));
          })()}

          {isSearched && filteredProducts.length === 0 && (
            <div className="no-products">
              <h2>❌ No products found for "{search}"</h2>
              <p>Try searching with different keywords</p>
              <button className="btn" onClick={() => { setSearch(''); setIsSearched(false); }} style={{marginTop: 20}}>← Back to All Products</button>
            </div>
          )}
        </div>
      </div>

  {/* Footer rendered globally by PublicLayout */}
    </div>
  );
};

export default AllProducts;
