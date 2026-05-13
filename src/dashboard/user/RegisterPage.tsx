import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  User,
  Phone,
  MapPin,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { useStore } from "../../hooks/useStore";
import "@/styles/user_css/registerPage.css";

const RegisterPage: React.FC = () => {
  const { register } = useStore();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phone: "",
    address: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setTimeout(() => {
      register({
        email: formData.email,
        fullName: formData.fullName,
        phone: formData.phone,
        address: formData.address,
      });
      navigate("/");
      setLoading(false);
    }, 500);
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-card">
          {/* Header */}
          <div className="register-header">
            <div className="header-icon">
              <Sparkles />
            </div>
            <h1 className="header-title">Create Account</h1>
            <p className="header-subtitle">Join Wipe It Good Trading</p>
          </div>

          {/* Steps indicator */}
          <div className="steps-bar">
            <div
              className={`step-item ${step >= 1 ? "step-active" : "step-inactive"}`}
            >
              <div className="step-circle">
                {step > 1 ? <CheckCircle className="w-3.5 h-3.5" /> : "1"}
              </div>
              <span>Account</span>
            </div>
            <div className={`step-connector ${step >= 2 ? "active" : ""}`} />
            <div
              className={`step-item ${step >= 2 ? "step-active" : "step-inactive"}`}
            >
              <div className="step-circle">2</div>
              <span>Details</span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="register-form">
            {error && (
              <div className="error-box">
                <AlertCircle />
                {error}
              </div>
            )}

            {step === 1 && (
              <div className="step-content">
                <div className="input-group">
                  <label className="input-label">Gmail Address</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="you@gmail.com"
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="At least 6 characters"
                      required
                      className="input-field"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="password-toggle"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Confirm Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Re-enter password"
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (
                      !formData.email ||
                      !formData.password ||
                      !formData.confirmPassword
                    ) {
                      setError("Please fill in all fields");
                      return;
                    }
                    if (formData.password !== formData.confirmPassword) {
                      setError("Passwords do not match");
                      return;
                    }
                    setError("");
                    setStep(2);
                  }}
                  className="btn-primary"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="step-content">
                <div className="input-group">
                  <label className="input-label">Full Name</label>
                  <div className="input-wrapper">
                    <User className="input-icon" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      placeholder="Juan Dela Cruz"
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">Phone Number</label>
                  <div className="input-wrapper">
                    <Phone className="input-icon" />
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="+63 9XX XXX XXXX"
                      required
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Complete Address / Location
                  </label>
                  <div className="input-wrapper">
                    <MapPin className="input-icon" style={{ top: "0.75rem" }} />
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="House/Unit No., Street, Barangay, City, Province"
                      required
                      rows={3}
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="button-row">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="btn-secondary"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                  >
                    {loading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </div>
            )}

            <p className="login-link">
              Already have an account? <Link to="/login">Sign In</Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
