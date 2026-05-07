import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, CreditCard, Truck } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import type { PaymentMethod } from '../../utils/constants';

const CartPage: React.FC = () => {
  const { cart, user, updateCartQuantity, removeFromCart, getCartTotal, placeOrder } = useStore();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const total = getCartTotal();
  const shippingFee = total >= 1000 ? 0 : 100;

  const handlePlaceOrder = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    const order = placeOrder(paymentMethod);
    if (order) {
      setOrderPlaced(true);
      setTimeout(() => {
        navigate('/orders');
      }, 2000);
    }
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🎉</span>
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-4">Thank you for your purchase. You will be redirected to your orders.</p>
          <div className="animate-pulse text-primary-500 text-sm">Redirecting...</div>
        </div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Your Cart is Empty</h2>
          <p className="text-gray-500 mb-6">Add some products to get started</p>
          <Link
            to="/products"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-xl font-semibold transition"
          >
            <ShoppingBag className="w-5 h-5" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faf9] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/products" className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 mb-6 transition">
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="font-display text-3xl font-bold text-gray-900 mb-8">Shopping Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <div key={item.product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex gap-4 animate-fade-in">
                <Link to={`/product/${item.product.id}`} className="shrink-0">
                  <img
                    src={item.product.image}
                    alt={item.product.name}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-xl"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <Link to={`/product/${item.product.id}`} className="font-semibold text-gray-900 hover:text-primary-600 transition text-sm sm:text-base">
                        {item.product.name}
                      </Link>
                      <p className="text-xs text-gray-500 mt-0.5">{item.product.category}</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-0 bg-gray-100 rounded-lg">
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                        className="p-1.5 text-gray-500 hover:text-gray-700"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                        className="p-1.5 text-gray-500 hover:text-gray-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="font-bold text-gray-900">₱{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h3 className="font-display font-bold text-lg text-gray-900 mb-4">Order Summary</h3>

              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cart.length} items)</span>
                  <span>₱{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className={shippingFee === 0 ? 'text-green-600 font-medium' : ''}>
                    {shippingFee === 0 ? 'FREE' : `₱${shippingFee.toFixed(2)}`}
                  </span>
                </div>
                {shippingFee > 0 && (
                  <p className="text-xs text-gray-400">Free shipping on orders ₱1,000+</p>
                )}
                <div className="border-t border-gray-100 pt-3 flex justify-between font-bold text-gray-900 text-lg">
                  <span>Total</span>
                  <span className="text-primary-600">₱{(total + shippingFee).toFixed(2)}</span>
                </div>
              </div>

              {!showCheckout ? (
                <button
                  onClick={() => {
                    if (!user) {
                      navigate('/login');
                      return;
                    }
                    setShowCheckout(true);
                  }}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3.5 rounded-xl font-semibold transition shadow-md hover:shadow-lg"
                >
                  Proceed to Checkout
                </button>
              ) : (
                <div className="animate-fade-in">
                  {/* Delivery Info */}
                  <div className="bg-gray-50 rounded-xl p-4 mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                      <Truck className="w-4 h-4 text-primary-500" /> Delivery Address
                    </h4>
                    <p className="text-xs text-gray-600">{user?.fullName}</p>
                    <p className="text-xs text-gray-600">{user?.phone}</p>
                    <p className="text-xs text-gray-600">{user?.address}</p>
                  </div>

                  {/* Payment Method */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-primary-500" /> Payment Method
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => setPaymentMethod('COD')}
                        className={`p-3 rounded-xl border-2 transition text-center ${
                          paymentMethod === 'COD'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mb-1 block">💵</span>
                        <span className="text-xs font-semibold">Cash on Delivery</span>
                      </button>
                      <button
                        onClick={() => setPaymentMethod('GCash')}
                        className={`p-3 rounded-xl border-2 transition text-center ${
                          paymentMethod === 'GCash'
                            ? 'border-primary-500 bg-primary-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg mb-1 block">📱</span>
                        <span className="text-xs font-semibold">GCash</span>
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handlePlaceOrder}
                    className="w-full bg-primary-500 hover:bg-primary-600 text-white py-3.5 rounded-xl font-semibold transition shadow-md hover:shadow-lg animate-pulse-glow"
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
