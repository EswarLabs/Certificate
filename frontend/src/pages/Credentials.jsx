import { useState, useEffect } from "react";
import useSWR from "swr";
import { Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listCredentials, bulkIssueCredentials } from "../services/credentialServices";
import { Plus, Upload, Play, Inbox, Search } from "lucide-react";
import toast from "react-hot-toast";
import SmtpModal from "../components/ui/SmtpModal";

const STATUS_BADGE = {
  ISSUED:  "badge badge-success",
  DRAFT:   "badge badge-warning",
  REVOKED: "badge badge-danger",
};

export default function Credentials() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [emailFilter, setEmailFilter]   = useState("");
  const [selected, setSelected]         = useState([]);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpErrorMsg, setSmtpErrorMsg]   = useState("");
  const limit = 15;

  const { data, isLoading, mutate } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id
      ? ['credentials', selectedOrg.id, selectedWorkspace.id, page, statusFilter, emailFilter]
      : null,
    ([_, orgId, wsId, p, status, email]) => listCredentials(
      orgId, wsId, p, limit,
      status || undefined, email || undefined
    ),
    {
      refreshInterval: (data) => {
        if (!data) return 0;
        const isProcessing = data.credentials.some(c => c.status === "ISSUED" && !c.imageUrl);
        return isProcessing ? 3000 : 0;
      }
    }
  );

  const credentials = data?.credentials || [];
  const total = data?.total || 0;
  const loading = isLoading && !data;

  const fetchCredentials = () => { mutate(); };

  useEffect(() => {
    setSelected([]);
  }, [selectedOrg?.id, selectedWorkspace?.id, page, statusFilter, emailFilter]);

  const toggleSelect = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const toggleAll = () => {
    const draftIds = credentials.filter(c => c.status === "DRAFT").map(c => c.id);
    setSelected(selected.length === draftIds.length ? [] : draftIds);
  };

  const handleBulkIssue = async () => {
    if (!selected.length) return;
    if (!selectedWorkspace?.smtpEnabled) {
      setSmtpErrorMsg("Your workspace email (Resend API) settings are not configured. Please configure them in Workspace Settings before issuing credentials.");
      setShowSmtpModal(true);
      return;
    }
    if (!window.confirm(`Issue ${selected.length} credential(s)?`)) return;
    try {
      const res = await bulkIssueCredentials(selectedOrg.id, selectedWorkspace.id, selected);
      if (res.success || res.job) {
        toast.success("Bulk issue job started!");
        setSelected([]);
        setTimeout(fetchCredentials, 1500);
      } else {
        toast.error(res.message || "Failed");
      }
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <Inbox size={40} />
          <h3>No workspace selected</h3>
          <p>Please select an organization and workspace first.</p>
        </div>
      </div>
    );
  }

  const draftCount = credentials.filter(c => c.status === "DRAFT").length;

  return (
    <div className="page-container">
      {/* SMTP Modal */}
      {showSmtpModal && (
        <SmtpModal
          message={smtpErrorMsg}
          onClose={() => setShowSmtpModal(false)}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Credentials</h1>
          <p className="page-subtitle">{total} total · {selectedWorkspace.name}</p>
        </div>
        <div className="btn-group">
          <Link to="/credentials/batch" className="btn btn-secondary">
            <Upload size={14} /> Batch Import
          </Link>
          <Link to="/credentials/create" className="btn btn-primary">
            <Plus size={14} /> New Credential
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ padding: "12px 14px", marginBottom: 16 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flex: "1 1 160px", minWidth: 0 }}>
            <Search size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
            <input
              className="input"
              style={{ border: "none", outline: "none", boxShadow: "none", padding: "4px 0", background: "transparent" }}
              placeholder="Filter by email..."
              value={emailFilter}
              onChange={e => { setEmailFilter(e.target.value); setPage(1); }}
            />
          </div>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {["", "DRAFT", "ISSUED", "REVOKED"].map(s => (
              <button
                key={s}
                className={`btn btn-sm ${statusFilter === s ? "btn-primary" : "btn-ghost"}`}
                onClick={() => { setStatusFilter(s); setPage(1); }}
              >
                {s || "All"}
              </button>
            ))}
          </div>
          {selected.length > 0 && (
            <button className="btn btn-success btn-sm" onClick={handleBulkIssue}>
              <Play size={13} /> Issue {selected.length} selected
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center" }}><span className="spinner" /></div>
        ) : credentials.length === 0 ? (
          <div className="empty-state">
            <Inbox size={36} />
            <h3>No credentials found</h3>
            <p>Try adjusting your filters or create a new credential.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: 40 }}>
                    <input
                      type="checkbox"
                      onChange={toggleAll}
                      checked={selected.length === draftCount && draftCount > 0}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th>Recipient</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Preview</th>
                  <th>Code</th>
                  <th>Issued</th>
                </tr>
              </thead>
              <tbody>
                {credentials.map(c => (
                  <tr key={c.id}>
                    <td>
                      {c.status === "DRAFT" && (
                        <input
                          type="checkbox"
                          checked={selected.includes(c.id)}
                          onChange={() => toggleSelect(c.id)}
                          style={{ cursor: "pointer" }}
                        />
                      )}
                    </td>
                    <td>
                      <Link to={`/credentials/${c.id}`} style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                        {c.recipientName}
                      </Link>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{c.recipientEmail || "—"}</div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{c.template?.name || c.templateId}</td>
                    <td>
                      <span className={STATUS_BADGE[c.status] || "badge badge-neutral"}>{c.status}</span>
                    </td>
                    <td>
                      {c.imageUrl ? (
                        <img src={c.imageUrl} alt="" style={{ width: 64, height: 40, objectFit: "cover", borderRadius: 4, border: "1px solid var(--border-color)" }} />
                      ) : (
                        <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Generating…</span>
                      )}
                    </td>
                    <td>
                      <code style={{ fontSize: 11, color: "var(--brand-primary)", fontFamily: "var(--font-mono)", background: "var(--brand-primary-light)", padding: "2px 6px", borderRadius: 4 }}>
                        {c.verificationCode}
                      </code>
                    </td>
                    <td style={{ fontSize: 12, color: "var(--text-tertiary)" }}>
                      {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {total > limit && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
          <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>Page {page} of {Math.ceil(total / limit)}</span>
          <button className="btn btn-secondary btn-sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
