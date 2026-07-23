import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowLeft,
  CreditCard,
  Truck,
  CheckCircle2,
  Banknote,
  LockKeyhole,
  PackageCheck,
  ShieldCheck,
  CalendarDays,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import Toast from "../../components/Toast";
import type { PaymentMethod } from "../../utils/constants";
import "@/styles/user_css/cartPage.css";

const requestErrorMessage = (error: unknown, fallback: string) =>
  (error as any)?.response?.data?.error
  ?? (error instanceof Error ? error.message : fallback);

const CartPage: React.FC = () => {
  const gcashEnabled = import.meta.env.VITE_GCASH_ENABLED === "true";
  const {
    cart,
    user,
    addresses,
    fetchCart,
    updateCartQuantity,
    removeFromCart,
    placeOrder,
  } = useStore();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [quantityUpdating, setQuantityUpdating] = useState<string | null>(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const selectionInitialized = useRef(false);

  useEffect(() => {
    const available = new Set(cart.filter((item) => item.product.stock > 0 && item.quantity <= item.product.stock).map((item) => item.product.id));
    setSelectedIds((current) => {
      if (!selectionInitialized.current) {
        selectionInitialized.current = true;
        return [...available];
      }
      return current.filter((id) => available.has(id));
    });
  }, [cart]);

  useEffect(() => {
    if (!user || user.isAdmin) return;
    const interval = window.setInterval(() => { void fetchCart(); }, 10000);
    return () => window.clearInterval(interval);
  }, [fetchCart, user]);

  const selectedItems = useMemo(() => cart.filter((item) => selectedIds.includes(item.product.id) && item.product.stock > 0 && item.quantity <= item.product.stock), [cart, selectedIds]);
  const purchasableItems = useMemo(() => cart.filter((item) => item.product.stock > 0 && item.quantity <= item.product.stock), [cart]);
  const total = selectedItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shippingFee = total === 0 ? 0 : total >= 1000 ? 0 : 100;
  const shippingProgress = Math.min(100, (total / 1000) * 100);
  const defaultAddress = addresses.find((address) => address.isDefault) ?? addresses[0];
  const deliveryPhone = defaultAddress?.phone || user?.phone || "";
  const deliveryLocation = defaultAddress
    ? [
        defaultAddress.line1,
        defaultAddress.barangay,
        defaultAddress.city,
        defaultAddress.province,
        defaultAddress.region,
        defaultAddress.postalCode,
      ].filter((part, index, all): part is string => Boolean(part) && all.indexOf(part) === index).join(", ")
    : user?.address ?? "";
  const estimatedArrival = useMemo(() => {
    const earliest = new Date();
    const latest = new Date();
    earliest.setDate(earliest.getDate() + 4);
    latest.setDate(latest.getDate() + 7);
    const formatter = new Intl.DateTimeFormat("en-PH", { month: "short", day: "numeric" });
    return `${formatter.format(earliest)}–${formatter.format(latest)}`;
  }, []);
  const profileComplete = Boolean(user?.fullName?.trim() && deliveryPhone.trim() && defaultAddress?.line1?.trim() && defaultAddress.city?.trim() && defaultAddress.province?.trim());

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (placingOrder) return;
    setPlacingOrder(true);
    try {
      const order = await placeOrder(paymentMethod, undefined, selectedItems.map((item) => item.cartItemId).filter((id): id is string => Boolean(id)));
      if (order) {
        if ((order as any).checkoutUrl) {
          window.location.assign((order as any).checkoutUrl);
          return;
        }
        setOrderPlaced(true);
        setTimeout(() => {
          navigate("/orders");
        }, 2000);
      }
    } catch (error) {
      setToast({ message: requestErrorMessage(error, "Unable to place this order."), type: "error" });
    } finally {
      setPlacingOrder(false);
    }
  };
  const changeQuantity = async (productId: string, quantity: number) => {
    if (quantityUpdating) return;
    setQuantityUpdating(productId);
    try { await updateCartQuantity(productId, Math.max(1, quantity)); }
    catch (error) { setToast({ message: requestErrorMessage(error, "Unable to update quantity."), type: "error" }); }
    finally { setQuantityUpdating(null); }
  };

  if (orderPlaced) {
    return (
      <div className="cart-page">
        <div className="order-success">
          <div className="success-icon"><CheckCircle2 /></div>
          <h2 className="success-title">Order Placed!</h2>
          <p className="success-message">
            Thank you for your purchase. You will be redirected to your orders.
          </p>
          <div className="success-redirect">Redirecting...</div>
        </div>
      </div>
    );
  }

  if (user?.isAdmin) {
    return (
      <div className="empty-cart">
        <div className="empty-cart-content">
          <div className="empty-cart-icon"><ShoppingBag /></div>
          <h2 className="empty-cart-title">Admin view only</h2>
          <p className="empty-cart-subtitle">Admin accounts manage products and orders. Customer checkout is disabled.</p>
          <Link to="/admin" className="browse-btn">Go to Admin Dashboard</Link>
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
      <Toast message={toast?.message ?? ""} type={toast?.type} onClose={() => setToast(null)} />
      <div className="cart-page-container">
        <section className="cart-hero">
          <div className="cart-hero-copy">
            <Link to="/products" className="back-link">
              <ArrowLeft /> Continue Shopping
            </Link>
            <span className="cart-eyebrow">Review your equipment</span>
            <h1 className="page-title">Shopping Cart</h1>
            <p>Confirm your items, delivery details, and payment method before placing the order.</p>
          </div>
          <div className="cart-hero-assurance">
            <span><ShieldCheck /> Secure checkout</span>
            <span><PackageCheck /> Order tracking</span>
          </div>
        </section>
        <div className="cart-selection-bar"><span>{selectedItems.length} of {purchasableItems.length} available items selected</span><button type="button" onClick={() => setSelectedIds(selectedIds.length === purchasableItems.length ? [] : purchasableItems.map((item) => item.product.id))}>{selectedIds.length === purchasableItems.length ? "Clear selection" : "Select all"}</button></div>

        <div className="cart-grid">
          {/* Cart Items */}
          <div className="cart-items">
            {cart.map((item, index) => (
              <div key={item.product.id} className={`cart-item ${selectedIds.includes(item.product.id) ? "selected" : ""} ${item.product.stock === 0 ? "out-of-stock" : ""}`} style={{ animationDelay: `${index * 0.05}s` }}>
                <label className="cart-select"><input type="checkbox" disabled={item.product.stock === 0 || item.quantity > item.product.stock} checked={selectedIds.includes(item.product.id)} onChange={() => setSelectedIds((current) => current.includes(item.product.id) ? current.filter((id) => id !== item.product.id) : [...current, item.product.id])} aria-label={`Select ${item.product.name} for checkout`} /><span /></label>
                <Link
                  to={`/product/${item.product.id}`}
                  className="cart-item-image"
                >
                  {item.product.image ? <img src={item.product.image} alt={item.product.name} /> : <div className="cart-image-placeholder" aria-label="No product image" />}
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
                      <p className={`cart-stock ${item.product.stock === 0 ? "stock-out" : item.product.stock <= 5 ? "stock-low" : ""}`}>
                        {item.product.stock === 0
                          ? "Out of stock"
                          : item.quantity > item.product.stock
                            ? `Only ${item.product.stock} left — reduce quantity`
                            : item.product.stock <= 5
                              ? `Only ${item.product.stock} left in stock`
                              : `${item.product.stock} available in stock`}
                        <span className="live-stock-dot" aria-hidden="true" />
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="remove-btn"
                      aria-label={`Remove ${item.product.name} from cart`}
                    >
                      <Trash2 />
                    </button>
                  </div>
                  <div className="cart-item-bottom">
                    <div className="quantity-control">
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.product.id, item.quantity - 1)}
                        className="quantity-btn"
                        disabled={item.quantity <= 1 || quantityUpdating === item.product.id}
                      >
                        <Minus />
                      </button>
                        <span className={`quantity-value ${quantityUpdating === item.product.id ? "quantity-loading" : ""}`}>{quantityUpdating === item.product.id ? "…" : item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQuantity(item.product.id, item.quantity + 1)}
                        className="quantity-btn"
                        disabled={quantityUpdating === item.product.id || item.product.stock === 0 || item.quantity >= item.product.stock}
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
              <div className="summary-heading">
                <div><LockKeyhole /><h3 className="summary-title">Order Summary</h3></div>
                <span>{selectedItems.length} selected</span>
              </div>

              <div>
                <div className="summary-row">
                  <span>Subtotal ({selectedItems.length} selected)</span>
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
                  <div className="shipping-progress">
                    <div><span style={{ width: `${shippingProgress}%` }} /></div>
                    <p className="free-shipping-note">
                      Add ₱{Math.max(0, 1000 - total).toFixed(2)} more for free shipping
                    </p>
                  </div>
                )}
                <div className="summary-divider summary-total">
                  <span>Total</span>
                  <span className="amount">
                    ₱{(total + shippingFee).toFixed(2)}
                  </span>
                </div>
              </div>

              {!showCheckout ? (
                <>
                {user && !profileComplete && <p className="profile-required-note">Complete your phone number and delivery address before checkout.</p>}
                <button
                  type="button"
                  onClick={() => {
                    if (!user) {
                      navigate("/login");
                      return;
                    }
                    if (!selectedItems.length) {
                      setToast({ message: "Select at least one item to continue.", type: "error" });
                      return;
                    }
                    if (!profileComplete) {
                      navigate("/profile?next=/cart");
                      return;
                    }
                    setShowCheckout(true);
                  }}
                  className="checkout-btn"
                >
                  Proceed to Checkout
                </button>
                </>
              ) : (
                <div className="checkout-section">
                  {/* Delivery Info */}
                  <div className="delivery-info">
                    <h4 className="delivery-title">
                      <Truck /> Delivery Address
                    </h4>
                    {user && defaultAddress && (
                      <>
                        <p className="delivery-recipient">{defaultAddress.recipientName || user.fullName}</p>
                        <p className="delivery-text">{deliveryPhone}</p>
                        <p className="delivery-location">{deliveryLocation}</p>
                        <div className="delivery-estimate">
                          <CalendarDays />
                          <span>
                            <strong>Estimated arrival: {estimatedArrival}</strong>
                            <small>Usually delivered within 4–7 days after order confirmation.</small>
                          </span>
                        </div>
                        <Link to="/profile?section=address&next=/cart" className="delivery-change-link">Change delivery address</Link>
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
                        type="button"
                        onClick={() => setPaymentMethod("COD")}
                        className={`payment-option ${paymentMethod === "COD" ? "selected" : ""}`}
                      >
                        <span className="payment-icon"><Banknote /></span>
                        <span className="payment-label">Cash on Delivery</span>
                      </button>
                      {gcashEnabled && (
                        <button
                          type="button"
                          onClick={() => setPaymentMethod("GCash")}
                          className={`payment-option ${paymentMethod === "GCash" ? "selected" : ""}`}
                        >
                          <span className="payment-label">GCash</span>
                        </button>
                      )}
                    </div>
                    <p className="payment-note">
                      {gcashEnabled
                        ? "Choose Cash on Delivery or pay securely through the GCash provider."
                        : "GCash is temporarily unavailable. Cash on Delivery is available for your order."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handlePlaceOrder}
                    className="place-order-btn"
                    disabled={placingOrder}
                  >
                    {placingOrder ? "Placing your order…" : `Place Order — ₱${(total + shippingFee).toFixed(2)}`}
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
