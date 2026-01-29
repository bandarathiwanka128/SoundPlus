import React from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FaCheckCircle, FaBox, FaTruck, FaHome } from 'react-icons/fa'
import './OrderSuccess.css'

function OrderSuccess() {
  const location = useLocation()
  const navigate = useNavigate()
  const { orderId, totalAmount, items } = location.state || {}

  if (!orderId) {
    return (
      <div className="order-success-page">
        <div className="error-container">
          <h2>No order found</h2>
          <p>Please complete a purchase first</p>
          <button onClick={() => navigate('/products')} className="btn-shop">
            Browse Products
          </button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="order-success-page"
    >
      <div className="success-container">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="success-icon"
        >
          <FaCheckCircle />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          Order Placed Successfully!
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="success-message"
        >
          Thank you for your purchase. Your order has been confirmed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="order-details"
        >
          <div className="detail-row">
            <span>Order ID</span>
            <span className="order-id">{orderId.slice(-12).toUpperCase()}</span>
          </div>
          <div className="detail-row">
            <span>Total Amount</span>
            <span className="total">${totalAmount?.toFixed(2)}</span>
          </div>
          <div className="detail-row">
            <span>Items</span>
            <span>{items?.length} product(s)</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="order-timeline"
        >
          <div className="timeline-item active">
            <div className="timeline-icon">
              <FaCheckCircle />
            </div>
            <div className="timeline-content">
              <h4>Order Confirmed</h4>
              <p>Your order has been received</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-icon">
              <FaBox />
            </div>
            <div className="timeline-content">
              <h4>Processing</h4>
              <p>We're preparing your order</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-icon">
              <FaTruck />
            </div>
            <div className="timeline-content">
              <h4>Shipping</h4>
              <p>On the way to you</p>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-icon">
              <FaHome />
            </div>
            <div className="timeline-content">
              <h4>Delivered</h4>
              <p>Enjoy your products!</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="success-actions"
        >
          <Link to="/orders" className="btn-view-orders">
            View My Orders
          </Link>
          <Link to="/products" className="btn-continue-shopping">
            Continue Shopping
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="confetti-container"
        >
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#FFD700', '#FFA500', '#00D4FF', '#4CAF50'][Math.floor(Math.random() * 4)]
              }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default OrderSuccess
