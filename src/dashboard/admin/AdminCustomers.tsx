import React, { useEffect, useState } from "react";
import {
  Search,
  Eye,
  Mail,
  Phone,
  MapPin,
  Package,
  Calendar,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import Modal from "../../components/Modal";
import StatusBadge from "../../components/StatusBadge";
import type { User } from "../../utils/types";
import AdminPagination from "./AdminPagination";
import "@/styles/admin_css/adminCustomers.css";

const AdminCustomers: React.FC = () => {
  const { users, orders } = useStore();
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const customers = users.filter((u) => !u.isAdmin);

  const filtered = customers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.phone.includes(q)
    );
  });
  useEffect(() => setPage(1), [search]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedCustomers = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getCustomerOrders = (userId: string) =>
    orders.filter((o) => o.userId === userId);
  const getCustomerTotal = (userId: string) =>
    getCustomerOrders(userId).reduce((s, o) => s + o.total, 0);

  return (
    <div className="admin-customers">
      <div className="page-header">
        <h1 className="page-title">Customer Management</h1>
        <p className="page-subtitle">View customer details and order history</p>
      </div>

      {/* Search */}
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="customers-grid">
        {pagedCustomers.map((customer) => {
          const customerOrders = getCustomerOrders(customer.id);
          const totalSpent = getCustomerTotal(customer.id);
          return (
            <div key={customer.id} className="customer-card">
              <div className="card-header">
                <div className="avatar">
                  <span className="avatar-text">
                    {customer.fullName.charAt(0)}
                  </span>
                </div>
                <div className="customer-info">
                  <h3 className="customer-name">{customer.fullName}</h3>
                  <p className="customer-email">{customer.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(customer)}
                  className="view-btn"
                >
                  <Eye />
                </button>
              </div>
              <div className="stats-row">
                <div className="stat-box">
                  <p className="stat-value">{customerOrders.length}</p>
                  <p className="stat-label">Orders</p>
                </div>
                <div className="stat-box">
                  <p className="stat-value total">₱{totalSpent.toFixed(0)}</p>
                  <p className="stat-label">Total Spent</p>
                </div>
              </div>
              <div className="verification-row">
                <span
                  className={`badge ${customer.verified ? "verified" : "pending"}`}
                >
                  {customer.verified ? "✓ Verified" : "⏳ Pending"}
                </span>
                <span className="joined-date">
                  Joined{" "}
                  {new Date(customer.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="empty-state">
          <p className="empty-message">No customers found</p>
        </div>
      )}
      <AdminPagination page={page} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPageChange={setPage} />

      {/* Customer Detail Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Customer Details"
        maxWidth="max-w-2xl"
      >
        {selectedUser && (
          <div className="detail-content">
            <div className="detail-header">
              <div className="detail-avatar">
                <span className="detail-avatar-text">
                  {selectedUser.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="detail-name">{selectedUser.fullName}</h3>
                <span
                  className={`detail-badge badge ${selectedUser.verified ? "verified" : "pending"}`}
                >
                  {selectedUser.verified
                    ? "✓ Verified"
                    : "⏳ Pending Verification"}
                </span>
              </div>
            </div>

            <div className="info-grid">
              <div className="info-item">
                <Mail />
                <span>{selectedUser.email}</span>
              </div>
              <div className="info-item">
                <Phone />
                <span>{selectedUser.phone}</span>
              </div>
              <div className="info-item full-width">
                <MapPin />
                <span>{selectedUser.address}</span>
              </div>
              <div className="info-item">
                <Calendar />
                <span>
                  Joined{" "}
                  {new Date(selectedUser.createdAt).toLocaleDateString(
                    "en-US",
                    { year: "numeric", month: "long", day: "numeric" },
                  )}
                </span>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h4 className="order-section-title">
                <Package /> Order History
              </h4>
              {getCustomerOrders(selectedUser.id).length > 0 ? (
                <div className="order-list">
                  {getCustomerOrders(selectedUser.id).map((order) => (
                    <div key={order.id} className="order-item">
                      <div>
                        <p className="order-id">{order.id}</p>
                        <p className="order-meta">
                          {new Date(order.createdAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                          {" · "}
                          {order.items.length} item(s)
                        </p>
                      </div>
                      <div className="order-right">
                        <StatusBadge status={order.status} />
                        <span className="order-total">
                          ₱{order.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="no-orders">No orders yet</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCustomers;
