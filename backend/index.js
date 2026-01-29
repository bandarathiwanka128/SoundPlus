require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');

const app = express();
const port = process.env.PORT || 5000;

// Initialize Stripe (with error handling)
let stripe = null;
try {
  if (process.env.STRIPE_SECRET_KEY) {
    stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    console.log('Stripe initialized successfully');
  } else {
    console.warn('WARNING: STRIPE_SECRET_KEY not set. Payment features will be disabled.');
  }
} catch (error) {
  console.error('Stripe initialization error:', error.message);
}

// Middleware setup
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  process.env.CORS_ORIGIN
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all for development
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure uploads folder exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer config for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const extname = allowed.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowed.test(file.mimetype.toLowerCase());
  extname && mimetype ? cb(null, true) : cb(new Error('Only image files are allowed'));
};
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// MongoDB Connection
let dbConnected = false;

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  dbConnected = true;
  console.log('MongoDB Atlas connected successfully!');
  // Seed admin user after DB connection
  seedAdminUser();
})
.catch(err => {
  console.error('MongoDB connection error:', err);
});

// ===========================
// MONGOOSE SCHEMAS & MODELS
// ===========================

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  createdAt: { type: Date, default: Date.now }
});

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  image: { type: String, default: '' },
  isActive: { type: Boolean, default: true },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Product Schema (Audio Equipment)
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  category: {
    type: String,
    required: true,
    enum: ['headphones', 'earbuds', 'earphones', 'wireless', 'wired', 'gaming', 'studio', 'sports']
  },
  available: { type: Number, default: 0 },
  discount: { type: String, default: '0%' },
  brand: { type: String, required: true },
  model: { type: String, required: true },
  connectivity: { type: String, enum: ['wired', 'wireless', 'bluetooth', 'usb'], required: true },
  features: { type: [String], default: [] },
  color: { type: String, default: 'Black' },
  batteryLife: { type: String },
  noiseCancellation: { type: Boolean, default: false },
  microphone: { type: Boolean, default: false },
  rating: { type: Number, default: 0, min: 0, max: 5 },
  reviews: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Cart Schema
const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, default: 1 },
  createdAt: { type: Date, default: Date.now }
});
cartSchema.index({ userId: 1, productId: 1 }, { unique: true });

// Order Schema
const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    image: String
  }],
  totalAmount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },
  shippingAddress: {
    fullName: String,
    address: String,
    city: String,
    postalCode: String,
    phone: String
  },
  paymentIntentId: { type: String },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },
  paymentMethod: { type: String, default: 'card' },
  createdAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Category = mongoose.model('Category', categorySchema);
const Product = mongoose.model('Product', productSchema);
const Cart = mongoose.model('Cart', cartSchema);
const Order = mongoose.model('Order', orderSchema);

// ===========================
// SEED ADMIN USER
// ===========================
async function seedAdminUser() {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.log('Admin credentials not configured in .env');
      return;
    }

    const existingAdmin = await User.findOne({ email: adminEmail });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const admin = new User({
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'admin'
      });
      await admin.save();
      console.log('Admin user created successfully!');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error seeding admin user:', error);
  }
}

// ===========================
// SEED DEFAULT CATEGORIES
// ===========================
async function seedCategories() {
  try {
    const defaultCategories = [
      { name: 'headphones', description: 'Over-ear and on-ear headphones', order: 1 },
      { name: 'earbuds', description: 'True wireless earbuds', order: 2 },
      { name: 'earphones', description: 'In-ear earphones', order: 3 },
      { name: 'wireless', description: 'Wireless audio devices', order: 4 },
      { name: 'wired', description: 'Wired audio devices', order: 5 },
      { name: 'gaming', description: 'Gaming headsets', order: 6 },
      { name: 'studio', description: 'Professional studio monitors', order: 7 },
      { name: 'sports', description: 'Sports and fitness audio', order: 8 }
    ];

    for (const cat of defaultCategories) {
      await Category.findOneAndUpdate(
        { name: cat.name },
        cat,
        { upsert: true, new: true }
      );
    }
    console.log('Categories seeded successfully!');
  } catch (error) {
    console.error('Error seeding categories:', error);
  }
}

// ===========================
// MIDDLEWARE - AUTH
// ===========================
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};

const isAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admin only.' });
  }
  next();
};

// ===========================
// AUTHENTICATION ROUTES
// ===========================

// Register
app.post('/register', async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully', userId: newUser._id });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 7 * 24 * 60 * 60 * 1000 });
    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Logout
app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// ===========================
// STRIPE PAYMENT ROUTES
// ===========================

// Get Stripe publishable key
app.get('/payment-config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY
  });
});

