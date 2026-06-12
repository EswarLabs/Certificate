import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createBatchCredentials } from "../services/credentialServices";
import { listTemplates } from "../services/templateServices";
import { listFiles } from "../services/fileServices";

export default function CredentialBatch() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [templates, setTemplates] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const [form, setForm] = useState({
    templateId: "",
    fileId: "",
    recipientNameColumn: "",
    recipientEmailColumn: "",
  });
  const [dataMapping, setDataMapping] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [jobResult, setJobResult] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedOrg?.id || !selectedWorkspace?.id) return;
      try {
        const [tmplRes, fileRes] = await Promise.all([
          listTemplates(selectedOrg.id, selectedWorkspace.id, 1, 100),
          listFiles(selectedOrg.id, selectedWorkspace.id, 1, 100),
        ]);
        if (tmplRes.success) setTemplates(tmplRes.templates || []);
        if (fileRes.success) setFiles(fileRes.files || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [selectedOrg?.id, selectedWorkspace?.id]);

  const handleTemplateChange = (templateId) => {
    setForm({ ...form, templateId });
    const tmpl = templates.find((t) => t.id === templateId);
    setSelectedTemplate(tmpl || null);
    if (tmpl?.schemaDefinition) {
      const mapping = {};
      tmpl.schemaDefinition.forEach((s) => { mapping[s.key] = ""; });
      setDataMapping(mapping);
    } else {
      setDataMapping({});
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    setJobResult(null);
    try {
      const data = { ...form, dataMapping };
      const res = await createBatchCredentials(selectedOrg.id, selectedWorkspace.id, data);
      if (res.success && res.job) {
        setJobResult(res.job);
      } else {
        setError(res.message || "Batch creation failed");
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
      <h1>Batch Credential Import</h1>
      <p style={{ color: "#6b7280" }}>
        Upload a CSV file first via the Files page, then map columns to template fields.
      </p>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {jobResult ? (
        <div style={{ padding: "16px", border: "1px solid #22c55e", borderRadius: "8px", background: "#f0fdf4" }}>
          <h3>Batch Job Started</h3>
          <p><strong>Job ID:</strong> {jobResult.id}</p>
          <p><strong>Status:</strong> {jobResult.status}</p>
          <p><strong>Progress:</strong> {jobResult.progress}%</p>
          <button onClick={() => navigate("/jobs")} style={{ marginTop: "8px" }}>View Jobs</button>
        </div>
      ) : (
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
            CSV File *
            <select value={form.fileId} onChange={(e) => setForm({ ...form, fileId: e.target.value })} required style={{ display: "block", width: "100%" }}>
              <option value="">Select an uploaded file</option>
              {files.map((f) => (
                <option key={f.id} value={f.id}>{f.fileName} ({(f.fileSize / 1024).toFixed(1)} KB)</option>
              ))}
            </select>
          </label>

          <label>
            Recipient Name Column *
            <input type="text" value={form.recipientNameColumn} onChange={(e) => setForm({ ...form, recipientNameColumn: e.target.value })} required placeholder="e.g. name" style={{ display: "block", width: "100%" }} />
          </label>

          <label>
            Recipient Email Column *
            <input type="text" value={form.recipientEmailColumn} onChange={(e) => setForm({ ...form, recipientEmailColumn: e.target.value })} required placeholder="e.g. email" style={{ display: "block", width: "100%" }} />
          </label>

          {/* Data Mapping */}
          {selectedTemplate?.schemaDefinition?.length > 0 && (
            <div>
              <h3>Data Mapping</h3>
              <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>Map template fields to CSV column names</p>
              {selectedTemplate.schemaDefinition.map((s) => (
                <label key={s.key} style={{ display: "block", marginBottom: "8px" }}>
                  {s.label || s.key} → CSV Column
                  <input
                    type="text"
                    value={dataMapping[s.key] || ""}
                    onChange={(e) => setDataMapping({ ...dataMapping, [s.key]: e.target.value })}
                    placeholder={`CSV column for ${s.key}`}
                    style={{ display: "block", width: "100%" }}
                  />
                </label>
              ))}
            </div>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Processing..." : "Start Batch Import"}
          </button>
        </form>
      )}
    </div>
  );
}
