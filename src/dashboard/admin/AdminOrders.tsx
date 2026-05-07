import React, { useState } from 'react';
import { Search, Filter, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import StatusBadge from '../../components/StatusBadge';
import Modal from '../../components/Modal';
import { ORDER_STATUSES } from '../../utils/constants';
import type { OrderStatus } from '../../utils/constants';
import type { Order } from '../../utils/types';

const AdminOrders: React.FC = () => {
  const { orders, updateOrderStatus } = useStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<'createdAt' | 'total'>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const filtered = orders
    .filter((o) => {
      const matchSearch = !search || o.id.toLowerCase().includes(search.toLowerCase()) || o.userName.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || o.status === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'total') return (a.total - b.total) * mul;
      return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * mul;
    });

  const toggleSort = (field: 'createdAt' | 'total') => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortIcon = ({ field }: { field: 'createdAt' | 'total' }) => {
    if (sortField !== field) return <ChevronDown className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3 h-3 text-primary-500" /> : <ChevronDown className="w-3 h-3 text-primary-500" />;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Order Management</h1>
        <p className="text-gray-500 text-sm mt-1">View, accept, and update order statuses</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by order ID or customer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="All">All Status</option>
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Order ID</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Customer</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Items</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4 cursor-pointer" onClick={() => toggleSort('total')}>
                  <span className="flex items-center gap-1">Total <SortIcon field="total" /></span>
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Payment</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4 cursor-pointer" onClick={() => toggleSort('createdAt')}>
                  <span className="flex items-center gap-1">Date <SortIcon field="createdAt" /></span>
                </th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((order) => (
                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">{order.id}</td>
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-gray-900">{order.userName}</p>
                    <p className="text-xs text-gray-500">{order.userEmail}</p>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">{order.items.length} item(s)</td>
                  <td className="px-5 py-4 text-sm font-bold text-gray-900">₱{order.total.toFixed(2)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{order.paymentMethod}</td>
                  <td className="px-5 py-4">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="bg-gray-50 border border-gray-200 rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-4 text-xs text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No orders found</p>
          </div>
        )}
      </div>

      {/* Order Detail Modal */}
      <Modal
        isOpen={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        title={`Order ${selectedOrder?.id || ''}`}
        maxWidth="max-w-2xl"
      >
        {selectedOrder && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Customer</h4>
                <p className="text-sm font-medium text-gray-900">{selectedOrder.userName}</p>
                <p className="text-xs text-gray-600">{selectedOrder.userEmail}</p>
                <p className="text-xs text-gray-600">{selectedOrder.userPhone}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Delivery</h4>
                <p className="text-xs text-gray-600">{selectedOrder.userAddress}</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Items</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                    <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg" />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.product.name}</p>
                      <p className="text-xs text-gray-500">Qty: {item.quantity} × ₱{item.product.price.toFixed(2)}</p>
                    </div>
                    <span className="font-semibold text-sm">₱{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-gray-100 pt-4">
              <div className="flex items-center gap-3">
                <StatusBadge status={selectedOrder.status} large />
                <span className="text-sm text-gray-500">{selectedOrder.paymentMethod}</span>
              </div>
              <span className="text-xl font-bold text-primary-600">₱{selectedOrder.total.toFixed(2)}</span>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminOrders;
