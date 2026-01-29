import React, { useState, useEffect } from 'react'
import axios from 'axios'
import Hero from '../components/Hero'
import ProductCard from '../components/ProductCard'
import { Link } from 'react-router-dom'
import { FaArrowRight, FaHeadphones, FaShieldAlt, FaTruck, FaUndo } from 'react-icons/fa'
import './Home.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://51.21.64.104:5000'

const Home = () => {
  const [featuredProducts, setFeaturedProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeaturedProducts()
  }, [])

  const fetchFeaturedProducts = async () => {
    try {
      const response = await axios.get(`${API_URL}/products?limit=6`)
      setFeaturedProducts(response.data.slice(0, 6))
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: <FaTruck />,
      title: 'Free Shipping',
      description: 'Free shipping on all orders over $50'
    },
    {
      icon: <FaShieldAlt />,
      title: 'Secure Payment',
      description: '100% secure payment processing'
    },
    {
      icon: <FaUndo />,
      title: '30-Day Return',
      description: 'Easy returns within 30 days'
    },
    {
      icon: <FaHeadphones />,
      title: '24/7 Support',
      description: 'Dedicated customer support'
    }
  ]

  const categories = [
    {
      name: 'Wireless Headphones',
      image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
      link: '/products?category=wireless'
    },
    {
      name: 'True Wireless Earbuds',
      image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400',
      link: '/products?category=earbuds'
    },
    {
      name: 'Gaming Headsets',
      image: 'https://images.unsplash.com/photo-1599669454699-248893623440?w=400',
      link: '/products?category=gaming'
    },
    {
      name: 'Studio Monitors',
      image: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=400',
      link: '/products?category=studio'
    }
  ]

  return (
    <div className="home-page">
      <Hero />

      {/* Features Section */}
      <section className="features-section section">
        <div className="container">
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">{feature.icon}</div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <p className="section-subtitle">Find the perfect audio equipment for your needs</p>
          </div>
          <div className="categories-grid">
            {categories.map((category, index) => (
              <Link key={index} to={category.link} className="category-card">
                <div className="category-image-wrapper">
                  <img src={category.image} alt={category.name} className="category-image" />
                  <div className="category-overlay"></div>
                </div>
                <h3 className="category-name">{category.name}</h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <p className="section-subtitle">Check out our latest and greatest audio equipment</p>
          </div>
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
            </div>
          ) : (
            <>
              <div className="products-grid">
                {featuredProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>
              <div className="section-footer">
                <Link to="/products" className="btn btn-primary">
                  View All Products <FaArrowRight />
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">Ready to Experience Premium Sound?</h2>
            <p className="cta-description">
              Join thousands of satisfied customers and discover the difference quality audio makes
            </p>
            <Link to="/products" className="btn btn-primary btn-lg">
              Start Shopping Now
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home
