import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listCredentials, bulkIssueCredentials } from "../services/credentialServices";

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
    const draftIds = credentials.filter((c) => c.status === "draft").map((c) => c.id);
    if (selected.length === draftIds.length) {
      setSelected([]);
    } else {
      setSelected(draftIds);
    }
  };

  const handleBulkIssue = async () => {
    if (selected.length === 0) return;
    if (!confirm(`Issue ${selected.length} credentials?`)) return;
    try {
      await bulkIssueCredentials(selectedOrg.id, selectedWorkspace.id, selected);
      setSelected([]);
      fetchCredentials();
    } catch (err) {
      alert(err.message);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "draft": return "#f59e0b";
      case "issued": return "#22c55e";
      case "revoked": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return <div><p>Please select an organization and workspace first.</p></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Credentials</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <Link to="/credentials/new"><button>+ New Credential</button></Link>
          <Link to="/credentials/batch"><button>Batch Import</button></Link>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", margin: "12px 0" }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="issued">Issued</option>
          <option value="revoked">Revoked</option>
        </select>
        <input
          placeholder="Filter by email..."
          value={emailFilter}
          onChange={(e) => { setEmailFilter(e.target.value); setPage(1); }}
        />
        {selected.length > 0 && (
          <button onClick={handleBulkIssue}>Issue {selected.length} Selected</button>
        )}
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ padding: "8px", borderBottom: "2px solid #e5e7eb" }}>
              <input type="checkbox" onChange={toggleAll} checked={selected.length > 0 && selected.length === credentials.filter((c) => c.status === "draft").length} />
            </th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Recipient</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Email</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Template</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Status</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Verification Code</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Issued At</th>
          </tr>
        </thead>
        <tbody>
          {credentials.map((c) => (
            <tr key={c.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "8px" }}>
                {c.status === "draft" && (
                  <input type="checkbox" checked={selected.includes(c.id)} onChange={() => toggleSelect(c.id)} />
                )}
              </td>
              <td style={{ padding: "8px" }}>
                <Link to={`/credentials/${c.id}`}>{c.recipientName}</Link>
              </td>
              <td style={{ padding: "8px" }}>{c.recipientEmail}</td>
              <td style={{ padding: "8px" }}>{c.template?.name || c.templateId}</td>
              <td style={{ padding: "8px" }}>
                <span style={{ color: "#fff", backgroundColor: statusColor(c.status), padding: "2px 8px", borderRadius: "9999px", fontSize: "0.8rem" }}>
                  {c.status}
                </span>
              </td>
              <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "0.8rem" }}>{c.verificationCode}</td>
              <td style={{ padding: "8px" }}>{c.issuedAt ? new Date(c.issuedAt).toLocaleString() : "—"}</td>
            </tr>
          ))}
          {credentials.length === 0 && !loading && (
            <tr>
              <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                No credentials found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

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
