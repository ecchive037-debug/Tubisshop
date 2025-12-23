import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "../Style/Home.css";
import Products from "../Components/products.jsx";
import SkeletonLoader from "../Components/SkeletonLoader.jsx";
import BannerSlider from "../Components/BannerSlider";
import bannerImg from "../assets/home-banner.jpg";
import bannerImg1 from "../assets/second.jpg";

const API = import.meta.env.VITE_API_URL;
const PRODUCTS_PER_PAGE = 18;

import { getAllCachedProducts, setProductsInCache } from '../utils/productCache';

/* ------------------------------------------------ */

const Home = () => {
  const navigate = useNavigate();
  const sentinelRef = useRef(null);
  const isFetchingRef = useRef(false);

  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState("");
  const [isSearched, setIsSearched] = useState(false);

  /* ---------------- FETCH FUNCTION ---------------- */
  const fetchProducts = useCallback(
    async (p = 1) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      try {
        setLoading(true);
        const res = await fetch(
          `${API}/api/products?page=${p}&limit=${PRODUCTS_PER_PAGE}`
        );
        const data = await res.json();

        // Ensure data.products is always an array
        const fetchedProducts = Array.isArray(data.products)
          ? data.products
          : [];

        setProducts((prev) =>
          p === 1 ? fetchedProducts : [...prev, ...fetchedProducts]
        );
        setPage(data.page);
        setPages(data.pages);
        setHasMore(data.page < data.pages);

        // persist to shared cache
        setProductsInCache({
          products: p === 1 ? fetchedProducts : [...products, ...fetchedProducts],
          page: data.page,
          pages: data.pages,
        });
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [products]
  );
  /* ------------------------------------------------ */

  /* -------- INSTANT LOAD FROM CACHE -------- */
  useEffect(() => {
    const cached = getAllCachedProducts();
    if (cached) {
      setProducts(cached.products || []);
      setPage(cached.page || 1);
      setPages(cached.pages || 1);
      setHasMore((cached.page || 1) < (cached.pages || 1));
      setLoading(false);
    }
    fetchProducts(1); // background refresh
  }, []);
  /* ---------------------------------------- */

  /* -------- INFINITE SCROLL (NEXT PAGES ONLY) -------- */
  useEffect(() => {
    if (!sentinelRef.current || !hasMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          fetchProducts(page + 1);
        }
      },
      { rootMargin: "300px" }
    );

    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [page, hasMore, loading, fetchProducts]);
  /* -------------------------------------------------- */

  /* ---------------- SEARCH ---------------- */
  const filteredProducts = useMemo(() => {
    if (!isSearched) return [];
    return products.filter((p) =>
      p.title?.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, isSearched, products]);
  /* ---------------------------------------- */

  return (
    <div className="Home-container">
      <BannerSlider images={[bannerImg, bannerImg1]} interval={4500} />

      <div className="Recomend-text">Recommended items</div>

      <div className="products-container">
        {!isSearched &&
          products?.map((product) => (
            <Products key={product._id} product={product} />
          ))}

        {loading && <SkeletonLoader count={18} />}

        {!isSearched && hasMore && (
          <div ref={sentinelRef} style={{ height: 1 }} />
        )}

        {isSearched &&
          filteredProducts?.map((product) => (
            <Products key={product._id} product={product} />
          ))}

        {/* Optional: empty state */}
        {(!loading && !isSearched && products.length === 0) && (
          <p>No products found</p>
        )}
        {(!loading && isSearched && filteredProducts.length === 0) && (
          <p>No products match your search</p>
        )}
      </div>
    </div>
  );
};

export default Home;
