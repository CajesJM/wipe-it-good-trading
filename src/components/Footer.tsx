import React from "react";
import {
  Wrench,
  MapPin,
  Globe,
  MessageCircle,
  Phone,
  Mail,
} from "lucide-react";
import "@/styles/footer.css";

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-grid">
          {/* Brand */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="footer-logo-icon">
                <Wrench />
              </div>
              <div className="footer-logo-text">
                <span className="footer-logo-main">Wipe It Good</span>
                <span className="footer-logo-sub">Trading</span>
              </div>
            </div>
            <p className="footer-description">
              Reliable generators, equipment, hoses, and tools for every job.
              Wholesale and retail inquiries are welcome.
            </p>
            <div className="footer-trust-strip">
              <span>Quality equipment</span><span>Wholesale friendly</span><span>Fast response</span>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="footer-section-title">Contact Us</h4>
            <div className="footer-contact">
              <div className="contact-item address">
                <MapPin className="icon" />
                <span>Quezon City, Philippines</span>
              </div>
              <div className="contact-item phone">
                <Phone className="icon" />
                <span>+63 930 590 9481</span>
              </div>
              <div className="footer-social">
                <a
                  href="/"
                  aria-label="Wipe It Good Trading website"
                  className="social-icon"
                >
                  <Globe />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=61586263960469"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Message Wipe It Good Trading on Facebook"
                  className="social-icon"
                >
                  <MessageCircle />
                </a>
                <a
                  href="mailto:wipeitgoodtrading@gmail.com"
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Send email to Wipe It Good Trading"
                  className="social-icon"
                >
                  <Mail />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-bottom-text">
            © {new Date().getFullYear()} Wipe It Good Trading. All rights
            reserved.
          </p>
          <p className="footer-bottom-text">
            Tools and equipment for every job
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
