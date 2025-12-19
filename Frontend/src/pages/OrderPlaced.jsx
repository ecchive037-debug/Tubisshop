import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../Style/OrderPlaced.css';
import truncateTitle from '../utils/truncateTitle';

const OrderPlaced = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const order = state?.order || null;

  if (!order) {
    return (
      <div className="order-container">
        <h2 className="order-title">Order placed</h2>
        <p className="order-subtitle">No order details available.</p>

        <div className="order-btn-wrapper">
          <button className="Continue-Shopping" onClick={() => navigate('/')}>
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const total = order.totalAmount ?? order.total ?? 0;

  return (
    <div className="order-container">
      <h2 className="order-title">Thank you — your order is placed</h2>

      <div className="order-card">
        <div className="order-header">
          <div>
            <div className="label">Order ID</div>
            <div className="value">{order._id}</div>
          </div>
          <div className="right">
            <div className="label">Placed</div>
            <div>{new Date(order.createdAt).toLocaleString()}</div>
          </div>
        </div>

        <div className="order-items">
          <h4>Items</h4>

          {(order.items || []).map(it => (
            <div key={it.product} className="order-item">
              <div className="item-left">
                <img
                  src={it.img || '/placeholder.png'}
                  alt={it.title}
                />
                <div>
                  <div className="item-title">{truncateTitle(it.title || 'Untitled', 3)}</div>
                  <div className="item-meta">
                    {it.quantity} × {it.price} AED
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="order-footer">
          <div>
            {order.shippingAddress ? (
              <div className="shipping">
              </div>
            ) : (
              <div className="muted">No shipping info</div>
            )}
          </div>

          <div className="right">
            <div className="label">Total</div>
            <div className="total">AED {Number(total).toFixed(2)}</div>
          </div>
        </div>
      </div>

      {/* Bottom Button */}
      <div className="order-btn-wrapper">
        <button className="Continue-Shopping" onClick={() => navigate('/')}>
          Continue Shopping
        </button>
      </div>
    </div>
  );
};

export default OrderPlaced;
