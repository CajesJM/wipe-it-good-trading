import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ChevronDown,
  ChevronUp,
  Clock,
  CheckCircle,
  Truck,
  Home,
  Banknote,
  Smartphone,
  ShoppingBag,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import StatusBadge from "../../components/StatusBadge";
import type { OrderStatus } from "../../utils/constants";
import "@/styles/user_css/ordersPage.css";

const statusSteps: {
  key: OrderStatus;
  icon: React.ElementType;
  label: string;
}[] = [
  { key: "Pending", icon: Clock, label: "Order Placed" },
  { key: "Confirmed", icon: CheckCircle, label: "Confirmed" },
  { key: "Packed", icon: Package, label: "Packed" },
  { key: "Shipped", icon: Truck, label: "Shipped" },
  { key: "Delivered", icon: Home, label: "Delivered" },
];

const OrdersPage: React.FC = () => {
  const { user, orders, cancelOrder } = useStore();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderFilter, setOrderFilter] = useState<"All" | "Active" | "Delivered" | "Cancelled">("All");

  if (!user) {
    return (
      <div className="login-required">
        <div className="empty-box">
          <Package className="empty-icon" />
          <h2 className="empty-title">Login Required</h2>
          <p className="empty-subtitle">Please login to view your orders</p>
          <Link to="/login" className="empty-btn">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const userOrders = orders.filter((o) => o.userId === user.id);
  const activeStatuses: OrderStatus[] = ["Pending", "Confirmed", "Packed", "Shipped"];
  const filteredOrders = userOrders.filter((order) => {
    if (orderFilter === "Active") return activeStatuses.includes(order.status);
    if (orderFilter === "Delivered") return order.status === "Delivered";
    if (orderFilter === "Cancelled") return order.status === "Cancelled";
    return true;
  });
  const deliveredCount = userOrders.filter((order) => order.status === "Delivered").length;
  const activeCount = userOrders.filter((order) => activeStatuses.includes(order.status)).length;

  const getStepIndex = (status: OrderStatus) =>
    statusSteps.findIndex((s) => s.key === status);

  return (
    <div className="orders-page">
      <div className="orders-container">
        <section className="orders-hero">
          <div className="orders-hero-copy">
            <span className="orders-eyebrow">Your purchase activity</span>
            <h1 className="orders-title">My Orders</h1>
            <p className="orders-subtitle">Track every purchase from confirmation through delivery.</p>
          </div>
          <div className="orders-overview">
            <div><ShoppingBag /><span><strong>{userOrders.length}</strong>Total orders</span></div>
            <div><RotateCcw /><span><strong>{activeCount}</strong>In progress</span></div>
            <div><CheckCircle /><span><strong>{deliveredCount}</strong>Delivered</span></div>
          </div>
        </section>

        {userOrders.length === 0 ? (
          <div className="empty-orders">
            <Package className="empty-icon-large" />
            <h3 className="empty-title">No Orders Yet</h3>
            <p className="empty-subtitle">
              Start shopping to see your orders here
            </p>
            <Link to="/products" className="empty-btn">
              Browse Products
            </Link>
          </div>
        ) : (
          <>
            <div className="orders-filter-bar" role="tablist" aria-label="Filter orders">
              {(["All", "Active", "Delivered", "Cancelled"] as const).map((filter) => {
                const count = filter === "All" ? userOrders.length : filter === "Active" ? activeCount : filter === "Delivered" ? deliveredCount : userOrders.filter((order) => order.status === "Cancelled").length;
                return (
                  <button key={filter} type="button" role="tab" aria-selected={orderFilter === filter} onClick={() => setOrderFilter(filter)} className={orderFilter === filter ? "active" : ""}>
                    {filter}<span>{count}</span>
                  </button>
                );
              })}
            </div>
            {filteredOrders.length === 0 ? (
              <div className="orders-filter-empty">
                <Package />
                <h3>No {orderFilter.toLowerCase()} orders</h3>
                <p>Orders matching this status will appear here.</p>
              </div>
            ) : (
            <div className="orders-list" key={orderFilter}>
            {filteredOrders.map((order, index) => {
              const isExpanded = expandedOrder === order.id;
              const currentStep = order.status === "Cancelled" ? -1 : getStepIndex(order.status);
              return (
                <div key={order.id} className={`order-card ${isExpanded ? "expanded" : ""}`} style={{ animationDelay: `${index * 0.05}s` }}>
                  {/* Header */}
                  <button
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="order-header"
                    aria-expanded={isExpanded}
                  >
                    <div className="order-id-section">
                      <div className="order-id-icon">
                        <Package />
                      </div>
                      <div>
                        <p className="order-id-text">{order.id}</p>
                        <p className="order-date">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            { year: "numeric", month: "long", day: "numeric" },
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="order-header-right">
                      <StatusBadge status={order.status} />
                      <span className="order-total">
                        ₱{order.total.toFixed(2)}
                      </span>
                      {isExpanded ? (
                        <ChevronUp className="order-chevron" />
                      ) : (
                        <ChevronDown className="order-chevron" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="order-details">
                      {order.status === "Cancelled" && (
                        <div className="cancelled-order-note"><XCircle /><div><strong>This order was cancelled</strong><span>No further delivery updates will be recorded.</span></div></div>
                      )}
                      {/* Progress Tracker */}
                      <div className="order-tracker-section">
                        <h4 className="tracker-title">Order Status</h4>
                        <div className="progress-container">
                          {/* Progress Line */}
                          <div className="progress-line">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${Math.max(0, (currentStep / (statusSteps.length - 1)) * 100)}%`,
                              }}
                            />
                          </div>
                          {statusSteps.map((step, i) => {
                            const done = i <= currentStep;
                            return (
                              <div key={step.key} className="progress-step">
                                <div
                                  className={`step-circle ${done ? "done" : "pending"}`}
                                >
                                  <step.icon />
                                </div>
                                <span
                                  className={`step-label ${done ? "done" : "pending"}`}
                                >
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="items-section">
                        <h4 className="items-title">Items</h4>
                        {order.items.map((item) => (
                          <div key={item.product.id} className="item-row">
                            {item.product.image ? <img src={item.product.image} alt={item.product.name} className="item-image" /> : <div className="item-image item-image-placeholder" aria-label="No product image" />}
                            <div className="item-details">
                              <p className="item-name">{item.product.name}</p>
                              <p className="item-qty">
                                Qty: {item.quantity} × ₱
                                {item.product.price.toFixed(2)}
                              </p>
                            </div>
                            <span className="item-total">
                              ₱{(item.product.price * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="order-summary">
                        <div className="summary-row">
                          <span className="label">Payment Method</span>
                          <span className="method">
                            {order.paymentMethod === "COD" ? <><Banknote /> Cash on Delivery</> : <><Smartphone /> GCash</>}
                          </span>
                        </div>
                        <div className="summary-total">
                          <span>Total</span>
                          <span className="amount">
                            ₱{order.total.toFixed(2)}
                          </span>
                        </div>
                        {["Pending", "Confirmed", "Packed"].includes(order.status) && (
                          <button
                            className="cancel-order-btn"
                            onClick={async (event) => {
                              event.stopPropagation();
                              if (window.confirm("Cancel this order?")) await cancelOrder(order.id);
                            }}
                          >
                            Cancel Order
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
