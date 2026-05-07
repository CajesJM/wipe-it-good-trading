import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Menu, X, LogOut, Package, LayoutDashboard, Sparkles } from 'lucide-react';
import { useStore } from '../hooks/useStore';

const Navbar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const { user, logout, getCartCount } = useStore();
  const location = useLocation();
  const navigate = useNavigate();

  const isAdmin = location.pathname.startsWith('/admin');
  const cartCount = getCartCount();

  const handleLogout = () => {
    logout();
    setProfileOpen(false);
    navigate('/');
  };

  if (isAdmin) {
    return (
      <nav className="bg-gray-900 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/admin" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-lg">WIG Admin</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link to="/" className="text-sm text-gray-300 hover:text-white transition">
                View Store
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50 animate-slide-down">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-lg text-gray-900">Wipe It Good</span>
              <span className="text-[10px] text-primary-600 font-medium tracking-widest uppercase">Trading</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className={`text-sm font-medium transition ${location.pathname === '/' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
              Home
            </Link>
            <Link to="/products" className={`text-sm font-medium transition ${location.pathname === '/products' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
              Products
            </Link>
            {user && !user.isAdmin && (
              <Link to="/orders" className={`text-sm font-medium transition ${location.pathname === '/orders' ? 'text-primary-600' : 'text-gray-600 hover:text-primary-600'}`}>
                My Orders
              </Link>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <Link to="/cart" className="relative p-2 text-gray-600 hover:text-primary-600 transition">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-primary-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full animate-scale-in">
                  {cartCount}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 bg-primary-50 px-3 py-1.5 rounded-full hover:bg-primary-100 transition"
                >
                  <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">{user.fullName.charAt(0)}</span>
                  </div>
                  <span className="text-sm font-medium text-primary-700 hidden sm:block max-w-[100px] truncate">
                    {user.fullName.split(' ')[0]}
                  </span>
                </button>
                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-scale-in">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="text-sm font-semibold text-gray-900">{user.fullName}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                      {user.isAdmin && (
                        <Link
                          to="/admin"
                          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                          onClick={() => setProfileOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4" /> Admin Dashboard
                        </Link>
                      )}
                      <Link
                        to="/orders"
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                        onClick={() => setProfileOpen(false)}
                      >
                        <Package className="w-4 h-4" /> My Orders
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full text-left"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link
                to="/login"
                className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm"
              >
                <User className="w-4 h-4" /> Login
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2 text-gray-600 hover:text-primary-600"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileOpen && (
          <div className="md:hidden border-t border-gray-100 py-3 animate-slide-down">
            <Link to="/" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50 rounded-lg" onClick={() => setMobileOpen(false)}>Home</Link>
            <Link to="/products" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50 rounded-lg" onClick={() => setMobileOpen(false)}>Products</Link>
            {user && (
              <Link to="/orders" className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-primary-50 rounded-lg" onClick={() => setMobileOpen(false)}>My Orders</Link>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
