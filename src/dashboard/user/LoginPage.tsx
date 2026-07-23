import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, BadgeCheck, PackageCheck, ShieldCheck } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import "@/styles/user_css/authPages.css";

const LoginPage: React.FC = () => {
  const { login, loginWithToken, setPassword: setAppPassword } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [setPasswordMode, setSetPasswordMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("google_token");
    const shouldSetPassword = params.get("set_password") === "1";
    if (!token) return;
    setLoading(true);
    void loginWithToken(token).then((signedInUser) => {
      window.history.replaceState({}, document.title, "/login");
      if (shouldSetPassword) setSetPasswordMode(true);
      else navigate(signedInUser?.isAdmin ? "/admin" : "/");
    }).catch(() => setError("Google sign-in could not be completed.")).finally(() => setLoading(false));
  }, [loginWithToken, navigate]);

  const handleSetPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true); setError("");
    try { await setAppPassword(newPassword); setSetPasswordMode(false); setNewPassword(""); setSuccess("Password created. You can now sign in with your Gmail and this password."); }
    catch (err: any) { setError(err.response?.data?.error ?? "Unable to create password."); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.user?.isAdmin) {
          navigate("/admin");
        } else {
          navigate("/");
        }
      } else {
        setError(result.error || "Invalid email or password");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page login-page">
      <header className="auth-topbar">
        <Link to="/" className="auth-brand" aria-label="Wipe It Good Trading home">
          <img src="/images/wipe-it-good-logo.svg" alt="Wipe It Good Trading" />
        </Link>
        <Link to="/" className="auth-back-link">Back to store <ArrowRight /></Link>
      </header>
      <div className="auth-shell login-container">
        <aside className="auth-showcase">
          <div className="auth-showcase-copy">
            <span className="auth-eyebrow"><BadgeCheck /> Customer equipment portal</span>
            <h2>Reliable tools.<br />Simpler ordering.</h2>
            <p>Sign in to manage your cart, delivery details, and equipment orders in one secure place.</p>
            <div className="auth-benefits">
              <span><ShieldCheck /> Verified customer access</span>
              <span><PackageCheck /> Live inventory and order tracking</span>
            </div>
          </div>
          <div className="auth-showcase-caption">
            <strong>Wipe It Good Trading</strong>
            <span>Tools and equipment for home, trade, and business.</span>
          </div>
        </aside>

        <section className="auth-card login-card">
          <div className="auth-form-header login-header">
            <span className="auth-form-kicker">Customer sign in</span>
            <h1 className="login-title">Welcome back</h1>
            <p className="login-subtitle">Enter your details to continue shopping.</p>
          </div>

          <form onSubmit={handleSubmit} className="auth-form login-form">
            {error && (
              <div className="feedback-box error-box">
                <AlertCircle />
                {error}
              </div>
            )}
            {success && <div className="feedback-box success-box">{success}</div>}

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
                  autoComplete="email"
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
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              {loading ? <><span className="auth-spinner" /> Signing in…</> : "Sign in"}
            </button>

            <div className="login-divider"><span>or continue with</span></div>
            <button type="button" className="google-login-btn" onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"}/auth/google/start`; }}>
              <span className="google-mark">G</span> Continue with Google
            </button>

            <p className="register-link">
              Don't have an account? <Link to="/register">Sign Up</Link>
            </p>
            <p className="auth-security-note"><Lock /> Your credentials are encrypted and sent securely.</p>
          </form>
        </section>
        {setPasswordMode && (
          <div className="password-modal-backdrop" role="presentation">
            <div className="password-modal" role="dialog" aria-modal="true" aria-labelledby="set-password-title">
              <button type="button" className="password-modal-close" onClick={() => setSetPasswordMode(false)} aria-label="Close">×</button>
              <div className="password-modal-icon"><Lock /></div>
              <h2 id="set-password-title">Create an app password</h2>
              <p>Google sign-in is complete. Create a password for future email/password sign-ins.</p>
              <form onSubmit={handleSetPassword}>
                <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="At least 8 characters" minLength={8} required autoFocus />
                <button type="submit" className="login-submit" disabled={loading}>{loading ? "Saving..." : "Create Password"}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
