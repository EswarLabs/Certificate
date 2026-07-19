const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
    const token = localStorage.getItem("accessToken");
    return token ? { "Authorization": `Bearer ${token}` } : {};
};

// Create a new workspace under an organization
export const createWorkspace = async (organizationId, name) => {
    const res = await fetch(`${API_URL}/api/organizations/${organizationId}/workspaces`, {
        method: "POST",
        credentials: "include",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ name }),
    });
    return res.json();
};

// List workspaces for an organization
export const listWorkspaces = async (organizationId, page = 1, limit = 10) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${organizationId}/workspaces?page=${page}&limit=${limit}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
        }
    );
    return res.json();
};

// Get a single workspace by ID
export const getWorkspace = async (organizationId, workspaceId) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${organizationId}/workspaces/${workspaceId}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
        }
    );
    return res.json();
};

// Update a workspace
export const updateWorkspace = async (organizationId, workspaceId, data) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${organizationId}/workspaces/${workspaceId}`,
        {
            method: "PUT",
            credentials: "include",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        }
    );
    return res.json();
};

// Delete a workspace
export const deleteWorkspaceApi = async (organizationId, workspaceId) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${organizationId}/workspaces/${workspaceId}`,
        {
            method: "DELETE",
            credentials: "include",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
        }
    );
    // DELETE returns 204 No Content
    if (res.status === 204) return { success: true };
    return res.json();
};

// List members of a workspace
export const listMembers = async (organizationId, workspaceId, page = 1, limit = 10) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${organizationId}/workspaces/${workspaceId}/members?page=${page}&limit=${limit}`,
        {
            method: "GET",
            credentials: "include",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
        }
    );
    return res.json();
};

// Add a member to a workspace
export const addMember = async (organizationId, newUserId, workspaceId, role = "MEMBER") => {
    const res = await fetch(`${API_URL}/api/organizations/${organizationId}/workspaces/${workspaceId}/members`, {
        method: "POST",
        credentials: "include",
        headers: {
            ...getAuthHeader(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ newUserId, role }),
    });
    return res.json();
};

// Remove a member
export const removeMember = async (organizationId, workspaceId, memberId) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${organizationId}/workspaces/${workspaceId}/members/${memberId}`,
        {
            method: "DELETE",
            credentials: "include",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
        }
    );
    return res.json();
};

// Update a member's role
export const updateMemberRole = async (organizationId, workspaceId, memberId, role) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${organizationId}/workspaces/${workspaceId}/members/${memberId}`,
        {
            method: "PATCH",
            credentials: "include",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ role }),
        }
    );
    return res.json();
};

// Send a test email to verify SMTP/email provider settings
export const sendTestEmail = async (organizationId, workspaceId, { to, provider, apiKey, fromEmail }) => {
    const res = await fetch(
        `${API_URL}/api/organizations/${organizationId}/workspaces/${workspaceId}/test-email`,
        {
            method: "POST",
            credentials: "include",
            headers: {
                ...getAuthHeader(),
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ to, provider, apiKey, fromEmail }),
        }
    );
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to send test email");
    }
    return data;
};
