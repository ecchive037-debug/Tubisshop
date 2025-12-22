import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Products from "../Components/products.jsx";
import "../Style/Home.css";

const API = import.meta.env.VITE_API_URL;

const SearchResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const searchTerm = queryParams.get("q") || "";

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const pageSentinelRef = React.useRef(null);

  const fetchSearchPage = async (p = 1) => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/products?q=${encodeURIComponent(searchTerm)}&page=${p}&limit=12`);
      if (!res.ok) throw new Error('Failed to fetch search results');
      const data = await res.json();
      setProducts(prev => p === 1 ? (data.products || []) : [...prev, ...(data.products || [])]);
      setPage(data.page || p);
      setPages(data.pages || 1);
      setHasMore((data.page || p) < (data.pages || 1));
    } catch (err) {
      console.error('Error fetching search products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // whenever search term changes, reset and fetch first page
    setProducts([]);
    setPage(1);
    setPages(1);
    setHasMore(false);
    if (searchTerm && searchTerm.trim()) {
      fetchSearchPage(1);
    }
  }, [searchTerm]);

  // observe sentinel to fetch more search pages
  useEffect(() => {
    const node = pageSentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !loading) {
          fetchSearchPage(page + 1);
        }
      });
    }, { rootMargin: '400px' });
    io.observe(node);
    return () => io.disconnect();
  }, [pageSentinelRef.current, hasMore, loading, page]);

  return (
    <div className="Home-container">
      <h2 className="search-header">Search Results for "{searchTerm}"</h2>
      <div className="products-container">
        {products.length > 0 ? (() => {
          const elems = [];
          products.forEach((product, i) => {
            const price = typeof product.price === 'string' ? product.price.replace(/^\s*\$/,'AED ') : product.price;
            const p = { ...product, price };
            const batch = Math.floor(i / 12);
            elems.push(<Products key={product._id || product.id} product={p} index={i} batchIndex={batch} />);
            if (i % 12 === 11) elems.push(<div key={`sentf-${batch}`} className="batch-sentinel" data-batch={batch} aria-hidden="true" />);
          });
          if (hasMore) elems.push(<div key={`page-sentinel`} ref={pageSentinelRef} className="page-sentinel" />);
          return elems;
        })() : (
          <div className="no-products">
            <h3>❌ No products found for "{searchTerm}"</h3>
            <button className="btn" onClick={() => navigate("/")}>
              ← Back to Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
