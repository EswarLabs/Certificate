const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { "Authorization": `Bearer ${token}` } : {};
}

export const createOrg = async (org_name) => {
    const res = await fetch(`${API_URL}/api/organizations`, {
        method: "POST",
        credentials: "include",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: org_name })
    });
    return res.json();
}

export const getOrg = async (orgId) => {
    const res = await fetch(`${API_URL}/api/organizations/${orgId}`, {
        method: "GET",
        credentials: "include",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
    });
    return res.json();
}

export const listOrg = async (page, limit) => {
    const res = await fetch(`${API_URL}/api/organizations?page=${page}&limit=${limit}`, {
        method: "GET",
        credentials: "include",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
    });
    return res.json();
}

export const updateOrg = async (orgId, orgname, orgLogoUrl) => {
    const res = await fetch(`${API_URL}/api/organizations/${orgId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: orgname, logoUrl: orgLogoUrl })
    });
    return res.json();
}

export const deleteOrg = async (orgId) => {
    const res = await fetch(`${API_URL}/api/organizations/${orgId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
    });
    return res.json();
}