import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ChevronDown, ChevronUp, Clock, CheckCircle, Truck, Home } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import StatusBadge from '../../components/StatusBadge';
import type { OrderStatus } from '../../utils/constants';

const statusSteps: { key: OrderStatus; icon: React.ElementType; label: string }[] = [
  { key: 'Pending', icon: Clock, label: 'Order Placed' },
  { key: 'Confirmed', icon: CheckCircle, label: 'Confirmed' },
  { key: 'Shipped', icon: Truck, label: 'Shipped' },
  { key: 'Delivered', icon: Home, label: 'Delivered' },
];

const OrdersPage: React.FC = () => {
  const { user, orders } = useStore();
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f8faf9] flex items-center justify-center">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-500 mb-4">Please login to view your orders</p>
          <Link to="/login" className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold">
            Login
          </Link>
        </div>
      </div>
    );
  }

  const userOrders = orders.filter((o) => o.userId === user.id);

  const getStepIndex = (status: OrderStatus) => statusSteps.findIndex((s) => s.key === status);

  return (
    <div className="min-h-screen bg-[#f8faf9] py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-2">My Orders</h1>
        <p className="text-gray-500 mb-8">Track and manage your purchases</p>

        {userOrders.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
            <Package className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Orders Yet</h3>
            <p className="text-gray-500 mb-6 text-sm">Start shopping to see your orders here</p>
            <Link to="/products" className="inline-flex items-center gap-2 bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {userOrders.map((order) => {
              const isExpanded = expandedOrder === order.id;
              const currentStep = getStepIndex(order.status);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in"
                >
                  {/* Header */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center shrink-0">
                        <Package className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-900 text-sm">{order.id}</p>
                        <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={order.status} />
                      <span className="font-bold text-gray-900 hidden sm:block">₱{order.total.toFixed(2)}</span>
                      {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 p-5 animate-fade-in">
                      {/* Progress Tracker */}
                      <div className="mb-6">
                        <h4 className="text-sm font-semibold text-gray-900 mb-4">Order Status</h4>
                        <div className="flex items-center justify-between relative">
                          {/* Progress Line */}
                          <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-200">
                            <div
                              className="h-full bg-primary-500 transition-all duration-500"
                              style={{ width: `${(currentStep / (statusSteps.length - 1)) * 100}%` }}
                            />
                          </div>
                          {statusSteps.map((step, i) => {
                            const done = i <= currentStep;
                            return (
                              <div key={step.key} className="relative z-10 flex flex-col items-center gap-1.5">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition ${done ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                  <step.icon className="w-4 h-4" />
                                </div>
                                <span className={`text-[10px] font-medium ${done ? 'text-primary-600' : 'text-gray-400'}`}>
                                  {step.label}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Items */}
                      <div className="space-y-3 mb-4">
                        <h4 className="text-sm font-semibold text-gray-900">Items</h4>
                        {order.items.map((item) => (
                          <div key={item.product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                            <img src={item.product.image} alt={item.product.name} className="w-12 h-12 object-cover rounded-lg" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.product.name}</p>
                              <p className="text-xs text-gray-500">Qty: {item.quantity} × ₱{item.product.price.toFixed(2)}</p>
                            </div>
                            <span className="font-semibold text-sm text-gray-900">₱{(item.product.price * item.quantity).toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      {/* Summary */}
                      <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                          <span>Payment Method</span>
                          <span className="font-medium">{order.paymentMethod === 'COD' ? '💵 Cash on Delivery' : '📱 GCash'}</span>
                        </div>
                        <div className="flex justify-between font-bold text-gray-900 text-lg">
                          <span>Total</span>
                          <span className="text-primary-600">₱{order.total.toFixed(2)}</span>
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
