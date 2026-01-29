import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { toast } from 'react-toastify'

const API_URL = import.meta.env.VITE_API_URL || 'http://51.21.64.104:5000'

const ProductDetail = ({ user, setCartCount }) => {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProduct()
  }, [id])

  const fetchProduct = async () => {
    try {
      const response = await axios.get(`${API_URL}/products/${id}`)
      setProduct(response.data)
    } catch (error) {
      console.error('Error fetching product:', error)
      toast.error('Failed to load product')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = async () => {
    if (!user) {
      toast.error('Please login to add items to cart')
      return
    }
    try {
      const token = localStorage.getItem('token')
      await axios.post(
        `${API_URL}/add-to-cart`,
        { userId: user.id, productId: id, quantity: 1 },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setCartCount((prev) => prev + 1)
      toast.success('Added to cart!')
    } catch (error) {
      toast.error('Failed to add to cart')
    }
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

  if (!product) {
    return (
      <div className="page">
        <div className="container">
          <h1>Product not found</h1>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <div className="container">
        <div className="product-detail" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3rem', padding: '2rem 0' }}>
          <div>
            <img
              src={product.image || 'https://via.placeholder.com/500'}
              alt={product.name}
              style={{ width: '100%', borderRadius: '20px' }}
            />
          </div>
          <div>
            <h1>{product.name}</h1>
            <p style={{ color: 'var(--tech-blue)', fontSize: '1.25rem', marginBottom: '1rem' }}>{product.brand}</p>
            <p style={{ fontSize: '3rem', color: 'var(--primary-yellow)', fontWeight: '800' }}>${product.price}</p>
            <p style={{ margin: '2rem 0', lineHeight: '1.8' }}>{product.description}</p>
            <div style={{ marginBottom: '2rem' }}>
              <p><strong>Category:</strong> {product.category}</p>
              <p><strong>Connectivity:</strong> {product.connectivity}</p>
              <p><strong>Available:</strong> {product.available} in stock</p>
            </div>
            <button onClick={handleAddToCart} className="btn btn-primary btn-lg">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail
