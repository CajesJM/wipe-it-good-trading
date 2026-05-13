import React, { useState } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import "@/styles/admin_css/adminLayout.css";

const sidebarItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { path: "/admin/orders", icon: ShoppingCart, label: "Orders", exact: false },
  { path: "/admin/products", icon: Package, label: "Products", exact: false },
  { path: "/admin/customers", icon: Users, label: "Customers", exact: false },
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
    return exact
      ? location.pathname === path
      : location.pathname.startsWith(path);
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${collapsed ? "collapsed" : "expanded"}`}>
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${active ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
              >
                <item.icon />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="sidebar-toggle"
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
