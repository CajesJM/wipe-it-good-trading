import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Wrench,
  Shield,
  Truck,
  HeadphonesIcon,
  Star,
  ChevronRight,
} from "lucide-react";
import { PRODUCT_IMAGES } from "../../utils/constants";
import { useStore } from "../../hooks/useStore";
import ProductCard from "../../components/ProductCard";
import "@/styles/landingPage.css";

const LandingPage: React.FC = () => {
  const { products } = useStore();
  const featuredProducts = products.filter((p) => p.featured).slice(0, 4);
  const topSelling = products.filter((p) => p.topSelling).slice(0, 4);

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-dots" />
        <div className="hero-container">
          <div className="hero-grid">
            <div className="hero-left animate-fade-in">
              <div className="hero-badge">
                <Wrench />
                <span>Tools that work as hard as you do</span>
              </div>
              <h1 className="hero-title">
                Built for the <span className="accent">real work.</span>
                <br />
                <span className="light">Priced for your business.</span>
              </h1>
              <p className="hero-subtitle">
                Shop dependable generators, power tools, carwash equipment,
                and accessories for home, trade, and business use.
              </p>
              <div className="hero-buttons">
                <Link to="/products" className="btn-primary">
                  Shop Now <ArrowRight />
                </Link>
                <Link to="/products" className="btn-ghost">
                  Browse Catalog
                </Link>
              </div>
            </div>
            <div className="hero-right animate-slide-up">
              <div className="hero-image-wrapper">
                <img src={PRODUCT_IMAGES.hero} alt="Generator and power tools in a workshop" />
                <div className="hero-image-overlay" />
              </div>
              <div
                className="floating-card floating-card-bottom"
                style={{ animationDelay: "0.3s" }}
              >
                <div className="floating-card-inner">
                  <div className="floating-card-icon blue">
                    <Star />
                  </div>
                  <div className="floating-card-text">
                    <p className="value">4.8/5</p>
                    <p className="label">Buyer rating</p>
                  </div>
                </div>
              </div>
              <div
                className="floating-card floating-card-top"
                style={{ animationDelay: "0.5s" }}
              >
                <div className="floating-card-inner">
                  <div className="floating-card-icon orange">
                    <Truck />
                  </div>
                  <div className="floating-card-text">
                    <p className="value">COD + GCash</p>
                    <p className="label">Flexible payment</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="hero-wave">
          <svg
            viewBox="0 0 1440 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0 60L60 50C120 40 240 20 360 15C480 10 600 20 720 25C840 30 960 30 1080 25C1200 20 1320 10 1380 5L1440 0V60H0Z"
              fill="#f8faf9"
            />
          </svg>
        </div>
      </section>

      {/* Trust Bar */}
      <section className="trust-bar">
        <div className="trust-container">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon">
                <Truck />
              </div>
              <div className="trust-text">
                <p className="title">Fast Delivery</p>
                <p className="desc">Delivery across the Philippines</p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">
                <Shield />
              </div>
              <div className="trust-text">
                <p className="title">Quality Assured</p>
                <p className="desc">Tested, dependable equipment</p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">
                <HeadphonesIcon />
              </div>
              <div className="trust-text">
                <p className="title">Product Guidance</p>
                <p className="desc">Help choosing the right unit</p>
              </div>
            </div>
            <div className="trust-card">
              <div className="trust-icon">
                <Star />
              </div>
              <div className="trust-text">
                <p className="title">Wholesale & Retail</p>
                <p className="desc">Pricing for every size of job</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section
        className="featured-section"
        style={{
          paddingTop: "4rem",
          paddingBottom: "4rem",
          backgroundColor: "#f8faf9",
        }}
      >
        <div className="trust-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Featured Products</h2>
              <p className="section-subtitle">
                Handpicked for quality and performance
              </p>
            </div>
            <Link to="/products" className="view-all-link">
              View All <ChevronRight />
            </Link>
          </div>
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Promo Banner */}
      <section className="promo-section">
        <div className="promo-container">
          <div className="promo-card">
            <div className="promo-dots" />
            <div className="promo-content">
              <div>
                <span className="promo-badge">Limited Offer</span>
                <h3 className="promo-title">Need help sizing a generator?</h3>
                <p className="promo-desc">
                  Tell us what you need to power and we’ll help you choose the
                  right capacity before you buy.
                </p>
                <Link to="/register" className="promo-btn">
                  View generators <ArrowRight />
                </Link>
              </div>
              <div className="promo-image">
                <img src={PRODUCT_IMAGES.hero} alt="Generator buying guide" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top Selling */}
      <section
        style={{
          paddingTop: "4rem",
          paddingBottom: "4rem",
          backgroundColor: "white",
        }}
      >
        <div className="trust-container">
          <div className="section-header">
            <div>
              <h2 className="section-title">Top Selling Products</h2>
              <p className="section-subtitle">Our customers' favorites</p>
            </div>
            <Link to="/products" className="view-all-link">
              View All <ChevronRight />
            </Link>
          </div>
          <div className="product-grid">
            {topSelling.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-container">
          <Wrench className="cta-icon" />
          <h2 className="cta-title">Ready for the next job?</h2>
          <p className="cta-desc">
            Equip your home, workshop, or business with tools selected for
            performance, value, and dependable after-sales support.
          </p>
          <Link to="/products" className="cta-btn">
            Start Shopping <ArrowRight />
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
