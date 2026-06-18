import { GoogleLogin } from "@react-oauth/google";
import useAuth from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Award, ArrowRight } from "lucide-react";

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
    <div style={{ minHeight: "100vh", display: "flex", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)" }}>
      {/* Left brand panel */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px", gap: 24, borderRight: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={26} style={{ color: "#fff" }} />
          </div>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" }}>CertManager</span>
        </div>
        <p style={{ fontSize: 28, fontWeight: 700, color: "#f1f5f9", textAlign: "center", lineHeight: 1.3, maxWidth: 340, letterSpacing: "-0.02em" }}>
          Issue & verify certificates at scale
        </p>
        <p style={{ fontSize: 15, color: "#94a3b8", textAlign: "center", maxWidth: 300 }}>
          Manage certificate templates, issue credentials, and verify authenticity — all in one platform.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {["✓ Drag-and-drop certificate editor", "✓ Bulk CSV imports", "✓ Public verification links", "✓ Email delivery with tracking"].map(f => (
            <div key={f} style={{ fontSize: 13, color: "#a5b4fc" }}>{f}</div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: "48px" }}>
        <div style={{ width: "100%", maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: "#f1f5f9", marginBottom: 6, letterSpacing: "-0.025em" }}>Welcome back</h1>
            <p style={{ fontSize: 14, color: "#64748b" }}>Log in to your account to continue</p>
          </div>

          {error && (
            <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
              {error}
            </div>
          )}

          <div style={{ marginBottom: 20 }}>
            <GoogleLogin onSuccess={handleGoogleLoginSuccess} onError={() => {}} theme="outline" size="large" width="100%" />
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            <span style={{ fontSize: 12, color: "#475569" }}>or continue with email</span>
            <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
          </div>

          <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div className="form-group">
              <label className="label" style={{ color: "#94a3b8" }}>Email Address</label>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="name@company.com"
                required
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
            <div className="form-group">
              <label className="label" style={{ color: "#94a3b8" }}>Password</label>
              <input
                className="input"
                type="password"
                name="password"
                placeholder="••••••••"
                required
                style={{ background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#f1f5f9" }}
                onFocus={e => e.target.style.borderColor = "#6366f1"}
                onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Signing in…" : <><span>Sign in</span><ArrowRight size={15} /></>}
            </button>
          </form>

          <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#475569" }}>
            Don't have an account?{" "}
            <Link to="/register" style={{ color: "#818cf8", fontWeight: 500 }}>Register for free</Link>
          </div>
        </div>
      </div>
    </div>
  );
}