import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, BadgeCheck, CheckCircle, Eye, EyeOff, Lock, Mail, PackageCheck, ShieldCheck } from "lucide-react";
import { useStore } from "../../hooks/useStore";
import "@/styles/user_css/authPages.css";

const RegisterPage: React.FC = () => {
  const { register, verifyAccount } = useStore();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "", confirmPassword: "" });
  const [pin, setPin] = useState("");
  const [userId, setUserId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setMessage("");
    if (!form.email.toLowerCase().endsWith("@gmail.com")) return setError("Use a valid Gmail address.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    setLoading(true);
    try {
      const result = await register({ email: form.email, fullName: "Customer", phone: "", address: "", password: form.password });
      if (result.verificationRequired && result.userId) { setUserId(result.userId); setMessage("We sent a 6-digit PIN to your Gmail."); }
      else if (result.success) navigate("/");
      else setError(result.error ?? "Registration failed.");
    } catch (err: any) { setError(err.response?.data?.error ?? err.message ?? "Registration failed."); }
    finally { setLoading(false); }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault(); setError(""); setLoading(true);
    try { await verifyAccount(userId, "EMAIL", pin); navigate("/"); }
    catch (err: any) { setError(err.response?.data?.error ?? "Incorrect or expired PIN."); }
    finally { setLoading(false); }
  };

  const startGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? "http://localhost:5000/api"}/auth/google/start`;
  };

  return (
    <div className="auth-page register-page">
      <header className="auth-topbar">
        <Link to="/" className="auth-brand" aria-label="Wipe It Good Trading home">
          <img src="/images/wipe-it-good-logo.svg" alt="Wipe It Good Trading" />
        </Link>
        <Link to="/" className="auth-back-link">Back to store <ArrowRight /></Link>
      </header>
      <div className="auth-shell register-container">
        <aside className="auth-showcase">
          <div className="auth-showcase-copy">
            <span className="auth-eyebrow"><BadgeCheck /> Built for equipment buyers</span>
            <h2>Your account.<br />Your orders.</h2>
            <p>Create one secure account for faster checkout, saved delivery information, and complete order tracking.</p>
            <div className="auth-benefits">
              <span><ShieldCheck /> Gmail ownership verification</span>
              <span><PackageCheck /> Delivery and purchase history</span>
            </div>
          </div>
          <div className="auth-showcase-caption">
            <strong>Shop with confidence</strong>
            <span>Your phone and address are requested only when you are ready to order.</span>
          </div>
        </aside>

        <section className="auth-card register-card">
          <div className="auth-form-header register-header">
            <span className="auth-form-kicker">{userId ? "Verify your Gmail" : "Customer registration"}</span>
            <h1 className="header-title">{userId ? "Check your inbox" : "Create your account"}</h1>
            <p className="header-subtitle">{userId ? `Enter the code sent to ${form.email}` : "Use a valid Gmail address to get started."}</p>
          </div>
          <form onSubmit={userId ? verify : submit} className="auth-form register-form">
            {error && <div className="feedback-box error-box"><AlertCircle />{error}</div>}
            {message && <div className="feedback-box success-box"><CheckCircle />{message}</div>}
            {!userId ? (
              <>
                <div className="input-group">
                  <label className="input-label">Gmail address</label>
                  <div className="input-wrapper">
                    <Mail className="input-icon" />
                    <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="you@gmail.com" required className="input-field" autoComplete="email" />
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="At least 8 characters" required minLength={8} className="input-field" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle" aria-label={showPassword ? "Hide passwords" : "Show passwords"}>{showPassword ? <EyeOff /> : <Eye />}</button>
                  </div>
                </div>
                <div className="input-group">
                  <label className="input-label">Confirm password</label>
                  <div className="input-wrapper">
                    <Lock className="input-icon" />
                    <input type={showPassword ? "text" : "password"} value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="Re-enter password" required minLength={8} className="input-field" autoComplete="new-password" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="password-toggle" aria-label={showPassword ? "Hide passwords" : "Show passwords"}>{showPassword ? <EyeOff /> : <Eye />}</button>
                  </div>
                </div>
                <p className="form-hint"><ShieldCheck /> Phone number and delivery address are collected securely during checkout.</p>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? <><span className="auth-spinner" /> Creating account…</> : "Create account"}
                </button>
                <div className="login-divider"><span>or continue with</span></div>
                <button type="button" className="google-login-btn" onClick={startGoogle}>
                  <span className="google-mark">G</span> Continue with Google
                </button>
              </>
            ) : (
              <div className="verification-panel">
                <div className="verification-icon"><Mail /></div>
                <div className="input-group">
                  <label className="input-label">Six-digit verification PIN</label>
                  <input inputMode="numeric" pattern="[0-9]{6}" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="000000" required className="input-field pin-input" autoComplete="one-time-code" />
                </div>
                <button type="submit" disabled={loading || pin.length !== 6} className="btn-primary">
                  {loading ? <><span className="auth-spinner" /> Verifying…</> : <>Verify Gmail <ArrowRight /></>}
                </button>
              </div>
            )}
            <p className="login-link">Already have an account? <Link to="/login">Sign in</Link></p>
          </form>
        </section>
      </div>
    </div>
  );
};

export default RegisterPage;
