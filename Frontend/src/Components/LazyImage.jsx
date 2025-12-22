import React, { useEffect, useRef, useState } from 'react';

const LazyImage = ({ src, alt = '', className = '', style, placeholder = '/placeholder-product.svg', ...props }) => {
  const imgRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    setLoaded(false);
    if (img.dataset) img.dataset.src = src;

    const loadImg = () => {
      const realSrc = img.dataset && img.dataset.src ? img.dataset.src : src;
      if (!realSrc) return;
      if (img.src !== realSrc) img.src = realSrc;
      setLoaded(true);
    };

    if ('IntersectionObserver' in window) {
      if (!img.src || img.src === '' || img.src === placeholder) img.dataset.src = src;
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting || entry.intersectionRatio > 0) {
            loadImg();
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '100px' });
      observer.observe(img);
      return () => observer.disconnect();
    } else {
      loadImg();
    }
  }, [src, placeholder]);

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
