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
  Wrench,
  ShieldCheck,
  CreditCard,
  Headphones,
  BadgeCheck,
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
  const usesModernStoreNav = location.pathname === "/" || location.pathname === "/products" || location.pathname.startsWith("/product/") || location.pathname === "/orders" || location.pathname === "/cart" || location.pathname === "/profile";
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
                <Wrench />
              </div>
              <span className="admin-logo-text">WIG Admin</span>
            </Link>
            <div className="admin-links">
              <Link to="/admin/profile" className="admin-profile-trigger" aria-label="Open admin profile">
                <span className="admin-avatar">
                  {user?.profileImage ? <img src={user.profileImage} alt="" /> : <User />}
                </span>
                <span className="admin-profile-name">{user?.fullName?.split(" ")[0]}</span>
              </Link>
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
    <>
      {usesModernStoreNav && (
        <div className="home-service-bar">
          <div className="home-service-bar-inner">
            <span><BadgeCheck /> Quality-checked equipment</span>
            <span><ShieldCheck /> Secure checkout</span>
            <span><CreditCard /> GCash & cash on delivery</span>
            <span><Headphones /> Customer support</span>
          </div>
        </div>
      )}
      <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/" className="navbar-logo">
            <img
              className="brand-logo-image"
              src="/images/wipe-it-good-logo.svg"
              alt="Wipe It Good Trading"
            />
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
            <Link to="/cart" className="cart-btn" id="cart-icon-target" aria-label="Shopping cart">
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
                    {user.profileImage
                      ? <img src={user.profileImage} alt={`${user.fullName} profile`} />
                      : <span className="avatar-text">{(user.fullName.trim().charAt(0) || user.email.charAt(0)).toUpperCase()}</span>}
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
                      {!user.isAdmin && <Link to="/profile" className="dropdown-link" onClick={() => setProfileOpen(false)}><User /> My Profile</Link>}
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
            {user && !user.isAdmin && <Link to="/profile" className="mobile-nav-link" onClick={() => setMobileOpen(false)}>My Profile</Link>}
          </div>
        )}
      </div>
      </nav>
    </>
  );
};

export default Navbar;
