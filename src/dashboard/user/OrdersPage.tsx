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
  { key: "Shipped", icon: Truck, label: "Shipped" },
  { key: "Delivered", icon: Home, label: "Delivered" },
];

const OrdersPage: React.FC = () => {
  const { user, orders } = useStore();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

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

  const getStepIndex = (status: OrderStatus) =>
    statusSteps.findIndex((s) => s.key === status);

  return (
    <div className="orders-page">
      <div className="orders-container">
        <h1 className="orders-title">My Orders</h1>
        <p className="orders-subtitle">Track and manage your purchases</p>

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
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
          >
            {userOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const currentStep = getStepIndex(order.status);
              return (
                <div key={order.id} className="order-card">
                  {/* Header */}
                  <button
                    onClick={() =>
                      setExpandedOrder(isExpanded ? null : order.id)
                    }
                    className="order-header"
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
                      {/* Progress Tracker */}
                      <div style={{ marginBottom: "1.5rem" }}>
                        <h4 className="tracker-title">Order Status</h4>
                        <div className="progress-container">
                          {/* Progress Line */}
                          <div className="progress-line">
                            <div
                              className="progress-fill"
                              style={{
                                width: `${(currentStep / (statusSteps.length - 1)) * 100}%`,
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
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="item-image"
                            />
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
                            {order.paymentMethod === "COD"
                              ? "💵 Cash on Delivery"
                              : "📱 GCash"}
                          </span>
                        </div>
                        <div className="summary-total">
                          <span>Total</span>
                          <span className="amount">
                            ₱{order.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
