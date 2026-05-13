import React from "react";
import { Link } from "react-router-dom";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Truck,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import StatusBadge from "../../components/StatusBadge";
import "@/styles/admin_css/adminDashboard.css";

const AdminDashboard: React.FC = () => {
  const { products, orders, users } = useStore();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === "Pending").length;
  const confirmedOrders = orders.filter((o) => o.status === "Confirmed").length;
  const shippedOrders = orders.filter((o) => o.status === "Shipped").length;
  const deliveredOrders = orders.filter((o) => o.status === "Delivered").length;
  const customerCount = users.filter((u) => !u.isAdmin).length;

  const stats = [
    {
      icon: DollarSign,
      label: "Total Revenue",
      value: `₱${totalRevenue.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
      className: "revenue",
    },
    {
      icon: ShoppingCart,
      label: "Total Orders",
      value: orders.length,
      className: "orders",
    },
    {
      icon: Package,
      label: "Products",
      value: products.length,
      className: "products",
    },
    {
      icon: Users,
      label: "Customers",
      value: customerCount,
      className: "customers",
    },
  ];

  const orderStats = [
    {
      icon: Clock,
      label: "Pending",
      count: pendingOrders,
      className: "pending",
    },
    {
      icon: CheckCircle,
      label: "Confirmed",
      count: confirmedOrders,
      className: "confirmed",
    },
    {
      icon: Truck,
      label: "Shipped",
      count: shippedOrders,
      className: "shipped",
    },
    {
      icon: Package,
      label: "Delivered",
      count: deliveredOrders,
      className: "delivered",
    },
  ];

  const recentOrders = [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .slice(0, 5);

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Admin Dashboard</h1>
        <p className="dashboard-subtitle">
          Welcome back! Here's what's happening with your store.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {stats.map((stat, i) => (
          <div
            key={i}
            className="stat-card"
            style={{ animationDelay: `${i * 0.1}s` }}
          >
            <div className="stat-header">
              <div className={`stat-icon ${stat.className}`}>
                <stat.icon />
              </div>
              <TrendingUp className="stat-trend" />
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Order Status Overview */}
      <div className="status-overview">
        <h2 className="status-overview-title">Order Status Overview</h2>
        <div className="status-grid">
          {orderStats.map((stat, i) => (
            <div key={i} className={`status-card ${stat.className}`}>
              <stat.icon className={`status-card-icon ${stat.className}`} />
              <div className={`status-card-count ${stat.className}`}>
                {stat.count}
              </div>
              <div className="status-card-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-columns">
        {/* Recent Orders */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">Recent Orders</h2>
            <Link to="/admin/orders" className="view-all-link">
              View All
            </Link>
          </div>
          <div>
            {recentOrders.map((order) => (
              <div key={order.id} className="list-item">
                <div className="list-item-left">
                  <span className="list-item-title">{order.id}</span>
                  <span className="list-item-subtitle">{order.userName}</span>
                </div>
                <div className="list-item-right">
                  <StatusBadge status={order.status} />
                  <span className="list-item-price">
                    ₱{order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="section-card">
          <div className="section-header">
            <h2 className="section-title">Top Products</h2>
            <Link to="/admin/products" className="view-all-link">
              View All
            </Link>
          </div>
          <div>
            {[...products]
              .sort((a, b) => b.soldCount - a.soldCount)
              .slice(0, 5)
              .map((product, i) => (
                <div key={product.id} className="top-product-item">
                  <span className="top-product-rank">#{i + 1}</span>
                  <img
                    src={product.image}
                    alt={product.name}
                    className="top-product-image"
                  />
                  <div className="top-product-info">
                    <p className="top-product-name">{product.name}</p>
                    <p className="top-product-sold">{product.soldCount} sold</p>
                  </div>
                  <span className="list-item-price">
                    ₱{product.price.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
