import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  User,
  Menu,
  X,
  LogOut,
  Package,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";
import { useStore } from "../hooks/useStore";
import "@/styles/navbar.css";

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout, getCartCount } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = location.pathname.startsWith("/admin");
  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate("/");
  };

  if (isAdmin) {
    return (
      <nav className="admin-navbar">
        <div className="navbar-container">
          <div className="navbar-inner">
            <Link to="/admin" className="admin-logo">
              <div className="admin-logo-icon">
                <Sparkles />
              </div>
              <span className="admin-logo-text">WIG Admin</span>
            </Link>
            <div className="admin-links">
              <Link to="/" className="admin-link">
                View Store
              </Link>
              <button onClick={handleLogout} className="admin-logout">
                <LogOut /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  // User Navbar
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <div className="logo-icon">
              <Sparkles />
            </div>
            <div className="logo-text">
              <span className="logo-main">Wipe It Good</span>
              <span className="logo-sub">Trading</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links">
            <Link
              to="/"
              className={`nav-link ${location.pathname === "/" ? "active" : ""}`}
            >
              Home
            </Link>
            <Link
              to="/products"
              className={`nav-link ${location.pathname === "/products" ? "active" : ""}`}
            >
              Products
            </Link>
            {user && !user.isAdmin && (
              <Link
                to="/orders"
                className={`nav-link ${location.pathname === "/orders" ? "active" : ""}`}
              >
                My Orders
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="nav-actions">
            <Link to="/cart" className="cart-btn">
              <ShoppingCart />
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>

            {user ? (
              <div className="user-menu">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="user-menu-btn"
                >
                  <div className="avatar">
                    <span className="avatar-text">
                      {user.fullName.charAt(0)}
                    </span>
                  </div>
                  <span className="user-name">
                    {user.fullName.split(" ")[0]}
                  </span>
                </button>
                {profileOpen && (
                  <>
                    <div
                      className="overlay"
                      onClick={() => setProfileOpen(false)}
                    />
                    <div className="profile-dropdown">
                      <div className="profile-info">
                        <p className="profile-name">{user.fullName}</p>
                        <p className="profile-email">{user.email}</p>
                      </div>
                      {user.isAdmin && (
                        <Link
                          to="/admin"
                          className="dropdown-link"
                          onClick={() => setProfileOpen(false)}
                        >
                          <LayoutDashboard /> Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/orders"
                        className="dropdown-link"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Package /> My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="dropdown-logout"
                      >
                        <LogOut /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link to="/login" className="login-btn">
                <User /> Login
              </Link>
            )}

            {/* Mobile Toggle */}
            <button
              className="mobile-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <div className="mobile-nav">
            <Link
              to="/"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/products"
              className="mobile-nav-link"
              onClick={() => setMobileOpen(false)}
            >
              Products
            </Link>
            {user && (
              <Link
                to="/orders"
                className="mobile-nav-link"
                onClick={() => setMobileOpen(false)}
              >
                My Orders
              </Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
