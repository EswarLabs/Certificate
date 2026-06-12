import { useState, useEffect } from "react";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listEmailLogs } from "../services/emailServices";

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

  const statusColor = (status) => {
    switch (status) {
      case "sent": return "#22c55e";
      case "bounced": return "#ef4444";
      case "pending": return "#f59e0b";
      default: return "#6b7280";
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return <div><p>Please select an organization and workspace first.</p></div>;
  }

  return (
    <div>
      <h1>Email Logs</h1>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Recipient</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Verification Code</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Status</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Opened</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Clicked</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Bounce Reason</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Sent At</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "8px" }}>{log.credential?.recipientName || log.credentialId}</td>
              <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "0.8rem" }}>{log.credential?.verificationCode || "—"}</td>
              <td style={{ padding: "8px" }}>
                <span style={{ color: "#fff", backgroundColor: statusColor(log.status), padding: "2px 8px", borderRadius: "9999px", fontSize: "0.8rem" }}>
                  {log.status}
                </span>
              </td>
              <td style={{ padding: "8px" }}>{log.openedAt ? new Date(log.openedAt).toLocaleString() : "—"}</td>
              <td style={{ padding: "8px" }}>{log.clickedAt ? new Date(log.clickedAt).toLocaleString() : "—"}</td>
              <td style={{ padding: "8px", color: "#ef4444" }}>{log.bounceReason || "—"}</td>
              <td style={{ padding: "8px" }}>{new Date(log.createdAt).toLocaleString()}</td>
            </tr>
          ))}
          {logs.length === 0 && !loading && (
            <tr>
              <td colSpan={7} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                No email logs found.
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
