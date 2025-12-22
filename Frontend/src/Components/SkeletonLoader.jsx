import React from 'react';
import '../Style/SkeletonLoader.css';

const SkeletonLoader = ({ count = 5 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div key={`skeleton-${index}`} className="skeleton-product-card">
          <div className="skeleton-image" />
          <div className="skeleton-body">
            <div className="skeleton-title" />
            <div className="skeleton-price" />
            <div className="skeleton-button" />
          </div>
        </div>
      ))}
    </>
  );
};

export default SkeletonLoader;
