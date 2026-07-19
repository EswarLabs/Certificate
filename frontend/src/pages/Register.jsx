import { useState } from "react";
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

export default function Register() {
  const { registerEmail, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    await registerEmail(
      e.target.firstName.value,
      e.target.lastName.value,
      e.target.email.value,
      e.target.password.value
    );
    navigate("/onboarding");
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

        <p className="auth-tagline">Start issuing digital certificates today</p>

        <p className="auth-description">
          Create professional, verifiable credentials for your students, employees, or event attendees in minutes.
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
            <h1 className="auth-form-title">Create your account</h1>
            <p className="auth-form-subtitle">Start managing certificates for free</p>
          </div>

          {error && (
            <div className="auth-error">
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleRegister}>
            <div className="auth-form-row">
              <div>
                <label className="auth-label">First Name</label>
                <input
                  className="auth-input"
                  type="text"
                  name="firstName"
                  placeholder="John"
                  required
                  autoComplete="given-name"
                />
              </div>
              <div>
                <label className="auth-label">Last Name</label>
                <input
                  className="auth-input"
                  type="text"
                  name="lastName"
                  placeholder="Doe"
                  required
                  autoComplete="family-name"
                />
              </div>
            </div>

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
                placeholder="Create a strong password (min. 8 chars)"
                required
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit-btn" style={{ marginTop: 8 }}>
              {loading ? "Creating account…" : <><span>Create Account</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <p className="auth-footer-text">
            Already have an account?{" "}
            <Link to="/login" className="auth-footer-link">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}