const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

export const uploadImage = async (file, workspaceId) => {
    const formData = new FormData();
    formData.append("file", file);
    if (workspaceId) formData.append("workspaceId", workspaceId);
    const res = await fetch(`${API_URL}/api/upload/image`, {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeader() },
        body: formData,
    });
    return res.json();
};

export const uploadFile = async (file, workspaceId) => {
    const formData = new FormData();
    formData.append("file", file);
    if (workspaceId) formData.append("workspaceId", workspaceId);
    const res = await fetch(`${API_URL}/api/upload/file`, {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeader() },
        body: formData,
    });
    return res.json();
};
