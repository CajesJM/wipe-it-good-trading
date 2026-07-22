import React, { useEffect, useState } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  ChevronLeft,
  ChevronRight,
  Menu,
  History,
  UserCircle,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import "@/styles/admin_css/adminLayout.css";
import "@/styles/admin_css/adminTheme.css";

const sidebarItems = [
  { path: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { path: "/admin/orders", icon: ShoppingCart, label: "Orders", exact: false },
  { path: "/admin/products", icon: Package, label: "Products", exact: false },
  { path: "/admin/customers", icon: Users, label: "Customers", exact: false },
  { path: "/admin/history", icon: History, label: "History", exact: false },
  { path: "/admin/profile", icon: UserCircle, label: "Profile", exact: false },
];

const AdminLayout: React.FC = () => {
  const { user, orders } = useStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [ordersViewedAt, setOrdersViewedAt] = useState(() => Number(localStorage.getItem("wig-admin-orders-viewed-at") ?? 0));

  // Protect admin routes
  if (!user || !user.isAdmin) {
    return <Navigate to="/login" replace />;
  }

  const isActive = (path: string, exact: boolean) => {
    return exact
      ? location.pathname === path
      : location.pathname.startsWith(path);
  };
  const unreadOrderAlerts = orders.filter((order) => {
    if (order.status !== "Pending" && order.status !== "Cancelled") return false;
    const activityTime = new Date(order.updatedAt || order.createdAt).getTime();
    return activityTime > ordersViewedAt;
  }).length;

  useEffect(() => {
    if (!location.pathname.startsWith("/admin/orders")) return;
    const viewedAt = Date.now();
    localStorage.setItem("wig-admin-orders-viewed-at", String(viewedAt));
    setOrdersViewedAt(viewedAt);
  }, [location.pathname]);

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      {mobileOpen && <button aria-label="Close admin menu" className="sidebar-backdrop" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${collapsed ? "collapsed" : "expanded"} ${mobileOpen ? "mobile-open" : ""}`}>
        <nav className="sidebar-nav">
          {sidebarItems.map((item) => {
            const active = isActive(item.path, item.exact);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-link ${active ? "active" : ""}`}
                title={collapsed ? item.label : undefined}
                onClick={() => setMobileOpen(false)}
              >
                <item.icon />
                {!collapsed && <span>{item.label}</span>}
                {item.path === "/admin/orders" && unreadOrderAlerts > 0 && <span className="sidebar-badge" aria-label={`${unreadOrderAlerts} unread order updates`}>{unreadOrderAlerts > 99 ? "99+" : unreadOrderAlerts}</span>}
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
        <button className="mobile-menu-button" onClick={() => setMobileOpen(true)} aria-label="Open admin menu">
          <Menu />
          <span>Menu</span>
        </button>
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
