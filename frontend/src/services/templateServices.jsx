const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const base = (orgId, wsId) =>
    `${API_URL}/api/organizations/${orgId}/workspaces/${wsId}/templates`;

export const createTemplate = async (orgId, wsId, data) => {
    const res = await fetch(base(orgId, wsId), {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const listTemplates = async (orgId, wsId, page = 1, limit = 10) => {
    const res = await fetch(`${base(orgId, wsId)}?page=${page}&limit=${limit}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const listMyTemplates = async (orgId, wsId, page = 1, limit = 10) => {
    const res = await fetch(`${base(orgId, wsId)}/my-templates?page=${page}&limit=${limit}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const getTemplate = async (orgId, wsId, id) => {
    const res = await fetch(`${base(orgId, wsId)}/${id}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const updateTemplate = async (orgId, wsId, id, data) => {
    const res = await fetch(`${base(orgId, wsId)}/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const deleteTemplate = async (orgId, wsId, id) => {
    const res = await fetch(`${base(orgId, wsId)}/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    if (res.status === 204) return { success: true };
    return res.json();
};
