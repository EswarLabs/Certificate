import { createContext, useState, useEffect } from "react";
import { loginWithGoogle, loginWithEmail, registerWithEmail, logout, getCurrentUser } from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        // Initialize from localStorage
        const savedUser = localStorage.getItem("user");
        return savedUser ? JSON.parse(savedUser) : null;
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const loginGoogle = async (credential) => {
        setLoading(true);
        setError(null);
        try {
            const res = await loginWithGoogle(credential);
            if (res.success) {
                setUser(res.user);
                localStorage.setItem("user", JSON.stringify(res.user));
                localStorage.setItem("accessToken", res.accessToken);
            } else {
                setError(res.message || "Login failed");
            }
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }
    const registerEmail = async (firstName, lastName, email, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await registerWithEmail(firstName, lastName, email, password);
            if (res.success) {
                setUser(res.user);
                localStorage.setItem("user", JSON.stringify(res.user));
                localStorage.setItem("accessToken", res.accessToken);
            } else {
                setError(res.message || "Register failed");
            }
        } catch (err) {
            setError(err.message || "Register failed");
        } finally {
            setLoading(false);
        }
    }
    const loginEmail = async (email, password) => {
        setLoading(true);
        setError(null);
        try {
            const res = await loginWithEmail(email, password);
            if (res.success) {
                setUser(res.user);
                localStorage.setItem("user", JSON.stringify(res.user));
                localStorage.setItem("accessToken", res.accessToken);
            } else {
                setError(res.message || "Login failed");
            }
        } catch (err) {
            setError(err.message || "Login failed");
        } finally {
            setLoading(false);
        }
    }

    const logoutUser = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await logout();
            if (res.success) {
                setUser(null);
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
            } else {
                setError(res.message || "Logout failed");
            }
        } catch (err) {
            setError(err.message || "Logout failed");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const res = await getCurrentUser();
                if (res && res.success && res.user) {
                    setUser(res.user);
                    localStorage.setItem("user", JSON.stringify(res.user));
                } else if (res && res.user) {
                    // Handle case where API returns user but not success flag
                    setUser(res.user);
                    localStorage.setItem("user", JSON.stringify(res.user));
                }
            } catch (err) {
                console.error("Error fetching current user:", err);
                // Clear user if token is invalid
                setUser(null);
                localStorage.removeItem("user");
                localStorage.removeItem("accessToken");
            } finally {
                setLoading(false);
            }
        }
        fetchCurrentUser();
    }, [])

    const value = {
        user,
        loading,
        error,
        registerEmail,
        loginGoogle,
        loginEmail,
        logoutUser
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}