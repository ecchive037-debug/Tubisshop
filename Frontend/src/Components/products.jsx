import React, { useState, useEffect } from 'react'
import '../Style/products.css'
import { useNavigate } from 'react-router-dom';
import truncateTitle from '../utils/truncateTitle';

const Products = ({ product }) => {
  const navigate = useNavigate();

  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let t;
    if (added) t = setTimeout(() => setAdded(false), 2000);
    return () => clearTimeout(t);
  }, [added]);

  const openProductDetail = () => {
    const id = product._id || product.id;
    if (!id) return;
    navigate(`/product/${id}`, { state: { product } });
  };


  const images = (product.images && product.images.length) ? product.images : (product.img ? [product.img] : []);

  return (
    <div className='products'>
      <div className='productCard material' onClick={openProductDetail} role="button" tabIndex={0} onKeyDown={(e)=>{ if(e.key==='Enter') openProductDetail(); }} style={{cursor:'pointer'}}>
        <div className='card-media'>
          <img src={images[0] || '/placeholder-product.svg'} alt={product.title} className='productImage' />   
        </div>

        <div className='card-body'>
          <h3 className='productTitle'>{truncateTitle(product.title, 3) || 'Untitled'}</h3>
          <p className='productPrice material-price'>{product.price} AED</p>
          <div className='card-meta'>
            <button className='view-btn' onClick={(e)=>{ e.stopPropagation(); openProductDetail(); }} aria-label='View product'>View</button>
          </div>
        </div>

        {(added || errorMsg) && (
          <div className={`cart-status ${added ? 'success' : errorMsg ? 'error' : ''}`}>{added ? 'Added to cart' : errorMsg}</div>
        )}
      </div>   
    </div>
  )
}
export default Products
