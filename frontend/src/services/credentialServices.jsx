const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
};

const base = (orgId, wsId) =>
    `${API_URL}/api/organizations/${orgId}/workspaces/${wsId}/credentials`;

export const createCredential = async (orgId, wsId, data) => {
    const res = await fetch(base(orgId, wsId), {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const createBatchCredentials = async (orgId, wsId, data) => {
    const res = await fetch(`${base(orgId, wsId)}/batch`, {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};

export const listCredentials = async (orgId, wsId, page = 1, limit = 10, status, recipientEmail) => {
    const params = new URLSearchParams({ page, limit });
    if (status) params.append("status", status);
    if (recipientEmail) params.append("recipientEmail", recipientEmail);
    const res = await fetch(`${base(orgId, wsId)}?${params}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const getCredential = async (orgId, wsId, id) => {
    const res = await fetch(`${base(orgId, wsId)}/${id}`, {
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const issueCredential = async (orgId, wsId, id) => {
    const res = await fetch(`${base(orgId, wsId)}/${id}/issue`, {
        method: "PATCH",
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const revokeCredential = async (orgId, wsId, id) => {
    const res = await fetch(`${base(orgId, wsId)}/${id}/revoke`, {
        method: "PATCH",
        credentials: "include",
        headers: { ...getAuthHeader() },
    });
    return res.json();
};

export const bulkIssueCredentials = async (orgId, wsId, credentialIds) => {
    const res = await fetch(`${base(orgId, wsId)}/issue-batch`, {
        method: "POST",
        credentials: "include",
        headers: { ...getAuthHeader(), "Content-Type": "application/json" },
        body: JSON.stringify({ credentialIds }),
    });
    return res.json();
};
