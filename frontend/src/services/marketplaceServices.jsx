const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const getAuthHeader = () => {
  const token = localStorage.getItem("accessToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const base = `${API_URL}/api/v1/marketplace`;

export const listPublicTemplates = async (params = {}) => {
  const query = new URLSearchParams();
  if (params.page) query.append("page", params.page);
  if (params.limit) query.append("limit", params.limit);
  if (params.search) query.append("search", params.search);
  if (params.category) query.append("category", params.category);
  if (params.tag) query.append("tag", params.tag);
  if (params.industry && params.industry !== "All") query.append("industry", params.industry);
  if (params.sort) query.append("sort", params.sort);

  const res = await fetch(`${base}/templates?${query.toString()}`, {
    credentials: "include",
    headers: { ...getAuthHeader() },
  });
  return res.json();
};

export const getPublicTemplateById = async (id) => {
  const res = await fetch(`${base}/templates/${id}`, {
    credentials: "include",
    headers: { ...getAuthHeader() },
  });
  return res.json();
};

export const publishTemplate = async (data) => {
  const res = await fetch(`${base}/templates`, {
    method: "POST",
    credentials: "include",
    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const copyPublicTemplate = async (id, organizationId, workspaceId) => {
  const res = await fetch(`${base}/templates/${id}/copy`, {
    method: "POST",
    credentials: "include",
    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ organizationId, workspaceId }),
  });
  return res.json();
};

export const toggleLikeTemplate = async (id) => {
  const res = await fetch(`${base}/templates/${id}/like`, {
    method: "POST",
    credentials: "include",
    headers: { ...getAuthHeader() },
  });
  return res.json();
};

export const toggleFavoriteTemplate = async (id) => {
  const res = await fetch(`${base}/templates/${id}/favorite`, {
    method: "POST",
    credentials: "include",
    headers: { ...getAuthHeader() },
  });
  return res.json();
};

export const reportPublicTemplate = async (id, reason, details) => {
  const res = await fetch(`${base}/templates/${id}/report`, {
    method: "POST",
    credentials: "include",
    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({ reason, details }),
  });
  return res.json();
};

export const getCategories = async () => {
  const res = await fetch(`${base}/categories`, {
    credentials: "include",
    headers: { ...getAuthHeader() },
  });
  return res.json();
};

export const getTags = async () => {
  const res = await fetch(`${base}/tags`, {
    credentials: "include",
    headers: { ...getAuthHeader() },
  });
  return res.json();
};

export const getCreatorProfile = async () => {
  const res = await fetch(`${base}/profile`, {
    credentials: "include",
    headers: { ...getAuthHeader() },
  });
  return res.json();
};

export const updateCreatorProfile = async (data) => {
  const res = await fetch(`${base}/profile`, {
    method: "PUT",
    credentials: "include",
    headers: { ...getAuthHeader(), "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};
