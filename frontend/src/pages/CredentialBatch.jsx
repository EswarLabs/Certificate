import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createBatchCredentials } from "../services/credentialServices";
import { listTemplates } from "../services/templateServices";
import { listFiles } from "../services/fileServices";
import { ArrowLeft, Upload, CheckCircle, FileText, Settings2 } from "lucide-react";
import toast from "react-hot-toast";

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
        const tmplRes = await listTemplates(selectedOrg.id, selectedWorkspace.id, 1, 100);
        const fileRes = await listFiles(selectedOrg.id, selectedWorkspace.id, 1, 100);
        setTemplates(tmplRes.templates || []);
        // Only allow CSV files for batch import
        setFiles((fileRes.files || []).filter(f => f.mimeType === 'text/csv' || f.fileName.endsWith('.csv')));
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
        toast.success("Batch job created successfully");
      } else {
        const errMsg = res.message || "Batch creation failed";
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
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
          <div>
            <h1 className="page-title">Batch Credential Import</h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>
              Upload a CSV file first via the Files page, then map columns to template fields.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "32px", maxWidth: "1200px" }}>
        {jobResult ? (
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", textAlign: "center", padding: "48px 24px" }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "var(--success-light)", color: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "8px" }}>
              <CheckCircle size={24} />
            </div>
            <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Batch Job Started</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "center", width: "100%", maxWidth: "300px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Job ID:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{jobResult.id}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Status:</span>
                <span style={{ color: "var(--warning)", fontWeight: 500 }}>{jobResult.status}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", fontSize: "13px" }}>
                <span style={{ color: "var(--text-secondary)" }}>Progress:</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{jobResult.progress}%</span>
              </div>
            </div>
            <button onClick={() => navigate("/jobs")} className="btn btn-primary" style={{ marginTop: "16px" }}>
              View Jobs
            </button>
          </div>
        ) : (
          <div className="card">
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              {error && <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px", borderRadius: "6px", fontSize: "13px", fontWeight: 500 }}>{error}</div>}

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <FileText size={14} /> Template <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select className="input" value={form.templateId} onChange={(e) => handleTemplateChange(e.target.value)} required>
                  <option value="">Select a template</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Upload size={14} /> CSV File <span style={{ color: "var(--danger)" }}>*</span>
                </label>
                <select className="input" value={form.fileId} onChange={(e) => setForm({ ...form, fileId: e.target.value })} required>
                  <option value="">Select an uploaded file</option>
                  {files.map((f) => (
                    <option key={f.id} value={f.id}>{f.fileName} ({(f.fileSize / 1024).toFixed(1)} KB)</option>
                  ))}
                </select>
                {files.length === 0 && (
                  <span style={{ fontSize: "12px", color: "var(--warning)", marginTop: "4px" }}>
                    No files found. Please upload a CSV file in the Files page first.
                  </span>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                    Recipient Name Column <span style={{ color: "var(--danger)" }}>*</span>
                  </label>
                  <input className="input" type="text" value={form.recipientNameColumn} onChange={(e) => setForm({ ...form, recipientNameColumn: e.target.value })} required placeholder="e.g. name" />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                    Recipient Email Column (Optional)
                  </label>
                  <input className="input" type="text" value={form.recipientEmailColumn} onChange={(e) => setForm({ ...form, recipientEmailColumn: e.target.value })} placeholder="e.g. email" />
                </div>
              </div>

              {/* Data Mapping */}
              {selectedTemplate?.schemaDefinition?.length > 0 && (
                <div style={{ marginTop: "8px", paddingTop: "24px", borderTop: "1px solid var(--border-color)", display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div>
                    <h3 style={{ fontSize: "14px", fontWeight: 600, margin: "0 0 4px 0", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Settings2 size={16} /> Data Mapping
                    </h3>
                    <p style={{ fontSize: "12px", color: "var(--text-tertiary)", margin: 0 }}>Map template fields to CSV column names</p>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {selectedTemplate.schemaDefinition.map((s) => (
                      <div key={s.key} style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "150px", fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>
                          {s.label || s.key}
                        </div>
                        <div style={{ color: "var(--text-tertiary)" }}>→</div>
                        <input
                          className="input"
                          type="text"
                          value={dataMapping[s.key] || ""}
                          onChange={(e) => setDataMapping({ ...dataMapping, [s.key]: e.target.value })}
                          placeholder={`CSV column for ${s.key}`}
                          style={{ flex: 1 }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} className="btn btn-primary" style={{ marginTop: "16px", alignSelf: "flex-start" }}>
                {loading ? "Processing..." : "Start Batch Import"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
