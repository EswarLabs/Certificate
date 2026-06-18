import { GoogleLogin } from "@react-oauth/google";
import useAuth from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Shield } from "lucide-react";

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
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
        <div style={{ textAlign: "center" }}>
          <Shield size={32} style={{ color: "var(--text-primary)", marginBottom: "16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>Welcome back</h2>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Log in to your account to continue</p>
        </div>

        {error && <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "6px", fontSize: "13px", textAlign: "center" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "center" }}>
          <GoogleLogin
            onSuccess={handleGoogleLoginSuccess}
            onError={() => {
              console.error("Login Failed");
            }}
            theme="outline"
            size="large"
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", color: "var(--text-tertiary)", fontSize: "12px" }}>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
          <span style={{ padding: "0 12px" }}>or continue with email</span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "var(--border-color)" }}></div>
        </div>

        <form onSubmit={handleEmailLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="email" style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>Email Address</label>
            <input 
              className="input" 
              type="email" 
              id="email"
              name="email" 
              placeholder="name@company.com" 
              required 
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label htmlFor="password" style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>Password</label>
            <input 
              className="input" 
              type="password" 
              id="password"
              name="password" 
              placeholder="••••••••" 
              required 
            />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: "8px", width: "100%", height: "36px" }}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px" }}>
          Don't have an account? <Link to="/register" style={{ color: "var(--text-primary)", fontWeight: "500" }}>Register</Link>
        </div>
      </div>
    </div>
  );
}