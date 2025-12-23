import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import '../Style/AllProducts.css';
import Products from '../Components/products.jsx';
import { getAllCachedProducts } from '../utils/productCache';

const API = import.meta.env.VITE_API_URL;
const PRODUCTS_PER_PAGE = 24;

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState('');
  const [isSearched, setIsSearched] = useState(false);

  const sentinelRef = useRef(null);

  // 🚀 fetch products
  const fetchProducts = useCallback(async (pageNo) => {
    if (loading || !hasMore) return;

    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/products?page=${pageNo}&limit=${PRODUCTS_PER_PAGE}`
      );
      if (!res.ok) throw new Error('Fetch failed');

      const data = await res.json();

      setProducts(prev => [...prev, ...(data.products || [])]);
      setHasMore(pageNo < data.pages);
      setPage(pageNo);
    } catch (err) {
      console.error(err);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore]);

  // ⚡ load first page instantly
  useEffect(() => {
    const cached = getAllCachedProducts();
    if (cached && Array.isArray(cached.products) && cached.products.length) {
      setProducts(cached.products);
      setPage(cached.page || 1);
      setHasMore((cached.page || 1) < (cached.pages || 1));
      const next = (cached.page || 1) + 1;
      fetchProducts(next);
    } else {
      fetchProducts(1);
    }
  }, []);

  // ♾️ infinite scroll
  useEffect(() => {
    if (!sentinelRef.current) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          fetchProducts(page + 1);
        }
      },
      { rootMargin: '300px' }
    );

    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [page, fetchProducts]);

  // 🔍 search filter
  const filteredProducts = useMemo(() => {
    if (!isSearched) return [];
    return products.filter(p =>
      p.title.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, isSearched, products]);

  return (
    <div className="AllProducts-page">
      <div className="container">

        <header style={{ marginTop: 20, marginBottom: 10 }}>
          <h1>All Products</h1>
          <p className="sub">Browse all available products</p>
        </header>

        <div className="products-container">

          {/* BACK BUTTON */}
          {isSearched && (
            <div style={{ gridColumn: '1 / -1', marginBottom: 20 }}>
              <button
                className="btn"
                onClick={() => {
                  setSearch('');
                  setIsSearched(false);
                }}
              >
                ← Back to All Products
              </button>
            </div>
          )}

          {/* PRODUCTS */}
          {!isSearched &&
            products.map(product => (
              <Products key={product._id} product={product} />
            ))}

          {/* SEARCH RESULT */}
          {isSearched &&
            filteredProducts.map(product => (
              <Products key={product._id} product={product} />
            ))}

          {/* NO SEARCH RESULT */}
          {isSearched && filteredProducts.length === 0 && (
            <div className="no-products">
              <h2>❌ No products found for "{search}"</h2>
              <p>Try different keywords</p>
            </div>
          )}

          {/* LOADING TEXT */}
          {loading && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 20 }}>
              Loading more products...
            </div>
          )}

          {/* SENTINEL */}
          {hasMore && (
            <div ref={sentinelRef} style={{ height: 1, gridColumn: '1 / -1' }} />
          )}

        </div>
      </div>
    </div>
  );
};

export default AllProducts;
  