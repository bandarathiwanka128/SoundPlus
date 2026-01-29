import React, { useState, useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Products from './pages/Products'
import ProductDetail from './pages/ProductDetail'
import Cart from './pages/Cart'
import Checkout from './pages/Checkout'
import OrderSuccess from './pages/OrderSuccess'
import Login from './pages/Login'
import Register from './pages/Register'
import AdminDashboard from './pages/AdminDashboard'
import Orders from './pages/Orders'
import './App.css'

function App() {
  const [user, setUser] = useState(null)
  const [cartCount, setCartCount] = useState(0)

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  return (
    <div className="app">
      <Navbar user={user} setUser={setUser} cartCount={cartCount} />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/products/:id" element={<ProductDetail user={user} setCartCount={setCartCount} />} />
          <Route path="/cart" element={<Cart user={user} setCartCount={setCartCount} />} />
          <Route path="/checkout" element={<Checkout user={user} />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/register" element={<Register setUser={setUser} />} />
          <Route path="/admin" element={<AdminDashboard user={user} />} />
          <Route path="/orders" element={<Orders user={user} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App
