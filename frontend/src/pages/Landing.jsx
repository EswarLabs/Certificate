import { Link } from "react-router-dom";
import { Shield, ArrowRight, Lock, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div style={{ backgroundColor: "var(--bg-primary)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <header style={{ padding: "16px 48px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "600", fontSize: "16px", color: "var(--text-primary)" }}>
          <Shield size={20} />
          CertSecure
        </div>
        <nav style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <Link to="/login" style={{ color: "var(--text-secondary)", fontSize: "13px", fontWeight: "500" }}>Log in</Link>
          <Link to="/register" className="btn btn-primary">Get Started</Link>
        </nav>
      </header>

      {/* Hero */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "80px 24px" }}>
        <div style={{ display: "inline-flex", alignItems: "center", padding: "4px 12px", border: "1px solid var(--border-color)", borderRadius: "16px", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "32px", backgroundColor: "var(--bg-secondary)" }}>
          Next-Gen Credentials
        </div>
        <h1 style={{ fontSize: "40px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "24px", letterSpacing: "-0.03em", maxWidth: "800px", lineHeight: "1.1" }}>
          Secure. Verifiable. Immutable.
        </h1>
        <p style={{ fontSize: "15px", color: "var(--text-secondary)", maxWidth: "540px", marginBottom: "40px", lineHeight: "1.6" }}>
          Issue, manage, and verify digital credentials with absolute cryptographic certainty.
          The modern platform for organizations that value trust and security.
        </p>
        <div style={{ display: "flex", gap: "16px" }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: "0 24px", height: "40px", fontSize: "14px" }}>
            Start Issuing Now <ArrowRight size={16} style={{ marginLeft: "8px" }} />
          </Link>
          <a href="#features" className="btn btn-secondary" style={{ padding: "0 24px", height: "40px", fontSize: "14px", textDecoration: "none" }}>
            Explore Features
          </a>
        </div>
      </main>

      {/* Features Grid */}
      <section id="features" style={{ padding: "80px 48px", backgroundColor: "var(--bg-secondary)", borderTop: "1px solid var(--border-color)" }}>
        <div style={{ maxWidth: "1200px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px" }}>
          <div className="card">
            <Lock size={24} style={{ color: "var(--text-primary)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>Cryptographic Security</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>Every credential issued is cryptographically signed, ensuring it cannot be tampered with or forged.</p>
          </div>
          <div className="card">
            <Zap size={24} style={{ color: "var(--text-primary)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>Instant Verification</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>Verifiers can instantly check the authenticity of a credential with a simple click.</p>
          </div>
          <div className="card">
            <Shield size={24} style={{ color: "var(--text-primary)", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "15px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>Privacy Preserving</h3>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: "1.5" }}>Share only what needs to be shared. Our platform ensures data minimalization and privacy by design.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: "40px", textAlign: "center", borderTop: "1px solid var(--border-color)", fontSize: "13px", color: "var(--text-tertiary)" }}>
        &copy; {new Date().getFullYear()} CertSecure Platform. All rights reserved.
      </footer>
    </div>
  );
}
