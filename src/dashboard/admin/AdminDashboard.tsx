import React from 'react';
import { Link } from 'react-router-dom';
import { Package, ShoppingCart, Users, TrendingUp, DollarSign, Clock, CheckCircle, Truck } from 'lucide-react';
import { useStore } from '../../hooks/useStore';
import StatusBadge from '../../components/StatusBadge';

const AdminDashboard: React.FC = () => {
  const { products, orders, users } = useStore();

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => o.status === 'Pending').length;
  const confirmedOrders = orders.filter((o) => o.status === 'Confirmed').length;
  const shippedOrders = orders.filter((o) => o.status === 'Shipped').length;
  const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
  const customerCount = users.filter((u) => !u.isAdmin).length;

  const stats = [
    { icon: DollarSign, label: 'Total Revenue', value: `₱${totalRevenue.toLocaleString('en-PH', { minimumFractionDigits: 2 })}`, color: 'bg-green-50 text-green-600', iconBg: 'bg-green-100' },
    { icon: ShoppingCart, label: 'Total Orders', value: orders.length, color: 'bg-blue-50 text-blue-600', iconBg: 'bg-blue-100' },
    { icon: Package, label: 'Products', value: products.length, color: 'bg-purple-50 text-purple-600', iconBg: 'bg-purple-100' },
    { icon: Users, label: 'Customers', value: customerCount, color: 'bg-orange-50 text-orange-600', iconBg: 'bg-orange-100' },
  ];

  const orderStats = [
    { icon: Clock, label: 'Pending', count: pendingOrders, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { icon: CheckCircle, label: 'Confirmed', count: confirmedOrders, color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: Truck, label: 'Shipped', count: shippedOrders, color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Package, label: 'Delivered', count: deliveredOrders, color: 'text-green-600', bg: 'bg-green-50' },
  ];

  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Welcome back! Here's what's happening with your store.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 animate-fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                <stat.icon className={`w-5 h-5 ${stat.color.split(' ')[1]}`} />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Order Status Summary */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="font-display font-bold text-lg text-gray-900 mb-4">Order Status Overview</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {orderStats.map((stat, i) => (
            <div key={i} className={`${stat.bg} rounded-xl p-4 text-center`}>
              <stat.icon className={`w-6 h-6 ${stat.color} mx-auto mb-2`} />
              <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
              <p className="text-xs text-gray-600 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-gray-900">Recent Orders</h2>
            <Link to="/admin/orders" className="text-primary-600 text-sm font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{order.id}</p>
                  <p className="text-xs text-gray-500">{order.userName}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={order.status} />
                  <span className="text-sm font-bold text-gray-900">₱{order.total.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-lg text-gray-900">Top Products</h2>
            <Link to="/admin/products" className="text-primary-600 text-sm font-medium hover:underline">View All</Link>
          </div>
          <div className="space-y-3">
            {[...products].sort((a, b) => b.soldCount - a.soldCount).slice(0, 5).map((product, i) => (
              <div key={product.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.soldCount} sold</p>
                </div>
                <span className="text-sm font-bold text-gray-900">₱{product.price.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
