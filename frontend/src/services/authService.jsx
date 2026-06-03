
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { "Authorization": `Bearer ${token}` } : {};
};

export const loginWithGoogle = async (credential) => {
    const res = await fetch(`${API_URL}/api/auth/google`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({credential})
    })
    return res.json();
}

export const logout = async () => {
    const res = await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
    });
    return res.json();
}

export const getCurrentUser = async () => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
        method: "GET",
        credentials: "include",
        headers: {
            ...getAuthHeader(),
        },
    });
    return res.json();
}