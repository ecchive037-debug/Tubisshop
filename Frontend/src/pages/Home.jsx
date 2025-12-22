import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import "../Style/Home.css";
import Products from '../Components/products.jsx';
import bannerImg from "../assets/home-banner.jpg";
import bannerImg1 from "../assets/second.jpg";
import BannerSlider from "../Components/BannerSlider";
// Footer provided by layout

const API = import.meta.env.VITE_API_URL;

const Home = () => {
  const [search, setSearch] = useState("");
  const [isSearched, setIsSearched] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSeller, setIsSeller] = useState(false);
  const navigate = useNavigate();
  // Products fetched from backend
  const [products, setProducts] = React.useState([]);

  useEffect(() => {
  const adminToken = localStorage.getItem("sellerToken"); // or "adminToken" if you store it like that
  setIsLoggedIn(!!adminToken);
  setIsSeller(!!adminToken);

  // Listen for storage changes (admin logs in/out in another tab)
  const handleStorageChange = () => {
    const updatedAdminToken = localStorage.getItem("sellerToken");
    setIsLoggedIn(!!updatedAdminToken);
    setIsSeller(!!updatedAdminToken);
  };

  // Listen for custom admin login event
  const handleAdminLoggedIn = () => {
    const updatedAdminToken = localStorage.getItem("sellerToken");
    setIsLoggedIn(!!updatedAdminToken);
    setIsSeller(!!updatedAdminToken);
  };

  window.addEventListener("storage", handleStorageChange);
  window.addEventListener("adminLoggedIn", handleAdminLoggedIn);

  return () => {
    window.removeEventListener("storage", handleStorageChange);
    window.removeEventListener("adminLoggedIn", handleAdminLoggedIn);
  };
}, []);

  
  // Fetch products from backend with pagination (initial load and lazy "load more")
  const [page, setPage] = React.useState(1);
  const [pages, setPages] = React.useState(1);
  const [loadingProducts, setLoadingProducts] = React.useState(false);
  const [hasMore, setHasMore] = React.useState(true);
  const pageSentinelRef = React.useRef(null);
  const isMountedRef = React.useRef(true);

  const fetchProductsPage = async (p = 1) => {
    try {
      setLoadingProducts(true);
      const res = await fetch(`${API}/api/products?page=${p}&limit=12`);
      if (!res.ok) throw new Error('Failed to fetch products');
      const data = await res.json();
      if (!isMountedRef.current) return;
      setProducts(prev => p === 1 ? (data.products || []) : [...prev, ...(data.products || [])]);
      setPage(data.page || p);
      setPages(data.pages || 1);
      setHasMore((data.page || p) < (data.pages || 1));
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    fetchProductsPage(1);
    return () => { isMountedRef.current = false; };
  }, []);

  // observe the page sentinel to load the next page
  useEffect(() => {
    const node = pageSentinelRef.current;
    if (!node) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && hasMore && !loadingProducts) {
          fetchProductsPage(page + 1);
        }
      });
    }, { rootMargin: '400px' });
    io.observe(node);
    return () => io.disconnect();
  }, [pageSentinelRef.current, hasMore, loadingProducts, page]);

  // Search button
  const handleSearch = () => {
    if (search.trim() === "") {
      alert("Please enter a search term");
    } else {
      setIsSearched(true);
    }
  };

  // Clear search - show all products again
  const handleClearSearch = () => {
    setSearch("");
    setIsSearched(false);
  };

  // Get filtered products only after search button is clicked
  const filteredProducts = isSearched
    ? products.filter(product => product.title.toLowerCase().includes(search.toLowerCase()))
    : [];

 

  //  Login button → navigate to auth
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
    {!isSearched && (() => {
      const elems = [];
      products.forEach((product, i) => {
        const batch = Math.floor(i / 12);
        elems.push(<Products key={product._id || product.id} product={product} index={i} batchIndex={batch} />);
        if (i % 12 === 11) elems.push(<div key={`sent-${batch}`} className="batch-sentinel" data-batch={batch} aria-hidden="true" />);
      });
      // page sentinel to trigger fetching next page when visible
      if (hasMore) elems.push(<div key={`page-sentinel`} ref={pageSentinelRef} className="page-sentinel" />);
      return elems;
    })()}
    {isSearched && filteredProducts.length > 0 && (() => {
      const elems = [];
      filteredProducts.forEach((product, i) => {
        const batch = Math.floor(i / 12);
        elems.push(<Products key={product._id || product.id} product={product} index={i} batchIndex={batch} />);
        if (i % 12 === 11) elems.push(<div key={`sentf-${batch}`} className="batch-sentinel" data-batch={batch} aria-hidden="true" />);
      });
      // if we implemented search pagination later, we would add a page sentinel here too
      return elems;
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
