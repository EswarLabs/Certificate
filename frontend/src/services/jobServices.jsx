const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const base = (orgId, wsId) =>
    `${API_URL}/api/organizations/${orgId}/workspaces/${wsId}/jobs`;

export const listJobs = async (orgId, wsId, page = 1, limit = 10, status, type) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append("status", status);
    if (type) params.append("type", type);
    const res = await fetch(`${base(orgId, wsId)}?${params}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const getJob = async (orgId, wsId, jobId) => {
    const res = await fetch(`${base(orgId, wsId)}/${jobId}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const getQueueStats = async (orgId, wsId) => {
    const res = await fetch(`${base(orgId, wsId)}/queue-stats`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};
