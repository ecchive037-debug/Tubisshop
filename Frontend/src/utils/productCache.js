// Product cache manager to avoid refetching and store products in localStorage
const CACHE_KEY = 'product_cache';
const CACHE_EXPIRY_KEY = 'product_cache_expiry';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes

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
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Error reading from cache:', error);
    return null;
  }
};

export const setProductsInCache = (products) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(products));
    localStorage.setItem(CACHE_EXPIRY_KEY, (Date.now() + CACHE_DURATION).toString());
  } catch (error) {
    console.error('Error writing to cache:', error);
  }
};

export const clearProductsCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch (error) {
    console.error('Error clearing cache:', error);
  }
};

export const appendProductsToCache = (newProducts) => {
  try {
    const existing = getProductsFromCache() || [];
    const merged = [...existing, ...newProducts];
    // Remove duplicates based on _id
    const unique = Array.from(
      new Map(merged.map(p => [p._id || p.id, p])).values()
    );
    setProductsInCache(unique);
    return unique;
  } catch (error) {
    console.error('Error appending to cache:', error);
    return newProducts;
  }
};
