const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const sendVerificationEmail = async (credentialId) => {
    const res = await fetch(`${API_URL}/api/email/send-verification`, {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ credentialId }),
    });
    return res.json();
};

export const listEmailLogs = async (orgId, wsId, page = 1, limit = 10) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${orgId}/workspaces/${wsId}/emails?page=${page}&limit=${limit}`,
        {
            credentials: "include",
            headers: { ...getAuthHeader() },
        }
    );
    return res.json();
};
