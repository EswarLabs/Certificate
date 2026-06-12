const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const listUsers = async (email, name, page = 1, limit = 10) => {
    const params = new URLSearchParams({ page, limit });
    if (email) params.append("email", email);
    if (name) params.append("name", name);
    const res = await fetch(`${API_URL}/api/users?${params}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const getUserById = async (id) => {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const updateUser = async (id, data) => {
    const res = await fetch(`${API_URL}/api/users/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};
