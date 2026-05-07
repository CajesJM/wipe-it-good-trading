import React, { useState } from 'react';
import { Search, Eye, Mail, Phone, MapPin, Package, Calendar } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import Modal from '../../components/Modal';
import StatusBadge from '../../components/StatusBadge';
import type { User } from '../../utils/types';

const AdminCustomers: React.FC = () => {
  const { users, orders } = useStore();
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const customers = users.filter((u) => !u.isAdmin);

  const filtered = customers.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.phone.includes(q);
  });

  const getCustomerOrders = (userId: string) => orders.filter((o) => o.userId === userId);
  const getCustomerTotal = (userId: string) => getCustomerOrders(userId).reduce((s, o) => s + o.total, 0);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-gray-900">Customer Management</h1>
        <p className="text-gray-500 text-sm mt-1">View customer details and order history</p>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Customers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((customer) => {
          const customerOrders = getCustomerOrders(customer.id);
          const totalSpent = getCustomerTotal(customer.id);
          return (
            <div key={customer.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 bg-primary-100 rounded-full flex items-center justify-center shrink-0">
                  <span className="text-primary-700 font-bold">{customer.fullName.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm truncate">{customer.fullName}</h3>
                  <p className="text-xs text-gray-500 truncate">{customer.email}</p>
                </div>
                <button
                  onClick={() => setSelectedUser(customer)}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition"
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-gray-900">{customerOrders.length}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Orders</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-primary-600">₱{totalSpent.toFixed(0)}</p>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider">Total Spent</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${customer.verified ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                  {customer.verified ? '✓ Verified' : '⏳ Pending'}
                </span>
                <span className="text-[10px] text-gray-400">
                  Joined {new Date(customer.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <p className="text-gray-500">No customers found</p>
        </div>
      )}

      {/* Customer Detail Modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="Customer Details"
        maxWidth="max-w-2xl"
      >
        {selectedUser && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center shrink-0">
                <span className="text-primary-700 font-bold text-2xl">{selectedUser.fullName.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedUser.fullName}</h3>
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${selectedUser.verified ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-yellow-600'}`}>
                  {selectedUser.verified ? '✓ Verified' : '⏳ Pending Verification'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Mail className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-700">{selectedUser.email}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Phone className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-700">{selectedUser.phone}</span>
              </div>
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-3 sm:col-span-2">
                <MapPin className="w-4 h-4 text-primary-500 mt-0.5" />
                <span className="text-sm text-gray-700">{selectedUser.address}</span>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                <Calendar className="w-4 h-4 text-primary-500" />
                <span className="text-sm text-gray-700">
                  Joined {new Date(selectedUser.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                </span>
              </div>
            </div>

            {/* Order History */}
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Package className="w-4 h-4 text-primary-500" /> Order History
              </h4>
              {getCustomerOrders(selectedUser.id).length > 0 ? (
                <div className="space-y-2">
                  {getCustomerOrders(selectedUser.id).map((order) => (
                    <div key={order.id} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.id}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          {' · '}{order.items.length} item(s)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={order.status} />
                        <span className="font-bold text-sm">₱{order.total.toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 bg-gray-50 rounded-xl p-4 text-center">No orders yet</p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminCustomers;
