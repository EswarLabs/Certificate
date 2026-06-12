const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const base = (orgId, wsId) =>
    `${API_URL}/api/organizations/${orgId}/workspaces/${wsId}/files`;

export const listFiles = async (orgId, wsId, page = 1, limit = 10) => {
    const res = await fetch(`${base(orgId, wsId)}?page=${page}&limit=${limit}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const getFile = async (orgId, wsId, fileId) => {
    const res = await fetch(`${base(orgId, wsId)}/${fileId}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const deleteFile = async (orgId, wsId, fileId) => {
    const res = await fetch(`${base(orgId, wsId)}/${fileId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};
