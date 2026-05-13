import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Sparkles, AlertCircle } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import "@/styles/user_css/loginPage.css";

const LoginPage: React.FC = () => {
  const { login } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const result = login(email, password);
      if (result.success) {
        if (result.user?.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setError("Account not found. Try one of the demo accounts below.");
      }
      setLoading(false);
    }, 500);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-header-icon">
              <Sparkles />
            </div>
            <h1 className="login-title">Welcome Back</h1>
            <p className="login-subtitle">Sign in to your account</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div className="error-box">
                <AlertCircle />
                {error}
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email Address</label>
              <div className="input-wrapper">
                <Mail className="input-icon" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
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

            <button type="submit" disabled={loading} className="login-submit">
              {loading ? "Signing in..." : "Sign In"}
            </button>

            <p className="register-link">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
          </form>

          {/* Demo Accounts */}
          <div className="demo-section">
            <p className="demo-title">Demo Accounts</p>
            <div className="demo-buttons">
              <button
                onClick={() => {
                  setEmail("maria.santos@gmail.com");
                  setPassword("demo");
                }}
                className="demo-btn"
              >
                <span className="demo-label">Customer:</span>{" "}
                <span className="demo-email">maria.santos@gmail.com</span>
              </button>
              <button
                onClick={() => {
                  setEmail("admin@wipeitgood.com");
                  setPassword("demo");
                }}
                className="demo-btn"
              >
                <span className="demo-label">Admin:</span>{" "}
                <span className="demo-email">admin@wipeitgood.com</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
