import React from "react";
import { Link } from "react-router-dom";
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  Globe,
  MessageCircle,
} from "lucide-react";
import "@/styles/footer.css"; // <-- use alias import

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <Sparkles />
              </div>
              <div className="footer-logo-text">
                <span className="footer-logo-main">Wipe It Good</span>
                <span className="footer-logo-sub">Trading</span>
              </div>
            </div>
            <p className="footer-description">
              Your trusted partner for premium cleaning products. Quality
              supplies for a spotless home and workplace.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="footer-section-title">Quick Links</h4>
            <div className="footer-links">
              <Link to="/" className="footer-link">
                Home
              </Link>
              <Link to="/products" className="footer-link">
                Products
              </Link>
              <Link to="/cart" className="footer-link">
                Cart
              </Link>
              <Link to="/orders" className="footer-link">
                Track Orders
              </Link>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="footer-section-title">Categories</h4>
            <div className="footer-links">
              <Link to="/products" className="footer-link">
                Surface Cleaners
              </Link>
              <Link to="/products" className="footer-link">
                Disinfectants
              </Link>
              <Link to="/products" className="footer-link">
                Kitchen Cleaners
              </Link>
              <Link to="/products" className="footer-link">
                Cleaning Kits
              </Link>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-section-title">Contact Us</h4>
            <div className="footer-contact">
              <div className="contact-item">
                <Phone className="icon" />
                <span>+63 918 999 0000</span>
              </div>
              <div className="contact-item">
                <Mail className="icon" />
                <span>hello@wipeitgood.com</span>
              </div>
              <div className="contact-item address">
                <MapPin className="icon" />
                <span>Taguig City, Metro Manila, Philippines</span>
              </div>
              <div className="footer-social">
                <a href="#" className="social-icon">
                  <Globe />
                </a>
                <a href="#" className="social-icon">
                  <MessageCircle />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-bottom-text">
            © 2025 Wipe It Good Trading. All rights reserved.
          </p>
          <p className="footer-bottom-text">
            Premium Cleaning Products for Every Home
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
