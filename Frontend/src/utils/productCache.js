// Product cache manager to avoid refetching and store products in localStorage
const CACHE_KEY = 'product_cache';
const CACHE_EXPIRY_KEY = 'product_cache_expiry';
const CACHE_PAGE_KEY = 'product_cache_page';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes
const MAX_CACHED_PRODUCTS = 60; // Cache only up to 10 pages worth (6 products per page)

export const getProductsFromCache = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (!cached || !expiry) return null;
    
    // Check if cache has expired
    if (Date.now() > parseInt(expiry)) {
      clearProductsCache();
      return null;
    }
    
    const products = JSON.parse(cached);
    
    // Return only the first 6 products from cache to avoid loading all at once
    // This ensures the page refreshes fast with partial data
    return products.slice(0, 6);
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

export const getAllCachedProducts = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    
    if (!cached || !expiry) return null;
    
    if (Date.now() > parseInt(expiry)) {
      clearProductsCache();
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

export const setProductsInCache = (products) => {
  try {
    // Limit cached products to MAX_CACHED_PRODUCTS to prevent memory issues
    const limitedProducts = products.slice(0, MAX_CACHED_PRODUCTS);
    localStorage.setItem(CACHE_KEY, JSON.stringify(limitedProducts));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const clearProductsCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
    localStorage.removeItem(CACHE_PAGE_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const appendProductsToCache = (newProducts) => {
  try {
    const existing = getAllCachedProducts() || [];
    const merged = [...existing, ...newProducts];
    
    // Remove duplicates based on _id
    const unique = Array.from(
      new Map(merged.map(p => [p._id || p.id, p])).values()
    );
    
    // Limit to MAX_CACHED_PRODUCTS
    const limited = unique.slice(0, MAX_CACHED_PRODUCTS);
    setProductsInCache(limited);
    return limited;
  } catch (error) {
    console.error('Error appending to cache:', error);
    return newProducts;
  }
};
