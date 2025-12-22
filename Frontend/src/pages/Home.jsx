import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../Style/Home.css";
import Products from '../Components/products.jsx';
import SkeletonLoader from '../Components/SkeletonLoader.jsx';
import bannerImg from "../assets/home-banner.jpg";
import bannerImg1 from "../assets/second.jpg";
import BannerSlider from "../Components/BannerSlider";
// Footer provided by layout

const API = import.meta.env.VITE_API_URL;
const PRODUCTS_PER_PAGE = 5;
const API_CALL_DELAY = 300; // 300ms delay between API calls

// Local cache config (store fetched products so page can show instantly on reload)
const CACHE_KEY = 'tubisshop_products_v1';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

const loadCache = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - (parsed.timestamp || 0) > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    return parsed;
  } catch (err) {
    return null;
  }
};

const saveCache = ({ products, page, pages }) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ products, page, pages, timestamp: Date.now() }));
  } catch (err) {
    // ignore quota errors
  }
};

const Home = () => {
  const [search, setSearch] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [pages, setPages] = useState(0);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  const pageSentinelRef = useRef(null);
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef(null);
  const lastFetchTimeRef = useRef(0);

  const fetchProductsPage = useCallback(async (p = 1) => {
    if (!isMountedRef.current) return;
    
    // Cancel previous request if exists
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      setLoadingProducts(true);
      
      // Add delay between requests to avoid overwhelming server
      const timeSinceLastFetch = Date.now() - lastFetchTimeRef.current;
      if (timeSinceLastFetch < API_CALL_DELAY) {
        await new Promise(resolve => setTimeout(resolve, API_CALL_DELAY - timeSinceLastFetch));
      }
      
      const res = await fetch(
        `${API}/api/products?page=${p}&limit=${PRODUCTS_PER_PAGE}`,
        { signal: abortControllerRef.current.signal }
      );
      
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      lastFetchTimeRef.current = Date.now();
      
      if (!isMountedRef.current) return;
      
      // Reset products if fetching first page, else append
      if (p === 1) {
        const newProducts = data.products || [];
        setProducts(newProducts);
        setPages(data.pages || 1);
        setPage(1);
        setInitialLoadDone(true);
        // persist first page to cache
        saveCache({ products: newProducts, page: data.page || 1, pages: data.pages || 1 });
      } else {
        setProducts(prev => {
          const newProducts = [...prev, ...(data.products || [])];
          // persist appended products to cache
          saveCache({ products: newProducts, page: data.page || p, pages: data.pages || 1 });
          return newProducts;
        });
        setPage(data.page || p);
      }
      
      // Check if there are more products to load
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
        setLoadingProducts(false);
      }
    }
  }, []);

  // DO NOT fetch on mount - wait for user scroll
  useEffect(() => {
    isMountedRef.current = true;

    // Load cached products so page shows instantly on reload/return
    const cached = loadCache();
    if (cached && cached.products && cached.products.length > 0) {
      setProducts(cached.products);
      setPage(cached.page || 1);
      setPages(cached.pages || 1);
      setInitialLoadDone(true);
      setHasMore((cached.page || 1) < (cached.pages || 1));
    }

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
          else if (hasMore && !loadingProducts && page > 0) {
            fetchProductsPage(page + 1);
          }
        }
      });
    }, { rootMargin: '400px' });
    
    io.observe(node);
    return () => io.disconnect();
  }, [hasMore, loadingProducts, page, initialLoadDone, fetchProductsPage]);

  const handleSearch = useCallback(() => {
    if (search.trim() === "") {
      alert("Please enter a search term");
    } else {
      setIsSearched(true);
    }
  }, [search]);

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setIsSearched(false);
  }, []);

  const filteredProducts = useMemo(() => {
    return isSearched
      ? products.filter(product => product.title.toLowerCase().includes(search.toLowerCase()))
      : [];
  }, [isSearched, products, search]);

  const handleLoginClick = () => {
    navigate("/auth");
  };

  return (
  <div className="Home-container">
        <BannerSlider images={[bannerImg, bannerImg1]} interval={4500} width={1500} height={340} />
        <div className="Recomend-text">Recommended items</div>
        <div className="products-container">
    {isSearched && filteredProducts.length > 0 && (
      <div style={{gridColumn: "1 / -1", marginBottom: "20px"}}>
        <button className="btn" onClick={handleClearSearch} style={{backgroundColor: "#ff7a00", color: "white"}}>
          ← Back to All Products
        </button>
      </div>
    )}
    {!isSearched && !initialLoadDone && (
      <SkeletonLoader count={5} />
    )}
    {!isSearched && (() => {
      return products.map((product) => (
        <Products key={product._id || product.id} product={product} />
      ));
    })()}
    {!isSearched && loadingProducts && initialLoadDone && (
      <SkeletonLoader count={5} />
    )}
    {!isSearched && hasMore && (
      <div key={`page-sentinel`} ref={pageSentinelRef} style={{ height: '1px' }} />
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
        <button className="btn" onClick={handleClearSearch} style={{marginTop: "20px"}}>
          ← Back to All Products
        </button>
      </div>
    )}
    </div>
  {/* Footer rendered globally by PublicLayout */}
 </div>
 
  );
};

export default Home;
