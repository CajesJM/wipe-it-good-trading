import React, { useState } from 'react';
import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import { LayoutDashboard, Package, ShoppingCart, Users, ChevronLeft, ChevronRight } from 'lucide-react';
import { useStore } from '../../hooks/useStore';

const sidebarItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Orders', exact: false },
  { path: '/admin/products', icon: Package, label: 'Products', exact: false },
  { path: '/admin/customers', icon: Users, label: 'Customers', exact: false },
];

const AdminLayout: React.FC = () => {
  const { user } = useStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // Protect admin routes
  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string, exact: boolean) => {
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <aside className={`bg-gray-900 text-white ${collapsed ? 'w-16' : 'w-60'} transition-all duration-300 flex flex-col shrink-0`}>
        <nav className="flex-1 py-4 space-y-1 px-2">
          {sidebarItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  active
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-3 text-gray-500 hover:text-white transition flex items-center justify-center border-t border-gray-800"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 bg-gray-50 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
