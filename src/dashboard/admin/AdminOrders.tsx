import React, { useState } from "react";
import { Search, Filter, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import StatusBadge from "../../components/StatusBadge";
import Modal from "../../components/Modal";
import { ORDER_STATUSES } from "../../utils/constants";
import type { OrderStatus } from "../../utils/constants";
import type { Order } from "../../utils/types";
import "@/styles/admin_css/adminOrders.css";

const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus } = useStore();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [sortField, setSortField] = useState<"createdAt" | "total">(
    "createdAt",
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orders
    .filter((o) => {
      const matchSearch =
        !search ||
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.userName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === "All" || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      if (sortField === "total") return (a.total - b.total) * mul;
      return (
        (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) *
        mul
      );
    });

  const toggleSort = (field: "createdAt" | "total") => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: "createdAt" | "total" }) => {
    if (sortField !== field)
      return (
        <ChevronDown
          className="sort-icon"
          style={{ color: "var(--gray-300)" }}
        />
      );
    return sortDir === "asc" ? (
      <ChevronUp
        className="sort-icon"
        style={{ color: "var(--primary-500)" }}
      />
    ) : (
      <ChevronDown
        className="sort-icon"
        style={{ color: "var(--primary-500)" }}
      />
    );
  };

  return (
    <div className="admin-orders">
      <div className="page-header">
        <h1 className="page-title">Order Management</h1>
        <p className="page-subtitle">View, accept, and update order statuses</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="filter-select-wrapper">
          <Filter className="filter-icon" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="All">All Status</option>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="orders-table-container">
        <div style={{ overflowX: "auto" }}>
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th
                  className="sortable-header"
                  onClick={() => toggleSort("total")}
                >
                  Total <SortIcon field="total" />
                </th>
                <th>Payment</th>
                <th>Status</th>
                <th
                  className="sortable-header"
                  onClick={() => toggleSort("createdAt")}
                >
                  Date <SortIcon field="createdAt" />
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id}>
                  <td className="order-id">{order.id}</td>
                  <td>
                    <p className="customer-name">{order.userName}</p>
                    <p className="customer-email">{order.userEmail}</p>
                  </td>
                  <td className="items-count">{order.items.length} item(s)</td>
                  <td className="total-amount">₱{order.total.toFixed(2)}</td>
                  <td className="payment-method">{order.paymentMethod}</td>
                  <td>
                    <select
                      value={order.status}
                      onChange={(e) =>
                        updateOrderStatus(
                          order.id,
                          e.target.value as OrderStatus,
                        )
                      }
                      className="status-select"
                    >
                      {ORDER_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="order-date">
                    {new Date(order.createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td>
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="action-btn"
                    >
                      <Eye />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="empty-message">No orders found</div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.id || ""}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="modal-section">
            <div className="modal-grid">
              <div className="modal-info-card">
                <h4 className="modal-info-title">Customer</h4>
                <p className="modal-info-text">{selectedOrder.userName}</p>
                <p className="modal-sub-text">{selectedOrder.userEmail}</p>
                <p className="modal-sub-text">{selectedOrder.userPhone}</p>
              </div>
              <div className="modal-info-card">
                <h4 className="modal-info-title">Delivery</h4>
                <p className="modal-sub-text">{selectedOrder.userAddress}</p>
              </div>
            </div>
            <div>
              <h4 className="modal-items-title">Items</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.5rem",
                }}
              >
                {selectedOrder.items.map((item) => (
                  <div key={item.product.id} className="modal-item">
                    <img
                      src={item.product.image}
                      alt={item.product.name}
                      className="modal-item-image"
                    />
                    <div className="modal-item-details">
                      <p className="modal-item-name">{item.product.name}</p>
                      <p className="modal-item-qty">
                        Qty: {item.quantity} × ₱{item.product.price.toFixed(2)}
                      </p>
                    </div>
                    <span className="modal-item-price">
                      ₱{(item.product.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="modal-footer">
              <div className="modal-footer-left">
                <StatusBadge status={selectedOrder.status} large />
                <span className="payment-method">
                  {selectedOrder.paymentMethod}
                </span>
              </div>
              <span className="modal-footer-total">
                ₱{selectedOrder.total.toFixed(2)}
              </span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;