// Create payment intent
app.post('/create-payment-intent', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Payment system not configured' });
    }

    const { amount, currency = 'usd' } = req.body;
    console.log('Creating payment intent for amount:', amount);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    console.log('Payment intent created:', paymentIntent.id);
    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error) {
    console.error('Payment intent error:', error);
    res.status(500).json({ message: error.message || 'Error creating payment intent' });
  }
});

// Confirm payment and create order
app.post('/confirm-payment', authenticateToken, async (req, res) => {
  try {
    if (!stripe) {
      return res.status(500).json({ message: 'Payment system not configured' });
    }

    const { paymentIntentId, userId, items, totalAmount, shippingAddress } = req.body;
    console.log('Confirming payment:', paymentIntentId);

    // Verify payment status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        message: 'Payment not completed',
        status: paymentIntent.status
      });
    }

    // Create order with payment info
    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      shippingAddress,
      status: 'processing',
      paymentIntentId,
      paymentStatus: 'paid',
      paymentMethod: 'card'
    });

    await newOrder.save();

    // Clear cart after successful order
    await Cart.deleteMany({ userId });

    // Update product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { available: -item.quantity } }
      );
    }

    res.status(201).json({
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Error confirming payment' });
  }
});

// ===========================
// CATEGORY ROUTES
// ===========================

// Get all categories
app.get('/categories', async (req, res) => {
  try {
    const { activeOnly } = req.query;
    const filter = activeOnly === 'true' ? { isActive: true } : {};
    const categories = await Category.find(filter).sort({ order: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Get single category
app.get('/categories/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category' });
  }
});

// Create category (Admin only)
app.post('/categories', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const { name, description, isActive, order } = req.body;

    const existingCategory = await Category.findOne({ name });
    if (existingCategory) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const newCategory = new Category({
      name,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      isActive: isActive !== 'false',
      order: order || 0
    });

    await newCategory.save();
    res.status(201).json({ message: 'Category created successfully', category: newCategory });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category' });
  }
});

// Update category (Admin only)
app.put('/categories/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    if (updateData.isActive !== undefined) {
      updateData.isActive = updateData.isActive !== 'false';
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category updated successfully', category });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category' });
  }
});

// Delete category (Admin only)
app.delete('/categories/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category' });
  }
});

// ===========================
// PRODUCT ROUTES
// ===========================

// Get all products (with visibility filter for non-admin)
app.get('/products', async (req, res) => {
  try {
    const { category, brand, minPrice, maxPrice, search, showAll } = req.query;
    let filter = {};

    // Only show visible products to regular users
    if (showAll !== 'true') {
      filter.isVisible = true;
    }

    if (category) filter.category = category;
    if (brand) filter.brand = brand;
    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { brand: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Error fetching products' });
  }
});

// Get single product
app.get('/products/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ message: 'Error fetching product' });
  }
});

// Add product (Admin only)
app.post('/add-product', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const productData = {
      ...req.body,
      image: req.file ? `/uploads/${req.file.filename}` : '',
      features: req.body.features ? JSON.parse(req.body.features) : [],
      isVisible: req.body.isVisible !== 'false'
    };

    const newProduct = new Product(productData);
    await newProduct.save();
    res.status(201).json({ message: 'Product added successfully', product: newProduct });
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).json({ message: 'Error adding product' });
  }
});

// Update product (Admin only)
app.put('/update-product/:id', authenticateToken, isAdmin, upload.single('image'), async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.file) {
      updateData.image = `/uploads/${req.file.filename}`;
    }

    if (req.body.features && typeof req.body.features === 'string') {
      updateData.features = JSON.parse(req.body.features);
    }

    if (updateData.isVisible !== undefined) {
      updateData.isVisible = updateData.isVisible !== 'false';
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json({ message: 'Product updated successfully', product });
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ message: 'Error updating product' });
  }
});

// Toggle product visibility (Admin only)
app.put('/products/:id/visibility', authenticateToken, isAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    product.isVisible = !product.isVisible;
    await product.save();

    res.json({ message: 'Product visibility updated', product });
  } catch (error) {
    console.error('Error updating visibility:', error);
    res.status(500).json({ message: 'Error updating visibility' });
  }
});

// Delete product (Admin only)
app.delete('/delete-product/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Delete image file
    if (product.image) {
      const imagePath = path.join(__dirname, product.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Error deleting product' });
  }
});

// ===========================
// CART ROUTES
// ===========================

// Get user cart
app.get('/cart/:userId', authenticateToken, async (req, res) => {
  try {
    const cartItems = await Cart.find({ userId: req.params.userId })
      .populate('productId');
    res.json(cartItems);
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({ message: 'Error fetching cart' });
  }
});

