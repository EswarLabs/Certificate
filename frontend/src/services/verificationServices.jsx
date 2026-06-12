const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Public — no auth required
export const verifyCredential = async (verificationCode) => {
    const res = await fetch(`${API_URL}/api/verify/${verificationCode}`);
    return res.json();
};

// Public — track credential events
export const trackEvent = async (credentialId, data) => {
    const res = await fetch(`${API_URL}/api/credentials/${credentialId}/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    return res.json();
};
