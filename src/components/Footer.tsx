import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Phone, Mail, MapPin, Globe, MessageCircle } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-display font-bold text-lg text-white">Wipe It Good</span>
                <span className="text-[10px] text-primary-400 font-medium tracking-widest uppercase">Trading</span>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your trusted partner for premium cleaning products. Quality supplies for a spotless home and workplace.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
            <div className="flex flex-col gap-2">
              <Link to="/" className="text-sm hover:text-primary-400 transition">Home</Link>
              <Link to="/products" className="text-sm hover:text-primary-400 transition">Products</Link>
              <Link to="/cart" className="text-sm hover:text-primary-400 transition">Cart</Link>
              <Link to="/orders" className="text-sm hover:text-primary-400 transition">Track Orders</Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">Categories</h4>
            <div className="flex flex-col gap-2">
              <Link to="/products" className="text-sm hover:text-primary-400 transition">Surface Cleaners</Link>
              <Link to="/products" className="text-sm hover:text-primary-400 transition">Disinfectants</Link>
              <Link to="/products" className="text-sm hover:text-primary-400 transition">Kitchen Cleaners</Link>
              <Link to="/products" className="text-sm hover:text-primary-400 transition">Cleaning Kits</Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">Contact Us</h4>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-4 h-4 text-primary-400" />
                <span>+63 918 999 0000</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-primary-400" />
                <span>hello@wipeitgood.com</span>
              </div>
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary-400 mt-0.5" />
                <span>Taguig City, Metro Manila, Philippines</span>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition">
                  <Globe className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-primary-600 transition">
                  <MessageCircle className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="text-xs text-gray-500">© 2025 Wipe It Good Trading. All rights reserved.</p>
          <p className="text-xs text-gray-500">Premium Cleaning Products for Every Home</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
