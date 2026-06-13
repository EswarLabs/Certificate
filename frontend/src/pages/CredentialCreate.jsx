import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createCredential } from "../services/credentialServices";
import { listTemplates } from "../services/templateServices";
import { ArrowLeft } from "lucide-react";

export default function CredentialCreate() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [form, setForm] = useState({
    templateId: "",
    recipientEmail: "",
    recipientName: "",
    expiresAt: "",
  });
  const [credentialData, setCredentialData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTemplates = async () => {
      if (!selectedOrg?.id || !selectedWorkspace?.id) return;
      try {
        const res = await listTemplates(selectedOrg.id, selectedWorkspace.id, 1, 100);
        if (res.success) setTemplates(res.templates || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchTemplates();
  }, [selectedOrg?.id, selectedWorkspace?.id]);

  const handleTemplateChange = (templateId) => {
    setForm({ ...form, templateId });
    const tmpl = templates.find((t) => t.id === templateId);
    setSelectedTemplate(tmpl || null);
    // Reset credential data fields
    if (tmpl?.schemaDefinition) {
      const initial = {};
      tmpl.schemaDefinition.forEach((s) => { initial[s.key] = ""; });
      setCredentialData(initial);
    } else {
      setCredentialData({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...form,
        expiresAt: form.expiresAt || null,
        credentialData,
      };
      const res = await createCredential(selectedOrg.id, selectedWorkspace.id, data);
      if (res.id) {
        navigate(`/credentials/${res.id}`);
      } else {
        setError(res.message || "Failed to create credential");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--text-secondary)" }}>Please select an organization and workspace first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/credentials" style={{ textDecoration: "none" }}>
            <button className="btn-icon">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <h1 className="page-title">Issue New Credential</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", gap: "32px", maxWidth: "1200px" }}>
        <div className="card">
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {error && <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "6px", fontSize: "13px", fontWeight: 500 }}>{error}</div>}

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Template <span style={{ color: "var(--danger)" }}>*</span></label>
              <select className="input" value={form.templateId} onChange={(e) => handleTemplateChange(e.target.value)} required>
                <option value="">Select a template</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Recipient Name <span style={{ color: "var(--danger)" }}>*</span></label>
              <input className="input" type="text" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Recipient Email <span style={{ color: "var(--danger)" }}>*</span></label>
              <input className="input" type="email" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} required />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Expires At (optional)</label>
              <input className="input" type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} />
            </div>

            {/* Dynamic fields from template schema */}
            {selectedTemplate?.schemaDefinition?.length > 0 && (
              <div style={{ marginTop: "16px", paddingTop: "24px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "24px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: 600, margin: 0 }}>Template Variables</h3>
                {selectedTemplate.schemaDefinition.map((s) => (
                  <div key={s.key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                      {s.label || s.key} {s.required && <span style={{ color: "var(--danger)" }}>*</span>}
                    </label>
                    <input
                      className="input"
                      type={s.type === "number" ? "number" : s.type === "date" ? "date" : "text"}
                      value={credentialData[s.key] || ""}
                      onChange={(e) => setCredentialData({ ...credentialData, [s.key]: e.target.value })}
                      required={s.required}
                    />
                  </div>
                ))}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: "16px", alignSelf: "flex-start" }}>
              {loading ? "Creating..." : "Issue Credential"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
