import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import type { PaymentMethod } from "../../utils/constants";
import "@/styles/user_css/cartPage.css";

const CartPage: React.FC = () => {
  const {
    cart,
    user,
    updateCartQuantity,
    removeFromCart,
    getCartTotal,
    placeOrder,
  } = useStore();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const total = getCartTotal();
  const shippingFee = total >= 1000 ? 0 : 100;

  const handlePlaceOrder = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    const order = placeOrder(paymentMethod);
    if (order) {
      setOrderPlaced(true);
      setTimeout(() => {
        navigate("/orders");
      }, 2000);
    }
  };

  if (orderPlaced) {
    return (
      <div className="cart-page">
        <div className="order-success">
          <div className="success-icon">🎉</div>
          <h2 className="success-title">Order Placed!</h2>
          <p className="success-message">
            Thank you for your purchase. You will be redirected to your orders.
          </p>
          <div className="success-redirect">Redirecting...</div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-content">
          <div className="empty-cart-icon">
            <ShoppingBag />
          </div>
          <h2 className="empty-cart-title">Your Cart is Empty</h2>
          <p className="empty-cart-subtitle">
            Add some products to get started
          </p>
          <Link to="/products" className="browse-btn">
            <ShoppingBag /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page cart-page-header">
      <div className="cart-page-container">
        <Link to="/products" className="back-link">
          <ArrowLeft /> Continue Shopping
        </Link>

        <h1 className="page-title">Shopping Cart</h1>

        <div className="cart-grid">
          {/* Cart Items */}
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item.product.id} className="cart-item">
                <Link
                  to={`/product/${item.product.id}`}
                  className="cart-item-image"
                >
                  <img src={item.product.image} alt={item.product.name} />
                </Link>
                <div className="cart-item-details">
                  <div className="cart-item-top">
                    <div>
                      <Link
                        to={`/product/${item.product.id}`}
                        className="cart-item-name"
                      >
                        {item.product.name}
                      </Link>
                      <p className="cart-item-category">
                        {item.product.category}
                      </p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="remove-btn"
                    >
                      <Trash2 />
                    </button>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="quantity-control">
                      <button
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity - 1)
                        }
                        className="quantity-btn"
                      >
                        <Minus />
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        onClick={() =>
                          updateCartQuantity(item.product.id, item.quantity + 1)
                        }
                        className="quantity-btn"
                      >
                        <Plus />
                      </button>
                    </div>
                    <span className="item-total">
                      ₱{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="order-summary">
              <h3 className="summary-title">Order Summary</h3>

              <div>
                <div className="summary-row">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <div
                  className={`summary-row ${shippingFee === 0 ? "free" : ""}`}
                >
                  <span>Shipping</span>
                  <span>
                    {shippingFee === 0 ? "FREE" : `₱${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                {shippingFee > 0 && (
                  <p className="free-shipping-note">
                    Free shipping on orders ₱1,000+
                  </p>
                )}
                <div className="summary-divider summary-total">
                  <span>Total</span>
                  <span className="amount">
                    ₱{(total + shippingFee).toFixed(2)}
                  </span>
                </div>
              </div>

              {!showCheckout ? (
                <button
                  onClick={() => {
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    setShowCheckout(true);
                  }}
                  className="checkout-btn"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="checkout-section">
                  {/* Delivery Info */}
                  <div className="delivery-info">
                    <h4 className="delivery-title">
                      <Truck /> Delivery Address
                    </h4>
                    {user && (
                      <>
                        <p className="delivery-text">{user.fullName}</p>
                        <p className="delivery-text">{user.phone}</p>
                        <p className="delivery-text">{user.address}</p>
                      </>
                    )}
                  </div>

                  {/* Payment Method */}
                  <div className="payment-section">
                    <h4 className="payment-title">
                      <CreditCard /> Payment Method
                    </h4>
                    <div className="payment-options">
                      <button
                        onClick={() => setPaymentMethod("COD")}
                        className={`payment-option ${paymentMethod === "COD" ? "selected" : ""}`}
                      >
                        <span className="payment-icon">💵</span>
                        <span className="payment-label">Cash on Delivery</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod("GCash")}
                        className={`payment-option ${paymentMethod === "GCash" ? "selected" : ""}`}
                      >
                        <span className="payment-icon">📱</span>
                        <span className="payment-label">GCash</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    className="place-order-btn"
                  >
                    Place Order — ₱{(total + shippingFee).toFixed(2)}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
