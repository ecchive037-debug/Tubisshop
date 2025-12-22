import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import '../Style/AllProducts.css';
import Products from '../Components/products.jsx';
import SkeletonLoader from '../Components/SkeletonLoader.jsx';
// Footer provided by layout

const API = import.meta.env.VITE_API_URL;
const PRODUCTS_PER_PAGE = 18;

const AllProducts = () => {
  const [search, setSearch] = useState('');
  const [isSearched, setIsSearched] = useState(false);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const pageSentinelRef = useRef(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  
  // cache utils
  const { } = {};

  const fetchProductsPage = useCallback(async (p = 1) => {
    if (!isMountedRef.current) return;
    
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);

      const res = await fetch(
        `${API}/api/products?page=${p}&limit=${PRODUCTS_PER_PAGE}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();

      if (!isMountedRef.current) return;

      const incoming = data.products || [];

      // Merge incoming server data into state: replace existing items with same id, append new ones
      setProducts(prev => {
        if (!prev || prev.length === 0) {
          return incoming;
        }

        const byId = new Map(incoming.map(p => [p._id || p.id, p]));

        // Replace existing items when server provides newer version
        const merged = prev.map(item => {
          const id = item._id || item.id;
          return byId.has(id) ? byId.get(id) : item;
        });

        // Append any incoming items that weren't present
        const existingIds = new Set(merged.map(i => i._id || i.id));
        incoming.forEach(item => {
          const id = item._id || item.id;
          if (!existingIds.has(id)) merged.push(item);
        });

        return merged;
      });

      // Append to local cache incrementally (saves as pages arrive)
      try {
        // lazy require to avoid top-level coupling
        const cache = await import('../utils/productCache');
        cache.appendProductsToCache(incoming);
      } catch (e) {
        console.warn('Cache append failed', e);
      }

      // Update page counters
      setPages(data.pages || 1);
      setPage(data.page || p);
      setInitialLoadDone(true);
      setHasMore((data.page || p) < (data.pages || 1));
    } catch (err) {
      // Only log if it's not an abort error
      if (err.name !== 'AbortError') {
        console.error('Error fetching products:', err);
        if (isMountedRef.current) {
          setHasMore(false);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // DO NOT fetch on mount - wait for user scroll
  useEffect(() => {
    isMountedRef.current = true;
    // On mount: try to load cached products and show immediately
    (async () => {
      try {
        const cache = await import('../utils/productCache');
        const cached = cache.getProductsFromCache();
        if (cached && cached.length > 0) {
          setProducts(cached);
          // set page based on cached count so intersection observer can continue from next page
          setPage(Math.max(1, Math.ceil(cached.length / PRODUCTS_PER_PAGE)));
          setInitialLoadDone(true);
          setHasMore(true);
          // start background refresh from first page to reconcile server state
          fetchProductsPage(1);
        }
      } catch (e) {
        // ignore cache errors
      }
    })();

    return () => {
      isMountedRef.current = false;
      // Cancel any pending requests on unmount
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Infinite scroll observer - ONLY trigger after first scroll
  useEffect(() => {
    const node = pageSentinelRef.current;
    if (!node) return;
    
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // First intersection: load initial products
          if (!initialLoadDone) {
            fetchProductsPage(1);
          }
          // Subsequent intersections: load next page
          else if (hasMore && !loading && page >= 0) {
            fetchProductsPage(page + 1);
          }
        }
      });
    }, { rootMargin: '400px' });
    
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, loading, page, initialLoadDone, fetchProductsPage]);

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

          {!isSearched && !initialLoadDone && products.length === 0 && (
            <div style={{gridColumn: "1 / -1", textAlign: "center", padding: "20px"}}>
              <SkeletonLoader count={PRODUCTS_PER_PAGE} />
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
          {!isSearched && loading && initialLoadDone && (
            <div style={{gridColumn: "1 / -1", textAlign: "center", padding: "20px"}}>
              <p>Loading more products...</p>
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
