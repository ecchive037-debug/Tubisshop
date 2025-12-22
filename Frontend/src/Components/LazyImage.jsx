import React, { useEffect, useRef, useState } from 'react';
import batchLoader from './batchLoader';

const LazyImage = ({ src, alt = '', className = '', style, placeholder = '/placeholder-product.svg', batchIndex, ...props }) => {
  const imgRef = useRef(null);
  const intersectRef = useRef(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    let observer;

    const loadImg = () => {
      if (loaded) return;
      const realSrc = img.dataset && img.dataset.src ? img.dataset.src : src;
      if (realSrc && img.src !== realSrc) img.src = realSrc;
      setLoaded(true);
    };

    const tryLoad = () => {
      if (batchIndex === undefined || batchIndex === null || batchLoader.isAllowed(batchIndex)) {
        if (intersectRef.current) loadImg();
      }
    };

    // subscribe to batch changes: if our batch becomes allowed, attempt load
    const unsub = batchLoader.subscribe(() => {
      tryLoad();
    });

    if ('IntersectionObserver' in window) {
      if (!img.src || img.src === '' || img.src === placeholder) img.dataset.src = src;
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            intersectRef.current = true;
            tryLoad();
            if (observer) observer.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });
      observer.observe(img);
    } else {
      // fallback: load immediately if batch allowed
      if (batchIndex === undefined || batchIndex === null || batchLoader.isAllowed(batchIndex)) loadImg();
    }

    return () => {
      observer && observer.disconnect();
      unsub && typeof unsub === 'function' && unsub();
    };
  }, [src, placeholder, batchIndex, loaded]);

  return (
    <img
      ref={imgRef}
      src={placeholder}
      data-src={src}
      alt={alt}
      className={className}
      style={style}
      loading="lazy"
      decoding="async"
      onError={(e) => { e.target.onerror = null; e.target.src = placeholder; }}
      {...props}
    />
  );
};

export default LazyImage;
