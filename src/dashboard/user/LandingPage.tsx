import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  AtSign,
  BadgeCheck,
  Banknote,
  ChevronRight,
  Droplets,
  Factory,
  Gauge,
  HeadphonesIcon,
  LockKeyhole,
  MessageCircle,
  PackageCheck,
  Quote,
  Search,
  Send,
  ShieldCheck,
  Star,
  Truck,
  X,
  Waves,
  Wind,
  Wrench,
  Zap,
} from "lucide-react";
import { PRODUCT_IMAGES } from "../../utils/constants";
import { useStore } from "../../hooks/useStore";
import ProductCard from "../../components/ProductCard";
import Toast, { type ToastType } from "../../components/Toast";
import { sendExpertInquiry } from "../../api";
import "@/styles/landingPage.css";

const categoryCards = [
  {
    name: "Silent Inverter Generators",
    description: "Quiet, fuel-efficient power for home and work.",
    icon: Zap,
  },
  {
    name: "Industrial Equipment",
    description: "Dependable machines made for demanding jobs.",
    icon: Factory,
  },
  {
    name: "Pressure & Water Hoses",
    description: "Heavy-duty hoses, fittings, and accessories.",
    icon: Waves,
  },
  {
    name: "Vacuum Cleaners",
    description: "Wet and dry cleaning for shops and businesses.",
    icon: Wind,
  },
];

