import { GoogleLogin } from "@react-oauth/google";
import useAuth from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Award, ArrowRight, AlertCircle } from "lucide-react";
import "./auth-pages.css";

const FEATURES = [
  "Drag-and-drop certificate editor",
  "Bulk CSV imports",
  "Public verification links",
  "Email delivery with tracking",
];

export default function Login() {
  const { loginGoogle, loginEmail, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleGoogleLoginSuccess = async (credentialResponse) => {
    await loginGoogle(credentialResponse.credential);
    navigate("/dashboard");
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    await loginEmail(e.target.email.value, e.target.password.value);
    navigate("/dashboard");
  };

  return (
    <div className="auth-root">
      {/* ── Left brand panel ── */}
      <div className="auth-brand">
        <div className="auth-logo">
          <div className="auth-logo-icon">
            <Award size={28} color="#fff" />
          </div>
          <span className="auth-logo-name">CertManager</span>
        </div>

        <p className="auth-tagline">Issue &amp; verify certificates at scale</p>

        <p className="auth-description">
          Manage certificate templates, issue credentials, and verify
          authenticity — all in one platform.
        </p>

        <div className="auth-features">
          {FEATURES.map((f) => (
            <div key={f} className="auth-feature-item">
              <span className="auth-feature-check">✓</span>
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-form-panel">
        <div className="auth-form-card">
          {/* Mobile-only compact logo */}
          <div className="auth-mobile-logo">
            <div className="auth-logo-icon" style={{ width: 38, height: 38, borderRadius: 10 }}>
              <Award size={20} color="#fff" />
            </div>
            <span className="auth-logo-name" style={{ fontSize: 18 }}>CertManager</span>
          </div>

          <div className="auth-form-heading">
            <h1 className="auth-form-title">Welcome back</h1>
            <p className="auth-form-subtitle">Log in to your account to continue</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <div className="auth-google-wrap">
            <GoogleLogin
              onSuccess={handleGoogleLoginSuccess}
              onError={() => {}}
              theme="outline"
              size="large"
              width="100%"
            />
          </div>

          <div className="auth-divider">
            <div className="auth-divider-line" />
            <span className="auth-divider-text">or continue with email</span>
            <div className="auth-divider-line" />
          </div>

          <form className="auth-form" onSubmit={handleEmailLogin}>
            <div>
              <label className="auth-label">Email Address</label>
              <input
                className="auth-input"
                type="email"
                name="email"
                placeholder="name@company.com"
                required
                autoComplete="email"
              />
            </div>
            <div>
              <label className="auth-label">Password</label>
              <input
                className="auth-input"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <button type="submit" disabled={loading} className="auth-submit-btn">
              {loading ? "Signing in…" : <><span>Sign in</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="auth-footer-text">
            Don't have an account?{" "}
            <Link to="/register" className="auth-footer-link">Register for free</Link>
          </p>
        </div>
      </div>
    </div>
  );
}