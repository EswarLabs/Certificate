import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createCredential } from "../services/credentialServices";
import { listTemplates } from "../services/templateServices";

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
    return <div><p>Please select an organization and workspace first.</p></div>;
  }

  return (
    <div>
      <h1>Create Credential</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "600px" }}>
        <label>
          Template *
          <select value={form.templateId} onChange={(e) => handleTemplateChange(e.target.value)} required style={{ display: "block", width: "100%" }}>
            <option value="">Select a template</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </label>

        <label>
          Recipient Name *
          <input type="text" value={form.recipientName} onChange={(e) => setForm({ ...form, recipientName: e.target.value })} required style={{ display: "block", width: "100%" }} />
        </label>

        <label>
          Recipient Email *
          <input type="email" value={form.recipientEmail} onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })} required style={{ display: "block", width: "100%" }} />
        </label>

        <label>
          Expires At (optional)
          <input type="datetime-local" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} style={{ display: "block", width: "100%" }} />
        </label>

        {/* Dynamic fields from template schema */}
        {selectedTemplate?.schemaDefinition?.map((s) => (
          <label key={s.key}>
            {s.label || s.key} {s.required && "*"}
            <input
              type={s.type === "number" ? "number" : s.type === "date" ? "date" : "text"}
              value={credentialData[s.key] || ""}
              onChange={(e) => setCredentialData({ ...credentialData, [s.key]: e.target.value })}
              required={s.required}
              style={{ display: "block", width: "100%" }}
            />
          </label>
        ))}

        <button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Credential"}
        </button>
      </form>
    </div>
  );
}
