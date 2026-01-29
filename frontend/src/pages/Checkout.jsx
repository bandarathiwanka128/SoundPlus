import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { FaLock, FaCreditCard, FaTruck, FaCheckCircle, FaArrowLeft } from 'react-icons/fa'
import { toast } from 'react-toastify'
import axios from 'axios'
import './Checkout.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://51.21.64.104:5000'

// Initialize Stripe with the publishable key
const stripeKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
const stripePromise = stripeKey ? loadStripe(stripeKey) : null

// Card styling for Stripe Elements
const cardStyle = {
  style: {
    base: {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial, sans-serif',
      '::placeholder': {
        color: '#888888',
      },
      iconColor: '#FFD700',
    },
    invalid: {
      color: '#ff4444',
      iconColor: '#ff4444',
    },
  },
}

// Payment Form Component (inside Elements provider)
function PaymentForm({ user, cartItems, totalAmount, shippingAddress, onBack, onSuccess }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [cardComplete, setCardComplete] = useState(false)
  const [cardError, setCardError] = useState('')

  const handleCardChange = (event) => {
    setCardComplete(event.complete)
    setCardError(event.error ? event.error.message : '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!stripe || !elements) {
      toast.error('Stripe not loaded. Please refresh the page.')
      return
    }

    if (!cardComplete) {
      toast.error('Please enter valid card details')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      // Step 1: Create payment intent
      console.log('Creating payment intent for amount:', totalAmount)
      const { data: intentData } = await axios.post(
        `${API_URL}/create-payment-intent`,
        { amount: totalAmount },
        { headers: { Authorization: `Bearer ${token}` } }
      )

      console.log('Payment intent created:', intentData)

      if (!intentData.clientSecret) {
        throw new Error('Failed to create payment intent')
      }

      // Step 2: Confirm payment with Stripe
      const cardElement = elements.getElement(CardElement)
      const { error, paymentIntent } = await stripe.confirmCardPayment(
        intentData.clientSecret,
        {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: shippingAddress.fullName,
            },
          },
        }
      )

      if (error) {
        console.error('Payment error:', error)
        toast.error(error.message)
        setLoading(false)
        return
      }

      console.log('Payment confirmed:', paymentIntent.status)

      if (paymentIntent.status === 'succeeded') {
        // Step 3: Create order
        const orderItems = cartItems.map(item => ({
          productId: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity,
          image: item.productId.image
        }))

        await axios.post(
          `${API_URL}/confirm-payment`,
          {
            paymentIntentId: paymentIntent.id,
            userId: user.id,
            items: orderItems,
            totalAmount,
            shippingAddress
          },
          { headers: { Authorization: `Bearer ${token}` } }
        )

        toast.success('Payment successful! Order placed.')
        onSuccess(paymentIntent.id, orderItems)
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.')
    }

    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <h3><FaCreditCard /> Payment Details</h3>

      <div className="address-summary">
        <h4>Shipping to:</h4>
        <p><strong>{shippingAddress.fullName}</strong></p>
        <p>{shippingAddress.address}</p>
        <p>{shippingAddress.city}, {shippingAddress.postalCode}</p>
        <p>{shippingAddress.phone}</p>
        <button type="button" className="btn-edit" onClick={onBack}>
          <FaArrowLeft /> Edit Address
        </button>
      </div>

      <div className="card-element-container">
        <label>Card Information</label>
        <div className="card-element">
          <CardElement
            options={cardStyle}
            onChange={handleCardChange}
          />
        </div>
        {cardError && <p className="card-error">{cardError}</p>}
        <div className="secure-badge">
          <FaLock /> Secured by Stripe
        </div>
      </div>

      <div className="test-card-info">
        <strong>Test Card Details:</strong>
        <p>Number: 4242 4242 4242 4242</p>
        <p>Expiry: 12/28 | CVC: 123</p>
      </div>

      <button
        type="submit"
        className="btn-pay"
        disabled={!stripe || loading || !cardComplete}
      >
        {loading ? (
          <span className="btn-loading">
            <span className="spinner-small"></span>
            Processing...
          </span>
        ) : (
          <>Pay ${totalAmount.toFixed(2)}</>
        )}
      </button>
    </form>
  )
}