const LandingPage: React.FC = () => {
  const { products, user } = useStore();
  const navigate = useNavigate();
  const [expertOpen, setExpertOpen] = useState(false);
  const [sendingInquiry, setSendingInquiry] = useState(false);
  const [notice, setNotice] = useState<{ message: string; type: ToastType }>({ message: "", type: "info" });
  const [inquiry, setInquiry] = useState({ name: "", email: "", phone: "", subject: "", message: "", website: "" });
  const featuredProducts = products.filter((product) => product.featured).slice(0, 4);
  const topSelling = products.filter((product) => product.topSelling).slice(0, 3);
  const openExpertModal = () => {
    if (!user) {
      navigate("/login", { state: { from: "/", message: "Sign in to ask an expert." } });
      return;
    }
    setInquiry({
      name: user?.fullName ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      subject: "",
      message: "",
      website: "",
    });
    setExpertOpen(true);
  };
  const submitInquiry = async (event: React.FormEvent) => {
    event.preventDefault();
    if (sendingInquiry) return;
    setSendingInquiry(true);
    try {
      await sendExpertInquiry(inquiry);
      setExpertOpen(false);
      setNotice({ message: "Your message was sent to Wipe It Good Trading.", type: "success" });
    } catch (error: any) {
      setNotice({ message: error?.response?.data?.error ?? "Your message could not be sent. Please try again.", type: "error" });
    } finally {
      setSendingInquiry(false);
    }
  };

  return (
    <div className="landing-page">
      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-grid">
            <div className="hero-left animate-fade-in">
              <div className="hero-badge">
                <BadgeCheck />
                <span>Trusted tools for every serious job</span>
              </div>
              <h1 className="hero-title">
                Power every job.
                <span className="accent"> Build with confidence.</span>
              </h1>
              <p className="hero-subtitle">
                Shop reliable generators, industrial equipment, pressure
                hoses, pumps, and tools selected for performance and value.
              </p>
              <div className="hero-buttons">
                <Link to="/products" className="btn-primary">
                  Explore Products <ArrowRight />
                </Link>
                <button
                  type="button"
                  onClick={openExpertModal}
                  className="btn-ghost"
                >
                  <MessageCircle /> Ask an Expert
                </button>
              </div>
              <div className="hero-proof">
                <div className="hero-proof-icons">
                  <span><Wrench /></span>
                  <span><ShieldCheck /></span>
                  <span><Truck /></span>
                </div>
                <p><strong>Ready for home, trade, and business.</strong><br />Helpful product guidance before you buy.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-shop-shell" aria-label="Shop equipment">
        <div className="home-shop-panel">
          <div className="home-shop-tabs">
            <Link to="/products" className="active"><Zap /> Generators</Link>
            <Link to="/products"><Factory /> Industrial</Link>
            <Link to="/products"><Droplets /> Water Pumps</Link>
            <Link to="/products"><Gauge /> Pressure Hoses</Link>
          </div>
          <div className="home-search-row">
            <div className="home-search-copy">
              <Search />
              <div>
                <span>Find the right equipment</span>
                <strong>Generators, pumps, hoses, vacuums, and more</strong>
              </div>
            </div>
            <Link to="/products" className="home-search-button">
              Search Products <ArrowRight />
            </Link>
          </div>
        </div>
      </section>

      <section className="home-category-section">
        <div className="trust-container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Shop by category</span>
              <h2 className="section-title">Equipment for every kind of work</h2>
              <p className="section-subtitle">Start with the job, then find the right machine.</p>
            </div>
            <Link to="/products" className="view-all-link">
              View all categories <ChevronRight />
            </Link>
          </div>
          <div className="home-category-grid">
            {categoryCards.map(({ name, description, icon: Icon }) => (
              <Link to="/products" className="home-category-card" key={name}>
                <span className="home-category-icon"><Icon /></span>
                <div>
                  <h3>{name}</h3>
                  <p>{description}</p>
                </div>
                <ChevronRight className="home-category-arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="featured-section home-products-section">
        <div className="trust-container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Customer-ready picks</span>
              <h2 className="section-title">Featured equipment</h2>
              <p className="section-subtitle">Quality products selected for performance and value.</p>
            </div>
            <Link to="/products" className="view-all-link">
              View all <ChevronRight />
            </Link>
          </div>
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section className="promo-section">
        <div className="promo-container">
          <div className="promo-card">
            <div className="promo-content">
              <div>
                <span className="promo-badge">Free product guidance</span>
                <h3 className="promo-title">Not sure which generator you need?</h3>
                <p className="promo-desc">
                  Tell us what you need to power. We’ll help you compare
                  capacity, fuel use, noise level, and the best fit for your budget.
                </p>
                <Link to="/products" className="promo-btn">
                  View generators <ArrowRight />
                </Link>
              </div>
              <div className="promo-image">
                <img src={PRODUCT_IMAGES.hero} alt="Generator and equipment buying guide" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {topSelling.length > 0 && (
        <section className="home-deals-section">
          <div className="trust-container">
            <div className="section-header">
              <div>
                <span className="section-kicker">Proven favorites</span>
                <h2 className="section-title">Popular with our customers</h2>
                <p className="section-subtitle">Frequently chosen equipment for everyday work.</p>
              </div>
              <Link to="/products" className="view-all-link">
                Shop all <ChevronRight />
              </Link>
            </div>
            <div className="home-deals-grid">
              <div className="home-deal-callout">
                <span>Practical value</span>
                <h3>Tools that keep the work moving.</h3>
                <p>Reliable equipment, clear prices, and support when you need it.</p>
                <Link to="/products">See all products <ArrowRight /></Link>
              </div>
              {topSelling.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="trust-bar">
        <div className="trust-container">
          <div className="trust-grid">
            <div className="trust-card">
              <div className="trust-icon"><Banknote /></div>
              <div className="trust-text"><p className="title">Flexible Payment</p><p className="desc">GCash and cash on delivery</p></div>
            </div>
            <div className="trust-card">
              <div className="trust-icon"><LockKeyhole /></div>
              <div className="trust-text"><p className="title">Secure Checkout</p><p className="desc">Protected account and order data</p></div>
            </div>
            <div className="trust-card">
              <div className="trust-icon"><PackageCheck /></div>
              <div className="trust-text"><p className="title">Order Updates</p><p className="desc">Track progress from order to delivery</p></div>
            </div>
            <div className="trust-card">
              <div className="trust-icon"><HeadphonesIcon /></div>
              <div className="trust-text"><p className="title">Helpful Support</p><p className="desc">Guidance before and after purchase</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-reviews-section">
        <div className="trust-container">
          <div className="section-header">
            <div>
              <span className="section-kicker">Built around real customers</span>
              <h2 className="section-title">A simpler way to buy equipment</h2>
            </div>
          </div>
          <div className="home-reviews-grid">
            <article className="home-review-card">
              <Quote />
              <p>Clear product details make it easier to compare equipment before placing an order.</p>
              <div><strong>Better buying decisions</strong><span><Star /><Star /><Star /><Star /><Star /></span></div>
            </article>
            <article className="home-review-card">
              <Quote />
              <p>Choose GCash or cash on delivery and follow every order update in one place.</p>
              <div><strong>Convenient checkout</strong><span><Star /><Star /><Star /><Star /><Star /></span></div>
            </article>
            <aside className="home-newsletter">
              <span>Wipe It Good Trading</span>
              <h3>Get product updates and practical buying tips.</h3>
              <p>Follow our store for new equipment, restocks, and offers.</p>
              <a href="https://www.facebook.com/profile.php?id=61586263960469" target="_blank" rel="noreferrer">
                Follow on Facebook <ArrowRight />
              </a>
            </aside>
          </div>
        </div>
      </section>

      {expertOpen && (
        <div className="expert-modal-layer" role="presentation">
          <button className="expert-modal-backdrop" type="button" onClick={() => !sendingInquiry && setExpertOpen(false)} aria-label="Close contact form" />
          <section className="expert-modal" role="dialog" aria-modal="true" aria-labelledby="expert-modal-title">
            <header className="expert-modal-header">
              <div className="expert-modal-heading">
                <span className="expert-modal-icon"><MessageCircle /></span>
                <div>
                  <span>Product guidance</span>
                  <h2 id="expert-modal-title">Ask an Expert</h2>
                </div>
              </div>
              <button type="button" className="expert-modal-close" onClick={() => setExpertOpen(false)} disabled={sendingInquiry} aria-label="Close">
                <X />
              </button>
            </header>
            <form className="expert-form" onSubmit={submitInquiry}>
              <p className="expert-form-intro">
                Tell us what equipment or job you need help with. Your message will be emailed to
                <strong> wipeitgoodtrading@gmail.com</strong>.
              </p>
              <div className="expert-form-grid">
                <label>
                  <span>Full name</span>
                  <input value={inquiry.name} onChange={(event) => setInquiry({ ...inquiry, name: event.target.value })} minLength={2} maxLength={80} autoComplete="name" required placeholder="Your full name" />
                </label>
                <label>
                  <span>Account email <small>Verified</small></span>
                  <div className="expert-input-with-icon expert-account-email"><AtSign /><input type="email" value={inquiry.email} readOnly aria-readonly="true" maxLength={160} autoComplete="email" required /></div>
                </label>
              </div>
              <div className="expert-form-grid">
                <label>
                  <span>Phone number <small>Optional</small></span>
                  <input value={inquiry.phone} onChange={(event) => setInquiry({ ...inquiry, phone: event.target.value })} maxLength={30} autoComplete="tel" inputMode="tel" placeholder="+63 9XX XXX XXXX" />
                </label>
                <label>
                  <span>Subject</span>
                  <input value={inquiry.subject} onChange={(event) => setInquiry({ ...inquiry, subject: event.target.value })} minLength={3} maxLength={120} required placeholder="Example: Generator recommendation" />
                </label>
              </div>
              <label>
                <span>How can we help?</span>
                <textarea value={inquiry.message} onChange={(event) => setInquiry({ ...inquiry, message: event.target.value })} minLength={10} maxLength={2000} required rows={5} placeholder="Tell us what you need to power, clean, pump, cut, or repair..." />
                <small className="expert-character-count">{inquiry.message.length}/2000</small>
              </label>
              <input className="expert-honeypot" tabIndex={-1} aria-hidden="true" autoComplete="off" value={inquiry.website} onChange={(event) => setInquiry({ ...inquiry, website: event.target.value })} />
              <footer className="expert-form-actions">
                <button type="button" className="expert-cancel-btn" onClick={() => setExpertOpen(false)} disabled={sendingInquiry}>Cancel</button>
                <button type="submit" className="expert-submit-btn" disabled={sendingInquiry}>
                  {sendingInquiry ? <><span className="expert-spinner" /> Sending message…</> : <><Send /> Send message</>}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
      <Toast message={notice.message} type={notice.type} onClose={() => setNotice({ ...notice, message: "" })} />
    </div>
  );
};

export default LandingPage;
