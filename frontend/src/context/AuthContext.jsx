import { createContext, useState, useEffect } from "react";
import {loginWithGoogle, logout, getCurrentUser} from "../services/authService";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const login =  async (credential) => {
        setLoading(true);
        setError(null);
        try {
            const res = await loginWithGoogle(credential);
            if (res.success) {
                setUser(res.user);
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
                } else if (res && res.user) {
                    // Handle case where API returns user but not success flag
                    setUser(res.user);
                }
            } catch (err) {
                console.error("Error fetching current user:", err);
                // Silently fail - user will see login page
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
        login,
        logoutUser
    };
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}