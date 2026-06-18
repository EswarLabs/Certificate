import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { Shield } from "lucide-react";

export default function Register() {
    const { registerEmail, loading, error } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        const firstName = e.target.firstName.value;
        const lastName = e.target.lastName.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        await registerEmail(firstName, lastName, email, password);
        navigate("/dashboard");
    }

    return (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "var(--bg-primary)" }}>
            <div className="card" style={{ width: "100%", maxWidth: "440px", padding: "32px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ textAlign: "center" }}>
                    <Shield size={32} style={{ color: "var(--text-primary)", marginBottom: "16px" }} />
                    <h2 style={{ fontSize: "20px", fontWeight: "600", color: "var(--text-primary)", marginBottom: "8px" }}>Create an account</h2>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px" }}>Enter your details to get started</p>
                </div>

                {error && <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "6px", fontSize: "13px", textAlign: "center" }}>{error}</div>}

                <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label htmlFor="firstName" style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>First Name</label>
                            <input className="input" type="text" id="firstName" name="firstName" placeholder="John" required />
                        </div>
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label htmlFor="lastName" style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>Last Name</label>
                            <input className="input" type="text" id="lastName" name="lastName" placeholder="Doe" required />
                        </div>
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label htmlFor="email" style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>Email Address</label>
                        <input className="input" type="email" id="email" name="email" placeholder="name@company.com" required />
                    </div>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <label htmlFor="password" style={{ fontSize: "13px", fontWeight: "500", color: "var(--text-primary)" }}>Password</label>
                        <input className="input" type="password" id="password" name="password" placeholder="Create a strong password" required />
                    </div>
                    
                    <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: "8px", width: "100%", height: "36px" }}>
                        {loading ? "Creating account..." : "Register"}
                    </button>
                </form>

                <div style={{ textAlign: "center", fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px" }}>
                    Already have an account? <Link to="/login" style={{ color: "var(--text-primary)", fontWeight: "500" }}>Log in</Link>
                </div>
            </div>
        </div>
    );
}