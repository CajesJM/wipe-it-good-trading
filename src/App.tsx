import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import LandingPage from './dashboard/user/LandingPage';
import ProductsPage from './dashboard/user/ProductsPage';
import ProductDetailPage from './dashboard/user/ProductDetailPage';
import CartPage from './dashboard/user/CartPage';
import OrdersPage from './dashboard/user/OrdersPage';
import LoginPage from './dashboard/user/LoginPage';
import RegisterPage from './dashboard/user/RegisterPage';
import UserProfile from './dashboard/user/UserProfile';
import PaymentReturnPage from './dashboard/user/PaymentReturnPage';
import AdminLayout from './dashboard/admin/AdminLayout';
import AdminDashboard from './dashboard/admin/AdminDashboard';
import AdminOrders from './dashboard/admin/AdminOrders';
import AdminProducts from './dashboard/admin/AdminProducts';
import AdminCustomers from './dashboard/admin/AdminCustomers';
import AdminHistory from './dashboard/admin/AdminHistory';
import AdminProfile from './dashboard/admin/AdminProfile';
import './styles/userTheme.css';
import './styles/homepageModern.css';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isModernStorePage = location.pathname === '/' || location.pathname === '/products' || location.pathname.startsWith('/product/') || location.pathname === '/orders' || location.pathname === '/cart' || location.pathname === '/profile' || location.pathname === '/payment/return';

  return (
    <div className={`flex flex-col min-h-screen ${isAdminPage ? 'admin-app' : `customer-app${isModernStorePage ? ' home-app' : ''}`}`}>
      {!isAuthPage && <Navbar />}
      <div className="flex-1">
        <Routes>
          {/* User Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/payment/return" element={<PaymentReturnPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="orders" element={<AdminOrders />} />
            <Route path="products" element={<AdminProducts />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="history" element={<AdminHistory />} />
            <Route path="profile" element={<AdminProfile />} />
          </Route>
        </Routes>
      </div>
      {!isAuthPage && !isAdminPage && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
};

export default App;
