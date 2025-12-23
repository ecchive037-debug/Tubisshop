// Product cache manager to avoid refetching and store products in localStorage
const CACHE_KEY = 'tubisshop_products_v2';
const CACHE_EXPIRY_KEY = 'product_cache_expiry';
const CACHE_DURATION = 1000 * 60 * 30; // 30 minutes default (Home previously used 30m)
const MAX_CACHED_PRODUCTS = 200;

const now = () => Date.now();

export const getAllCachedProducts = () => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    const expiry = localStorage.getItem(CACHE_EXPIRY_KEY);
    if (!raw || !expiry) return null;
    if (now() > parseInt(expiry)) {
      clearProductsCache();
      return null;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading cache', err);
    return null;
  }
};

export const getProductsFromCache = () => {
  const cached = getAllCachedProducts();
  if (!cached) return null;
  return cached.products || null;
};

export const setProductsInCache = (payload) => {
  try {
    // payload can be an array of products or an object { products, page, pages }
    const out = { products: [], page: 1, pages: 1 };
    if (Array.isArray(payload)) out.products = payload.slice(0, MAX_CACHED_PRODUCTS);
    else if (payload && typeof payload === 'object') {
      out.products = Array.isArray(payload.products) ? payload.products.slice(0, MAX_CACHED_PRODUCTS) : [];
      out.page = payload.page || out.page;
      out.pages = payload.pages || out.pages;
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(out));
    localStorage.setItem(CACHE_EXPIRY_KEY, (now() + CACHE_DURATION).toString());
    return out;
  } catch (err) {
    console.error('Error writing cache', err);
    return null;
  }
};

export const clearProductsCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
    localStorage.removeItem(CACHE_EXPIRY_KEY);
  } catch (err) {
    console.error('Error clearing cache', err);
  }
};

export const appendProductsToCache = (newProducts) => {
  try {
    const cached = getAllCachedProducts() || { products: [] };
    const merged = [...(cached.products || []), ...newProducts];
    const unique = Array.from(new Map(merged.map(p => [p._id || p.id, p])).values());
    const limited = unique.slice(0, MAX_CACHED_PRODUCTS);
    const out = { products: limited, page: cached.page || 1, pages: cached.pages || 1 };
    setProductsInCache(out);
    return out;
  } catch (err) {
    console.error('Error appending to cache', err);
    return { products: newProducts };
  }
};