// Address Form Component
function AddressForm({ shippingAddress, setShippingAddress, onContinue }) {
  const handleChange = (field, value) => {
    setShippingAddress(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const { fullName, address, city, postalCode, phone } = shippingAddress

    if (!fullName?.trim() || !address?.trim() || !city?.trim() || !postalCode?.trim() || !phone?.trim()) {
      toast.error('Please fill in all shipping fields')
      return
    }

    onContinue()
  }

  return (
    <form onSubmit={handleSubmit} className="address-form">
      <h3><FaTruck /> Shipping Address</h3>

      <div className="form-group">
        <label>Full Name *</label>
        <input
          type="text"
          value={shippingAddress.fullName}
          onChange={(e) => handleChange('fullName', e.target.value)}
          placeholder="John Doe"
          required
        />
      </div>

      <div className="form-group">
        <label>Address *</label>
        <input
          type="text"
          value={shippingAddress.address}
          onChange={(e) => handleChange('address', e.target.value)}
          placeholder="123 Main Street"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>City *</label>
          <input
            type="text"
            value={shippingAddress.city}
            onChange={(e) => handleChange('city', e.target.value)}
            placeholder="New York"
            required
          />
        </div>
        <div className="form-group">
          <label>Postal Code *</label>
          <input
            type="text"
            value={shippingAddress.postalCode}
            onChange={(e) => handleChange('postalCode', e.target.value)}
            placeholder="10001"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Phone Number *</label>
        <input
          type="tel"
          value={shippingAddress.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          placeholder="+1 234 567 8900"
          required
        />
      </div>

      <button type="submit" className="btn-continue">
        Continue to Payment <FaCreditCard />
      </button>
    </form>
  )
}

// Main Checkout Component
function Checkout({ user }) {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [shippingAddress, setShippingAddress] = useState({
    fullName: '',
    address: '',
    city: '',
    postalCode: '',
    phone: ''
  })

  useEffect(() => {
    if (!user) {
      toast.error('Please login to checkout')
      navigate('/login')
      return
    }
    fetchCart()
  }, [user, navigate])

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_URL}/cart/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setCartItems(response.data)
      if (response.data.length === 0) {
        toast.info('Your cart is empty')
      }
    } catch (error) {
      console.error('Error fetching cart:', error)
      toast.error('Error loading cart')
    }
    setLoading(false)
  }

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => {
      const price = item.productId?.price || 0
      return total + (price * item.quantity)
    }, 0)
  }

  const handlePaymentSuccess = (orderId, items) => {
    navigate('/order-success', {
      state: {
        orderId,
        totalAmount: calculateTotal(),
        items
      }
    })
  }

  if (loading) {
    return (
      <div className="checkout-loading">
        <div className="spinner"></div>
        <p>Loading checkout...</p>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="checkout-empty">
        <h2>Your cart is empty</h2>
        <p>Add some products before checking out</p>
        <button onClick={() => navigate('/products')} className="btn-shop">
          Browse Products
        </button>
      </div>
    )
  }

  if (!stripePromise) {
    return (
      <div className="checkout-empty">
        <h2>Payment system not available</h2>
        <p>Stripe is not configured. Please contact support.</p>
        <p className="debug-info">Missing VITE_STRIPE_PUBLISHABLE_KEY in environment</p>
        <button onClick={() => navigate('/products')} className="btn-shop">
          Back to Products
        </button>
      </div>
    )
  }

  const totalAmount = calculateTotal()

  return (
    <div className="checkout-page">
      <div className="checkout-container">
        <div className="checkout-main">
          <h1>Checkout</h1>

          {/* Progress Steps */}
          <div className="checkout-steps">
            <div className={`step ${step >= 1 ? 'active' : ''}`}>
              <div className="step-icon"><FaTruck /></div>
              <span>Shipping</span>
            </div>
            <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 2 ? 'active' : ''}`}>
              <div className="step-icon"><FaCreditCard /></div>
              <span>Payment</span>
            </div>
            <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
            <div className={`step ${step >= 3 ? 'active' : ''}`}>
              <div className="step-icon"><FaCheckCircle /></div>
              <span>Complete</span>
            </div>
          </div>

          {/* Step 1: Address Form */}
          {step === 1 && (
            <AddressForm
              shippingAddress={shippingAddress}
              setShippingAddress={setShippingAddress}
              onContinue={() => setStep(2)}
            />
          )}

          {/* Step 2: Payment Form */}
          {step === 2 && (
            <Elements stripe={stripePromise}>
              <PaymentForm
                user={user}
                cartItems={cartItems}
                totalAmount={totalAmount}
                shippingAddress={shippingAddress}
                onBack={() => setStep(1)}
                onSuccess={handlePaymentSuccess}
              />
            </Elements>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="checkout-sidebar">
          <div className="order-summary">
            <h3>Order Summary</h3>

            <div className="summary-items">
              {cartItems.map(item => (
                <div key={item._id} className="summary-item">
                  <img
                    src={`${API_URL}${item.productId?.image}`}
                    alt={item.productId?.name}
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/60x60?text=No+Image' }}
                  />
                  <div className="item-details">
                    <h4>{item.productId?.name}</h4>
                    <p>Qty: {item.quantity}</p>
                    <span>${((item.productId?.price || 0) * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span className="free-shipping">Free</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>${totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="secure-checkout">
            <FaLock />
            <span>Secure Checkout</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout
