import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listTemplates, deleteTemplate } from "../services/templateServices";

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
    if (!confirm("Delete this template?")) return;
    try {
      await deleteTemplate(selectedOrg.id, selectedWorkspace.id, id);
      fetchTemplates();
    } catch (err) {
      alert(err.message);
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return <div><p>Please select an organization and workspace first.</p></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Templates</h1>
        <Link to="/templates/create">
          <button>+ New Template</button>
        </Link>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Name</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Orientation</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Created</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "8px" }}>
                <Link to={`/templates/${t.id}`}>{t.name}</Link>
                {t.description && <p style={{ fontSize: "0.85rem", color: "#6b7280", margin: 0 }}>{t.description}</p>}
              </td>
              <td style={{ padding: "8px" }}>{t.orientation}</td>
              <td style={{ padding: "8px" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: "8px" }}>
                <button onClick={() => handleDelete(t.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {templates.length === 0 && !loading && (
            <tr>
              <td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                No templates yet. Create your first one.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Pagination */}
      {total > limit && (
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <button disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
