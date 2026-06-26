import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Award, ArrowRight } from "lucide-react";

export default function Register() {
  const { registerEmail, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    await registerEmail(e.target.firstName.value, e.target.lastName.value, e.target.email.value, e.target.password.value);
    navigate("/onboarding");
  };

  const inputStyle = { background: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", color: "#f1f5f9" };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)", padding: 24 }}>
      <div style={{ width: "100%", maxWidth: 460 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 32 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Award size={22} style={{ color: "#fff" }} />
          </div>
          <span style={{ fontSize: 20, fontWeight: 800, color: "#f1f5f9", letterSpacing: "-0.03em" }}>CertManager</span>
        </div>

        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#f1f5f9", marginBottom: 6, letterSpacing: "-0.025em" }}>Create your account</h1>
          <p style={{ fontSize: 14, color: "#64748b" }}>Start managing certificates for free</p>
        </div>

        {error && <div style={{ background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", padding: "12px 16px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label" style={{ color: "#94a3b8" }}>First Name</label>
              <input className="input" type="text" name="firstName" placeholder="John" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label className="label" style={{ color: "#94a3b8" }}>Last Name</label>
              <input className="input" type="text" name="lastName" placeholder="Doe" required style={inputStyle}
                onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
            </div>
          </div>
          <div className="form-group">
            <label className="label" style={{ color: "#94a3b8" }}>Email Address</label>
            <input className="input" type="email" name="email" placeholder="name@company.com" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>
          <div className="form-group">
            <label className="label" style={{ color: "#94a3b8" }}>Password</label>
            <input className="input" type="password" name="password" placeholder="Create a strong password" required style={inputStyle}
              onFocus={e => e.target.style.borderColor = "#6366f1"} onBlur={e => e.target.style.borderColor = "rgba(255,255,255,0.1)"} />
          </div>
          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 4, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Creating account\u2026" : <><span>Create Account</span><ArrowRight size={15} /></>}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 13, color: "#475569" }}>
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#818cf8", fontWeight: 500 }}>Log in</Link>
        </div>
      </div>
    </div>
  );
}