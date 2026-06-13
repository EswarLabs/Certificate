import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listTemplates, deleteTemplate } from "../services/templateServices";
import { Plus, Trash2, FileText } from "lucide-react";

export default function Templates() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 10;

  const fetchTemplates = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listTemplates(selectedOrg.id, selectedWorkspace.id, page, limit);
      if (res.success) {
        setTemplates(res.templates || []);
        setTotal(res.total || 0);
      } else {
        setError(res.message || "Failed to fetch templates");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, [selectedOrg?.id, selectedWorkspace?.id, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await deleteTemplate(selectedOrg.id, selectedWorkspace.id, id);
      fetchTemplates();
    } catch (err) {
      alert(err.message);
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
      <div className="page-header">
        <h1 className="page-title">Templates</h1>
        <Link to="/templates/create" style={{ textDecoration: "none" }}>
          <button className="btn btn-primary">
            <Plus size={16} /> New Template
          </button>
        </Link>
      </div>

      {loading && <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>Loading...</p>}
      {error && <p style={{ color: "var(--danger)", marginBottom: "16px" }}>{error}</p>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Name</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Orientation</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Created</th>
              <th style={{ textAlign: "right", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t, idx) => (
              <tr key={t.id} style={{ borderBottom: idx === templates.length - 1 ? "none" : "1px solid var(--border-color)" }}>
                <td style={{ padding: "12px 16px" }}>
                  <Link to={`/templates/${t.id}`} style={{ fontWeight: 500, color: "var(--text-primary)" }}>{t.name}</Link>
                  {t.description && <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>{t.description}</p>}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ padding: "2px 8px", backgroundColor: "var(--bg-hover)", borderRadius: "12px", fontSize: "11px", color: "var(--text-secondary)" }}>
                    {t.orientation}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={{ padding: "12px 16px", textAlign: "right" }}>
                  <button onClick={() => handleDelete(t.id)} className="btn-icon" style={{ color: "var(--danger)", marginLeft: "auto" }}>
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {templates.length === 0 && !loading && (
              <tr>
                <td colSpan={4} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                  <FileText size={32} style={{ margin: "0 auto 12px", color: "var(--text-tertiary)" }} />
                  <p>No templates yet. Create your first one.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > limit && (
        <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "24px", justifyContent: "flex-end" }}>
          <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Page {page} of {Math.ceil(total / limit)}</span>
          <button className="btn btn-secondary" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