// Add to cart
app.post('/add-to-cart', authenticateToken, async (req, res) => {
  try {
    const { userId, productId, quantity } = req.body;

    const existingItem = await Cart.findOne({ userId, productId });

    if (existingItem) {
      existingItem.quantity += quantity || 1;
      await existingItem.save();
      res.json({ message: 'Cart updated', cart: existingItem });
    } else {
      const newCartItem = new Cart({ userId, productId, quantity: quantity || 1 });
      await newCartItem.save();
      res.status(201).json({ message: 'Added to cart', cart: newCartItem });
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({ message: 'Error adding to cart' });
  }
});

// Update cart item quantity
app.put('/cart/:userId/:productId', authenticateToken, async (req, res) => {
  try {
    const { userId, productId } = req.params;
    const { quantity } = req.body;

    const cartItem = await Cart.findOne({ userId, productId });

    if (!cartItem) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    cartItem.quantity = quantity;
    await cartItem.save();
    res.json({ message: 'Cart updated', cart: cartItem });
  } catch (error) {
    console.error('Error updating cart:', error);
    res.status(500).json({ message: 'Error updating cart' });
  }
});

// Remove from cart
app.delete('/cart/:userId/:productId', authenticateToken, async (req, res) => {
  try {
    const { userId, productId } = req.params;
    await Cart.findOneAndDelete({ userId, productId });
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    console.error('Error removing from cart:', error);
    res.status(500).json({ message: 'Error removing from cart' });
  }
});

// Clear cart
app.delete('/cart/:userId', authenticateToken, async (req, res) => {
  try {
    await Cart.deleteMany({ userId: req.params.userId });
    res.json({ message: 'Cart cleared' });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({ message: 'Error clearing cart' });
  }
});

// ===========================
// ORDER ROUTES
// ===========================

// Create order
app.post('/orders', authenticateToken, async (req, res) => {
  try {
    const { userId, items, totalAmount, shippingAddress } = req.body;

    const newOrder = new Order({
      userId,
      items,
      totalAmount,
      shippingAddress,
      status: 'pending',
      paymentStatus: 'pending'
    });

    await newOrder.save();

    // Clear cart after order
    await Cart.deleteMany({ userId });

    res.status(201).json({ message: 'Order placed successfully', order: newOrder });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// Get user orders
app.get('/orders/:userId', authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get all orders (Admin only)
app.get('/orders', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    let filter = {};

    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find(filter)
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Update order status (Admin only)
app.put('/orders/:orderId', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.orderId,
      { status },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json({ message: 'Order status updated', order });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ message: 'Error updating order' });
  }
});

// ===========================
// ADMIN DASHBOARD ROUTES
// ===========================

// Get admin dashboard stats
app.get('/admin/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalCategories = await Category.countDocuments();

    // Calculate total revenue
    const revenueResult = await Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    // Get recent orders count (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentOrders = await Order.countDocuments({ createdAt: { $gte: weekAgo } });

    // Order status breakdown
    const ordersByStatus = await Order.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Revenue by day (last 7 days)
    const revenueByDay = await Order.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, paymentStatus: 'paid' } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalCategories,
      totalRevenue,
      recentOrders,
      ordersByStatus,
      revenueByDay
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Get all users (Admin only)
app.get('/admin/users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { search, role } = req.query;
    let filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    // Add order count for each user
    const usersWithStats = await Promise.all(users.map(async (user) => {
      const orderCount = await Order.countDocuments({ userId: user._id });
      const cartCount = await Cart.countDocuments({ userId: user._id });
      return {
        ...user.toObject(),
        orderCount,
        cartCount
      };
    }));

    res.json(usersWithStats);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Get all carts (Admin only)
app.get('/admin/carts', authenticateToken, isAdmin, async (req, res) => {
  try {
    const carts = await Cart.find()
      .populate('userId', 'username email')
      .populate('productId', 'name price image')
      .sort({ createdAt: -1 });

    // Group by user
    const cartsByUser = carts.reduce((acc, item) => {
      const userId = item.userId?._id?.toString();
      if (!userId) return acc;

      if (!acc[userId]) {
        acc[userId] = {
          user: item.userId,
          items: [],
          totalValue: 0
        };
      }
      acc[userId].items.push(item);
      if (item.productId?.price) {
        acc[userId].totalValue += item.productId.price * item.quantity;
      }
      return acc;
    }, {});

    res.json(Object.values(cartsByUser));
  } catch (error) {
    console.error('Error fetching carts:', error);
    res.status(500).json({ message: 'Error fetching carts' });
  }
});

// ===========================
// HEALTH CHECK
// ===========================
app.get('/health', (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      message: 'SoundPlus++ Backend is running!',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'ERROR',
      message: 'Health check failed',
      error: error.message
    });
  }
});

// ===========================
// START SERVER
// ===========================
app.listen(port, '0.0.0.0', (error) => {
  if (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
  console.log(`Server running on http://0.0.0.0:${port}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`Database: ${process.env.DB_NAME}`);
  console.log(`Health check endpoint: http://localhost:${port}/health`);
});

module.exports = app;
