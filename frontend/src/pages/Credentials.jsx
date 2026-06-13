import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listCredentials, bulkIssueCredentials } from "../services/credentialServices";
import { Plus, Upload, Play, Inbox } from "lucide-react";

export default function Credentials() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [credentials, setCredentials] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 10;

  const fetchCredentials = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listCredentials(
        selectedOrg.id, selectedWorkspace.id, page, limit,
        statusFilter || undefined, emailFilter || undefined
      );
      if (res.success) {
        setCredentials(res.credentials || []);
        setTotal(res.total || 0);
      } else {
        setError(res.message || "Failed to fetch credentials");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredentials();
    setSelected([]);
  }, [selectedOrg?.id, selectedWorkspace?.id, page, statusFilter, emailFilter]);

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    const draftIds = credentials.filter((c) => c.status === "DRAFT" || c.status === "draft").map((c) => c.id);
    if (selected.length === draftIds.length) {
      setSelected([]);
    } else {
      setSelected(draftIds);
    }
  };

  const handleBulkIssue = async () => {
    if (selected.length === 0) return;
    if (!window.confirm(`Issue ${selected.length} credentials?`)) return;
    try {
      await bulkIssueCredentials(selectedOrg.id, selectedWorkspace.id, selected);
      setSelected([]);
      fetchCredentials();
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
        <h1 className="page-title">Credentials</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <Link to="/credentials/batch" style={{ textDecoration: "none" }}>
            <button className="btn btn-secondary">
              <Upload size={16} /> Batch Import
            </button>
          </Link>
          <Link to="/credentials/create" style={{ textDecoration: "none" }}>
            <button className="btn btn-primary">
              <Plus size={16} /> New Credential
            </button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "24px", alignItems: "center", flexWrap: "wrap" }}>
        <select 
          className="input" 
          style={{ width: "auto" }}
          value={statusFilter} 
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="REVOKED">Revoked</option>
        </select>
        <input
          className="input"
          style={{ width: "240px" }}
          placeholder="Filter by email..."
          value={emailFilter}
          onChange={(e) => { setEmailFilter(e.target.value); setPage(1); }}
        />
        {selected.length > 0 && (
          <button className="btn btn-primary" onClick={handleBulkIssue}>
            <Play size={16} /> Issue {selected.length} Selected
          </button>
        )}
      </div>

      {loading && <p style={{ color: "var(--text-secondary)", marginBottom: "16px" }}>Loading...</p>}
      {error && <p style={{ color: "var(--danger)", marginBottom: "16px" }}>{error}</p>}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
              <th style={{ padding: "12px 16px", width: "40px" }}>
                <input type="checkbox" onChange={toggleAll} checked={selected.length > 0 && selected.length === credentials.filter((c) => c.status === "DRAFT" || c.status === "draft").length} />
              </th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Recipient</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Email</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Template</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Status</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Verification Code</th>
              <th style={{ textAlign: "left", padding: "12px 16px", fontWeight: 500, color: "var(--text-secondary)" }}>Issued At</th>
            </tr>
          </thead>
          <tbody>
            {credentials.map((c, idx) => (
              <tr key={c.id} style={{ borderBottom: idx === credentials.length - 1 ? "none" : "1px solid var(--border-color)" }}>
                <td style={{ padding: "12px 16px" }}>
                  {(c.status === "DRAFT" || c.status === "draft") && (
                    <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                  )}
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <Link to={`/credentials/${c.id}`} style={{ fontWeight: 500, color: "var(--text-primary)" }}>{c.recipientName}</Link>
                </td>
                <td style={{ padding: "12px 16px" }}>{c.recipientEmail || "—"}</td>
                <td style={{ padding: "12px 16px" }}>{c.template?.name || c.templateId}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ 
                    padding: "2px 8px", 
                    borderRadius: "12px", 
                    fontSize: "11px", 
                    fontWeight: 500,
                    backgroundColor: (c.status === "ISSUED" || c.status === "issued") ? "var(--success-light)" : "var(--bg-hover)",
                    color: (c.status === "ISSUED" || c.status === "issued") ? "var(--success)" : "var(--text-secondary)"
                  }}>
                    {c.status}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{c.verificationCode}</td>
                <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>{c.issuedAt ? new Date(c.issuedAt).toLocaleString() : "—"}</td>
              </tr>
            ))}
            {credentials.length === 0 && !loading && (
              <tr>
                <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                  <Inbox size={32} style={{ margin: "0 auto 12px", color: "var(--text-tertiary)" }} />
                  <p>No credentials found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
