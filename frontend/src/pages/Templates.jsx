import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listTemplates, deleteTemplate } from "../services/templateServices";
import { Plus, Trash2, FileText, Pencil } from "lucide-react";
import toast from "react-hot-toast";

export default function Templates() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [templates, setTemplates] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const limit = 12;

  const fetchTemplates = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    try {
      const res = await listTemplates(selectedOrg.id, selectedWorkspace.id, page, limit);
      if (res.success) { setTemplates(res.templates || []); setTotal(res.total || 0); }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchTemplates(); }, [selectedOrg?.id, selectedWorkspace?.id, page]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this template?")) return;
    try {
      await deleteTemplate(selectedOrg.id, selectedWorkspace.id, id);
      toast.success("Template deleted");
      fetchTemplates();
    } catch (err) { toast.error(err.message); }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container">
        <div className="empty-state card"><FileText size={36} /><h3>No workspace selected</h3><p>Select an org and workspace to view templates.</p></div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Templates</h1>
          <p className="page-subtitle">{total} total · {selectedWorkspace.name}</p>
        </div>
        <Link to="/templates/create" className="btn btn-primary">
          <Plus size={14} /> New Template
        </Link>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><span className="spinner" /></div>
      ) : templates.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <FileText size={40} />
            <h3>No templates yet</h3>
            <p>Create a certificate template to get started.</p>
            <Link to="/templates/create" className="btn btn-primary" style={{ marginTop: 8 }}>
              <Plus size={14} /> Create Template
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {templates.map(t => (
            <div key={t.id} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Thumbnail */}
              <div style={{ aspectRatio: "4/3", background: "var(--bg-secondary)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)", overflow: "hidden" }}>
                {t.thumbnail ? (
                  <img src={t.thumbnail} alt={t.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <FileText size={32} style={{ color: "var(--text-muted)" }} />
                )}
              </div>
              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{t.name}</div>
                {t.description && <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 6 }}>{t.description}</div>}
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <span className="badge badge-neutral">{t.orientation || "landscape"}</span>
                  <span style={{ fontSize: 11, color: "var(--text-tertiary)", alignSelf: "center" }}>
                    {new Date(t.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <Link to={`/templates/${t.id}`} className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: "center" }}>
                  <Pencil size={12} /> Edit
                </Link>
                <button onClick={() => handleDelete(t.id)} className="btn-icon" style={{ color: "var(--danger)" }}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {total > limit && (
        <div style={{ display: "flex", justifyContent: "center", gap: 12, marginTop: 24 }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
          <span style={{ fontSize: 13, color: "var(--text-secondary)", alignSelf: "center" }}>Page {page} of {Math.ceil(total / limit)}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
