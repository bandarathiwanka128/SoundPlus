import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_API_URL || 'http://51.21.64.104:5000'

const Cart = ({ user, setCartCount }) => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchCart()
  }, [user])

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/cart/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCartItems(response.data)
      setCartCount(response.data.length)
    } catch (error) {
      console.error('Error fetching cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = async (productId) => {
    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/cart/${user.id}/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      toast.success('Item removed from cart')
      fetchCart()
    } catch (error) {
      toast.error('Failed to remove item')
    }
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      return total + (item.productId?.price || 0) * item.quantity
    }, 0).toFixed(2)
  }

  if (loading) {
    return (
      <div className="page">
        <div className="container loading-container">
          <div className="spinner"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container">
        <h1>Shopping Cart</h1>
        {cartItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '5rem 0' }}>
            <p style={{ fontSize: '1.25rem', marginBottom: '2rem' }}>Your cart is empty</p>
            <button className="btn btn-primary" onClick={() => navigate('/products')}>
              Continue Shopping
            </button>
          </div>
        ) : (
          <div style={{ marginTop: '2rem' }}>
            {cartItems.map((item) => (
              <div
                key={item._id}
                style={{
                  display: 'flex',
                  gap: '2rem',
                  padding: '2rem',
                  background: 'var(--dark-gray)',
                  borderRadius: '15px',
                  marginBottom: '1rem',
                  alignItems: 'center'
                }}
              >
                <img
                  src={`${API_URL}${item.productId?.image}`}
                  alt={item.productId?.name}
                  style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '10px' }}
                />
                <div style={{ flex: 1 }}>
                  <h3>{item.productId?.name}</h3>
                  <p>Quantity: {item.quantity}</p>
                  <p style={{ color: 'var(--primary-yellow)', fontSize: '1.5rem', fontWeight: '700' }}>
                    ${item.productId?.price}
                  </p>
                </div>
                <button className="btn btn-outline" onClick={() => handleRemoveItem(item.productId?._id)}>
                  Remove
                </button>
              </div>
            ))}
            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
              <h2>Total: ${calculateTotal()}</h2>
              <button className="btn btn-primary btn-lg" style={{ marginTop: '1rem' }} onClick={() => navigate('/checkout')}>
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Cart
