import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FaHome, FaBox, FaTags, FaShoppingCart, FaUsers, FaClipboardList,
  FaPlus, FaEdit, FaTrash, FaEye, FaEyeSlash, FaSearch, FaTimes,
  FaDollarSign, FaChartLine
} from 'react-icons/fa'
import { toast } from 'react-toastify'
import axios from 'axios'
import './AdminDashboard.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

// Stats Card Component
const StatsCard = ({ icon: Icon, title, value, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="stats-card"
    style={{ '--accent-color': color }}
  >
    <div className="stats-icon" style={{ background: `${color}20`, color }}>
      <Icon />
    </div>
    <div className="stats-info">
      <h3>{value}</h3>
      <p>{title}</p>
    </div>
  </motion.div>
)

// Modal Component
const Modal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="modal-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="modal-content"
          onClick={e => e.stopPropagation()}
        >
          <div className="modal-header">
            <h3>{title}</h3>
            <button onClick={onClose} className="modal-close">
              <FaTimes />
            </button>
          </div>
          <div className="modal-body">
            {children}
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
)

function AdminDashboard({ user }) {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [stats, setStats] = useState(null)
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [users, setUsers] = useState([])
  const [carts, setCarts] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal states
  const [showProductModal, setShowProductModal] = useState(false)
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showOrderModal, setShowOrderModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [selectedOrder, setSelectedOrder] = useState(null)

  // Product form state
  const [productForm, setProductForm] = useState({
    name: '', brand: '', model: '', price: '', category: 'headphones',
    connectivity: 'wireless', description: '', available: '', discount: '0%',
    color: 'Black', noiseCancellation: false, microphone: false, image: null
  })

  // Category form state
  const [categoryForm, setCategoryForm] = useState({
    name: '', description: '', isActive: true, order: 0, image: null
  })

  const token = localStorage.getItem('token')
  const authHeader = { headers: { Authorization: `Bearer ${token}` } }

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/login')
      return
    }
    fetchData()
  }, [user, navigate])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all data in parallel with individual error handling
      const results = await Promise.allSettled([
        axios.get(`${API_URL}/admin/stats`, authHeader),
        axios.get(`${API_URL}/products?showAll=true`, authHeader),
        axios.get(`${API_URL}/categories`, authHeader),
        axios.get(`${API_URL}/orders`, authHeader),
        axios.get(`${API_URL}/admin/users`, authHeader),
        axios.get(`${API_URL}/admin/carts`, authHeader)
      ])

      // Process results
      if (results[0].status === 'fulfilled') setStats(results[0].value.data)
      if (results[1].status === 'fulfilled') setProducts(results[1].value.data)
      if (results[2].status === 'fulfilled') setCategories(results[2].value.data)
      if (results[3].status === 'fulfilled') setOrders(results[3].value.data)
      if (results[4].status === 'fulfilled') setUsers(results[4].value.data)
      if (results[5].status === 'fulfilled') setCarts(results[5].value.data)

      // Check for any failures
      const failed = results.filter(r => r.status === 'rejected')
      if (failed.length > 0) {
        console.error('Some requests failed:', failed)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Error loading dashboard data')
    }
    setLoading(false)
  }

  // Product handlers
  const handleProductSubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()

    // Add all form fields to FormData
    formData.append('name', productForm.name)
    formData.append('brand', productForm.brand)
    formData.append('model', productForm.model)
    formData.append('price', productForm.price)
    formData.append('category', productForm.category)
    formData.append('connectivity', productForm.connectivity)
    formData.append('description', productForm.description)
    formData.append('available', productForm.available || 0)
    formData.append('discount', productForm.discount || '0%')
    formData.append('color', productForm.color || 'Black')
    formData.append('noiseCancellation', productForm.noiseCancellation ? 'true' : 'false')
    formData.append('microphone', productForm.microphone ? 'true' : 'false')

    // Add image if selected
    if (productForm.image) {
      formData.append('image', productForm.image)
    }

    try {
      if (editingProduct) {
        const response = await axios.put(`${API_URL}/update-product/${editingProduct._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        console.log('Update response:', response.data)
        toast.success('Product updated successfully!')
      } else {
        const response = await axios.post(`${API_URL}/add-product`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        console.log('Add response:', response.data)
        toast.success('Product added successfully!')
      }
      setShowProductModal(false)
      resetProductForm()
      fetchData()
    } catch (error) {
      console.error('Product save error:', error.response?.data || error)
      toast.error(error.response?.data?.message || 'Error saving product')
    }
  }

  const handleEditProduct = (product) => {
    setEditingProduct(product)
    setProductForm({
      name: product.name,
      brand: product.brand,
      model: product.model,
      price: product.price,
      category: product.category,
      connectivity: product.connectivity,
      description: product.description,
      available: product.available,
      discount: product.discount,
      color: product.color,
      noiseCancellation: product.noiseCancellation,
      microphone: product.microphone,
      image: null
    })
    setShowProductModal(true)
  }

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return
    try {
      const response = await axios.delete(`${API_URL}/delete-product/${id}`, authHeader)
      console.log('Delete response:', response.data)
      toast.success('Product deleted successfully!')
      fetchData()
    } catch (error) {
      console.error('Delete error:', error.response?.data || error)
      toast.error(error.response?.data?.message || 'Error deleting product')
    }
  }

  const handleToggleVisibility = async (id) => {
    try {
      const response = await axios.put(`${API_URL}/products/${id}/visibility`, {}, authHeader)
      console.log('Visibility response:', response.data)
      const product = response.data.product
      toast.success(`Product ${product.isVisible ? 'shown' : 'hidden'} successfully!`)
      fetchData()
    } catch (error) {
      console.error('Visibility error:', error.response?.data || error)
      toast.error(error.response?.data?.message || 'Error updating visibility')
    }
  }

  const handleUpdateStock = async (id, newStock) => {
    try {
      const response = await axios.put(`${API_URL}/update-product/${id}`, { available: newStock }, authHeader)
      console.log('Stock update response:', response.data)
      toast.success('Stock updated!')
      fetchData()
    } catch (error) {
      console.error('Stock update error:', error.response?.data || error)
      toast.error('Error updating stock')
    }
  }

  const handleUpdatePrice = async (id, newPrice) => {
    try {
      const response = await axios.put(`${API_URL}/update-product/${id}`, { price: newPrice }, authHeader)
      console.log('Price update response:', response.data)
      toast.success('Price updated!')
      fetchData()
    } catch (error) {
      console.error('Price update error:', error.response?.data || error)
      toast.error('Error updating price')
    }
  }

  const resetProductForm = () => {
    setEditingProduct(null)
    setProductForm({
      name: '', brand: '', model: '', price: '', category: 'headphones',
      connectivity: 'wireless', description: '', available: '', discount: '0%',
      color: 'Black', noiseCancellation: false, microphone: false, image: null
    })
  }

  // Category handlers
  const handleCategorySubmit = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append('name', categoryForm.name)
    formData.append('description', categoryForm.description || '')
    formData.append('isActive', categoryForm.isActive ? 'true' : 'false')
    formData.append('order', categoryForm.order || 0)
    if (categoryForm.image) {
      formData.append('image', categoryForm.image)
    }

    try {
      if (editingCategory) {
        const response = await axios.put(`${API_URL}/categories/${editingCategory._id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        console.log('Category update response:', response.data)
        toast.success('Category updated successfully!')
      } else {
        const response = await axios.post(`${API_URL}/categories`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
        console.log('Category add response:', response.data)
        toast.success('Category added successfully!')
      }
      setShowCategoryModal(false)
      setCategoryForm({ name: '', description: '', isActive: true, order: 0, image: null })
      setEditingCategory(null)
      fetchData()
    } catch (error) {
      console.error('Category save error:', error.response?.data || error)
      toast.error(error.response?.data?.message || 'Error saving category')
    }
  }

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return
    try {
      const response = await axios.delete(`${API_URL}/categories/${id}`, authHeader)
      console.log('Category delete response:', response.data)
      toast.success('Category deleted successfully!')
      fetchData()
    } catch (error) {
      console.error('Category delete error:', error.response?.data || error)
      toast.error(error.response?.data?.message || 'Error deleting category')
    }
  }

  const handleToggleCategoryActive = async (category) => {
    try {
      const formData = new FormData()
      formData.append('isActive', !category.isActive ? 'true' : 'false')
      await axios.put(`${API_URL}/categories/${category._id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })
      toast.success(`Category ${!category.isActive ? 'activated' : 'deactivated'}!`)
      fetchData()
    } catch (error) {
      console.error('Category toggle error:', error)
      toast.error('Error updating category status')
    }
  }

  // Order handlers
  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await axios.put(`${API_URL}/orders/${orderId}`, { status }, authHeader)
      toast.success('Order status updated')
      fetchData()
      setShowOrderModal(false)
    } catch (error) {
      toast.error('Error updating order')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: '#FFA500',
      processing: '#00D4FF',
      shipped: '#9C27B0',
      delivered: '#4CAF50',
      cancelled: '#f44336'
    }
    return colors[status] || '#888'
  }

  // Sidebar tabs
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome },
    { id: 'products', label: 'Products', icon: FaBox },
    { id: 'categories', label: 'Categories', icon: FaTags },
    { id: 'orders', label: 'Orders', icon: FaClipboardList },
    { id: 'users', label: 'Users', icon: FaUsers },
    { id: 'carts', label: 'Carts', icon: FaShoppingCart }
  ]

  if (loading) {
    return (
      <div className="admin-loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    )
  }

  return (
    <div className="admin-dashboard">
      {/* Sidebar */}
      <motion.aside
        initial={{ x: -250 }}
        animate={{ x: 0 }}
        className="admin-sidebar"
      >
        <div className="sidebar-header">
          <h2>Admin Panel</h2>
        </div>
        <nav className="sidebar-nav">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </motion.aside>

      {/* Main Content */}
      <main className="admin-main">
        <AnimatePresence mode="wait">
          {/* Dashboard Overview */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="dashboard-content"
            >
              <h1>Dashboard Overview</h1>

              <div className="stats-grid">
                <StatsCard icon={FaUsers} title="Total Users" value={stats?.totalUsers || 0} color="#00D4FF" />
                <StatsCard icon={FaBox} title="Products" value={stats?.totalProducts || 0} color="#FFD700" />
                <StatsCard icon={FaClipboardList} title="Orders" value={stats?.totalOrders || 0} color="#9C27B0" />
                <StatsCard icon={FaDollarSign} title="Revenue" value={`$${(stats?.totalRevenue || 0).toFixed(2)}`} color="#4CAF50" />
              </div>

              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <h3>Recent Orders</h3>
                  <div className="recent-orders">
                    {orders.slice(0, 5).map(order => (
                      <div key={order._id} className="recent-order-item">
                        <div className="order-info">
                          <span className="order-id">#{order._id.slice(-6).toUpperCase()}</span>
                          <span className="order-user">{order.userId?.username || 'Unknown'}</span>
                        </div>
                        <span className="order-amount">${order.totalAmount?.toFixed(2)}</span>
                        <span className="order-status" style={{ color: getStatusColor(order.status) }}>
                          {order.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="dashboard-card">
                  <h3>Order Status</h3>
                  <div className="status-breakdown">
                    {stats?.ordersByStatus?.map(item => (
                      <div key={item._id} className="status-item">
                        <span className="status-label" style={{ color: getStatusColor(item._id) }}>
                          {item._id}
                        </span>
                        <span className="status-count">{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Products Management */}
          {activeTab === 'products' && (
            <motion.div
              key="products"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="products-content"
            >
              <div className="content-header">
                <h1>Products Management</h1>
                <button className="btn-add" onClick={() => { resetProductForm(); setShowProductModal(true) }}>
                  <FaPlus /> Add Product
                </button>
              </div>

              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="products-table">
                <table>
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Stock</th>
                      <th>Visible</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products
                      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(product => (
                        <tr key={product._id}>
                          <td>
                            <img src={`${API_URL}${product.image}`} alt={product.name} />
                          </td>
                          <td>
                            <div className="product-name">
                              <strong>{product.name}</strong>
                              <span>{product.brand}</span>
                            </div>
                          </td>
                          <td><span className="category-badge">{product.category}</span></td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                              <span>$</span>
                              <input
                                type="number"
                                className="price-input"
                                defaultValue={product.price}
                                min="0"
                                step="0.01"
                                onBlur={(e) => {
                                  const newPrice = parseFloat(e.target.value) || 0
                                  if (newPrice !== product.price) {
                                    handleUpdatePrice(product._id, newPrice)
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.target.blur()
                                  }
                                }}
                                style={{
                                  width: '80px',
                                  padding: '0.5rem',
                                  background: 'rgba(0,0,0,0.3)',
                                  border: '1px solid rgba(255,255,255,0.1)',
                                  borderRadius: '6px',
                                  color: '#FFD700',
                                  textAlign: 'right',
                                  fontWeight: '600'
                                }}
                              />
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              className="stock-input"
                              defaultValue={product.available}
                              min="0"
                              onBlur={(e) => {
                                const newStock = parseInt(e.target.value) || 0
                                if (newStock !== product.available) {
                                  handleUpdateStock(product._id, newStock)
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.target.blur()
                                }
                              }}
                              style={{
                                width: '70px',
                                padding: '0.5rem',
                                background: 'rgba(0,0,0,0.3)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '6px',
                                color: '#fff',
                                textAlign: 'center'
                              }}
                            />
                          </td>
                          <td>
                            <button
                              className={`visibility-btn ${product.isVisible ? 'visible' : ''}`}
                              onClick={() => handleToggleVisibility(product._id)}
                            >
                              {product.isVisible ? <FaEye /> : <FaEyeSlash />}
                            </button>
                          </td>
                          <td>
                            <div className="action-btns">
                              <button className="btn-edit" onClick={() => handleEditProduct(product)}>
                                <FaEdit />
                              </button>
                              <button className="btn-delete" onClick={() => handleDeleteProduct(product._id)}>
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Categories Management */}
          {activeTab === 'categories' && (
            <motion.div
              key="categories"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="categories-content"
            >
              <div className="content-header">
                <h1>Categories Management</h1>
                <button className="btn-add" onClick={() => setShowCategoryModal(true)}>
                  <FaPlus /> Add Category
                </button>
              </div>

              <div className="categories-grid">
                {categories.map(category => (
                  <motion.div
                    key={category._id}
                    layout
                    className={`category-card ${!category.isActive ? 'inactive' : ''}`}
                  >
                    <div className="category-header">
                      <h3>{category.name}</h3>
                      <span className={`status-badge ${category.isActive ? 'active' : 'inactive'}`}>
                        {category.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p>{category.description || 'No description'}</p>
                    <div className="category-actions">
                      <button
                        title={category.isActive ? 'Deactivate' : 'Activate'}
                        onClick={() => handleToggleCategoryActive(category)}
                        style={{ color: category.isActive ? '#4CAF50' : '#f44336' }}
                      >
                        {category.isActive ? <FaEye /> : <FaEyeSlash />}
                      </button>
                      <button onClick={() => {
                        setEditingCategory(category)
                        setCategoryForm({
                          name: category.name,
                          description: category.description || '',
                          isActive: category.isActive,
                          order: category.order || 0,
                          image: null
                        })
                        setShowCategoryModal(true)
                      }}>
                        <FaEdit />
                      </button>
                      <button onClick={() => handleDeleteCategory(category._id)}>
                        <FaTrash />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Orders Management */}
          {activeTab === 'orders' && (
            <motion.div
              key="orders"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="orders-content"
            >
              <div className="content-header">
                <h1>Orders Management</h1>
              </div>

              <div className="orders-table">
                <table>
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map(order => (
                      <tr key={order._id}>
                        <td className="order-id">#{order._id.slice(-6).toUpperCase()}</td>
                        <td>{order.userId?.username || 'Unknown'}</td>
                        <td>{order.items?.length} items</td>
                        <td>${order.totalAmount?.toFixed(2)}</td>
                        <td>
                          <span className={`payment-badge ${order.paymentStatus}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <span className="status-badge" style={{ background: `${getStatusColor(order.status)}20`, color: getStatusColor(order.status) }}>
                            {order.status}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={() => { setSelectedOrder(order); setShowOrderModal(true) }}
                          >
                            <FaEye />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Users Management */}
          {activeTab === 'users' && (
            <motion.div
              key="users"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="users-content"
            >
              <div className="content-header">
                <h1>Users Management</h1>
              </div>

              <div className="search-bar">
                <FaSearch />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="users-table">
                <table>
                  <thead>
                    <tr>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Orders</th>
                      <th>Cart Items</th>
                      <th>Joined</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users
                      .filter(u => u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        u.email.toLowerCase().includes(searchTerm.toLowerCase()))
                      .map(user => (
                        <tr key={user._id}>
                          <td><strong>{user.username}</strong></td>
                          <td>{user.email}</td>
                          <td>
                            <span className={`role-badge ${user.role}`}>{user.role}</span>
                          </td>
                          <td>{user.orderCount}</td>
                          <td>{user.cartCount}</td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          {/* Carts Overview */}
          {activeTab === 'carts' && (
            <motion.div
              key="carts"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="carts-content"
            >
              <div className="content-header">
                <h1>Active Carts</h1>
              </div>

              <div className="carts-grid">
                {carts.length === 0 ? (
                  <p className="no-data">No active carts</p>
                ) : (
                  carts.map((cart, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="cart-card"
                    >
                      <div className="cart-header">
                        <div className="cart-user">
                          <strong>{cart.user?.username}</strong>
                          <span>{cart.user?.email}</span>
                        </div>
                        <span className="cart-total">${cart.totalValue.toFixed(2)}</span>
                      </div>
                      <div className="cart-items">
                        {cart.items.map(item => (
                          <div key={item._id} className="cart-item">
                            <img src={`${API_URL}${item.productId?.image}`} alt="" />
                            <div className="item-info">
                              <span>{item.productId?.name}</span>
                              <span>Qty: {item.quantity}</span>
                            </div>
                            <span className="item-price">${(item.productId?.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Product Modal */}
      <Modal
        isOpen={showProductModal}
        onClose={() => { setShowProductModal(false); resetProductForm() }}
        title={editingProduct ? 'Edit Product' : 'Add Product'}
      >
        <form onSubmit={handleProductSubmit} className="product-form">
          <div className="form-row">
            <div className="form-group">
              <label>Name</label>
              <input type="text" value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Brand</label>
              <input type="text" value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Model</label>
              <input type="text" value={productForm.model} onChange={e => setProductForm({ ...productForm, model: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Price</label>
              <input type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                <option value="headphones">Headphones</option>
                <option value="earbuds">Earbuds</option>
                <option value="earphones">Earphones</option>
                <option value="wireless">Wireless</option>
                <option value="wired">Wired</option>
                <option value="gaming">Gaming</option>
                <option value="studio">Studio</option>
                <option value="sports">Sports</option>
              </select>
            </div>
            <div className="form-group">
              <label>Connectivity</label>
              <select value={productForm.connectivity} onChange={e => setProductForm({ ...productForm, connectivity: e.target.value })}>
                <option value="wireless">Wireless</option>
                <option value="wired">Wired</option>
                <option value="bluetooth">Bluetooth</option>
                <option value="usb">USB</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Stock</label>
              <input type="number" value={productForm.available} onChange={e => setProductForm({ ...productForm, available: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Discount</label>
              <input type="text" value={productForm.discount} onChange={e => setProductForm({ ...productForm, discount: e.target.value })} placeholder="0%" />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} required />
          </div>
          <div className="form-row">
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" checked={productForm.noiseCancellation} onChange={e => setProductForm({ ...productForm, noiseCancellation: e.target.checked })} />
                Noise Cancellation
              </label>
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" checked={productForm.microphone} onChange={e => setProductForm({ ...productForm, microphone: e.target.checked })} />
                Microphone
              </label>
            </div>
          </div>
          <div className="form-group">
            <label>Image</label>
            <input type="file" accept="image/*" onChange={e => setProductForm({ ...productForm, image: e.target.files[0] })} />
          </div>
          <button type="submit" className="btn-submit">
            {editingProduct ? 'Update Product' : 'Add Product'}
          </button>
        </form>
      </Modal>

      {/* Category Modal */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => { setShowCategoryModal(false); setEditingCategory(null); setCategoryForm({ name: '', description: '', isActive: true, order: 0, image: null }) }}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleCategorySubmit} className="category-form">
          <div className="form-group">
            <label>Name</label>
            <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} required />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Order</label>
              <input type="number" value={categoryForm.order} onChange={e => setCategoryForm({ ...categoryForm, order: parseInt(e.target.value) })} />
            </div>
            <div className="form-group checkbox">
              <label>
                <input type="checkbox" checked={categoryForm.isActive} onChange={e => setCategoryForm({ ...categoryForm, isActive: e.target.checked })} />
                Active
              </label>
            </div>
          </div>
          <button type="submit" className="btn-submit">
            {editingCategory ? 'Update Category' : 'Add Category'}
          </button>
        </form>
      </Modal>

      {/* Order Detail Modal */}
      <Modal
        isOpen={showOrderModal}
        onClose={() => { setShowOrderModal(false); setSelectedOrder(null) }}
        title="Order Details"
      >
        {selectedOrder && (
          <div className="order-detail">
            <div className="order-info-grid">
              <div className="info-item">
                <label>Order ID</label>
                <span>#{selectedOrder._id.slice(-8).toUpperCase()}</span>
              </div>
              <div className="info-item">
                <label>Customer</label>
                <span>{selectedOrder.userId?.username}</span>
              </div>
              <div className="info-item">
                <label>Total</label>
                <span>${selectedOrder.totalAmount?.toFixed(2)}</span>
              </div>
              <div className="info-item">
                <label>Payment</label>
                <span className={`payment-badge ${selectedOrder.paymentStatus}`}>{selectedOrder.paymentStatus}</span>
              </div>
            </div>

            <div className="shipping-info">
              <h4>Shipping Address</h4>
              <p>{selectedOrder.shippingAddress?.fullName}</p>
              <p>{selectedOrder.shippingAddress?.address}</p>
              <p>{selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.postalCode}</p>
              <p>{selectedOrder.shippingAddress?.phone}</p>
            </div>

            <div className="order-items">
              <h4>Items</h4>
              {selectedOrder.items?.map((item, i) => (
                <div key={i} className="order-item">
                  <span>{item.name}</span>
                  <span>x{item.quantity}</span>
                  <span>${(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="status-update">
              <h4>Update Status</h4>
              <div className="status-buttons">
                {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map(status => (
                  <button
                    key={status}
                    className={`status-btn ${selectedOrder.status === status ? 'active' : ''}`}
                    style={{ '--status-color': getStatusColor(status) }}
                    onClick={() => handleUpdateOrderStatus(selectedOrder._id, status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default AdminDashboard
