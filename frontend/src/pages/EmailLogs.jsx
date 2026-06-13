import { useState, useEffect } from "react";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listEmailLogs } from "../services/emailServices";
import { RefreshCw, Activity, Mail } from "lucide-react";

export default function EmailLogs() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 10;

  const fetchLogs = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listEmailLogs(selectedOrg.id, selectedWorkspace.id, page, limit);
      if (res.success) {
        setLogs(res.logs || []);
        setTotal(res.total || 0);
      } else {
        setError(res.message || "Failed to fetch email logs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [selectedOrg?.id, selectedWorkspace?.id, page]);

  const StatusBadge = ({ status }) => {
    let colorClass = "";
    let bgClass = "";
    switch (status) {
      case "sent": colorClass = "var(--success)"; bgClass = "var(--success-light)"; break;
      case "bounced": colorClass = "var(--danger)"; bgClass = "var(--danger-light)"; break;
      case "pending": colorClass = "var(--warning)"; bgClass = "var(--warning-light)"; break;
      default: colorClass = "var(--text-secondary)"; bgClass = "var(--bg-hover)"; break;
    }
    return (
      <span style={{ backgroundColor: bgClass, color: colorClass, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
        {status}
      </span>
    );
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
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">Email Logs</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>Track credential delivery and verification status</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={fetchLogs} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px 24px", fontSize: "13px", fontWeight: 500, borderBottom: "1px solid var(--border-color)" }}>{error}</div>}

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Recipient</th>
                <th>Verification Code</th>
                <th>Status</th>
                <th>Opened At</th>
                <th>Clicked At</th>
                <th>Bounce Reason</th>
                <th>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Mail size={14} style={{ color: "var(--text-tertiary)" }} />
                      <span>{log.credential?.recipientName || log.credentialId}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--brand-primary)" }}>{log.credential?.verificationCode || "—"}</td>
                  <td><StatusBadge status={log.status} /></td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{log.openedAt ? new Date(log.openedAt).toLocaleString() : "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{log.clickedAt ? new Date(log.clickedAt).toLocaleString() : "—"}</td>
                  <td style={{ color: log.bounceReason ? "var(--danger)" : "var(--text-secondary)", fontSize: "13px" }}>{log.bounceReason || "—"}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
              {logs.length === 0 && !loading && (
                <tr>
                  <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <Activity size={32} style={{ color: "var(--border-color)" }} />
                      <p>No email logs found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} logs</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn btn-secondary" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
