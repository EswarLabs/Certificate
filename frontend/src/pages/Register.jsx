import { useState } from "react";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

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
        <>
            {error && <p style={{ color: "red" }}>{error}</p>}
            <div>
                <h2>Register</h2>
                <form onSubmit={handleRegister}>
                    <input type="text" name="firstName" placeholder="First Name" />
                    <input type="text" name="lastName" placeholder="Last Name" />
                    <input type="email" name="email" placeholder="Email" />
                    <input type="password" name="password" placeholder="Password" />
                    <button type="submit">Register</button>
                </form>
                <Link to="/login">Already have an account? Login</Link>
            </div>
            {loading && <p>Loading...</p>}
        </>
    );
}