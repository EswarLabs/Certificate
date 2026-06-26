import { useState } from "react";
import useSWR from "swr";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listEmailLogs } from "../services/emailServices";
import { RefreshCw, Activity, Mail } from "lucide-react";

const StatusBadge = ({ status }) => {
  let color, bg;
  switch (status) {
    case "sent":    color = "var(--success)"; bg = "var(--success-light)"; break;
    case "bounced": color = "var(--danger)";  bg = "var(--danger-light)";  break;
    case "pending": color = "var(--warning)"; bg = "var(--warning-light)"; break;
    default:        color = "var(--text-secondary)"; bg = "var(--bg-hover)"; break;
  }
  return (
    <span style={{ backgroundColor: bg, color, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
      {status}
    </span>
  );
};

export default function EmailLogs() {
  const { selectedOrg }     = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [page, setPage]     = useState(1);
  const limit               = 10;

  const { data, isLoading, mutate, error: swrError } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id
      ? ["email-logs", selectedOrg.id, selectedWorkspace.id, page]
      : null,
    async ([_, orgId, wsId, p]) => {
      const res = await listEmailLogs(orgId, wsId, p, limit);
      if (!res.success) throw new Error(res.message || "Failed to fetch email logs");
      return res;
    }
  );

  const logs    = data?.logs  || [];
  const total   = data?.total || 0;
  const loading = isLoading && !data;
  const error   = swrError?.message || null;

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
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Email Logs</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Track credential delivery and verification status
          </p>
        </div>
        <button onClick={() => mutate()} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && (
          <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px 24px", fontSize: 13, fontWeight: 500, borderBottom: "1px solid var(--border-color)" }}>
            {error}
          </div>
        )}

        {/* ── Responsive table/cards ── */}
        <div className="table-responsive">
          {/* Desktop table */}
          <div className="table-wrap">
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
                    <td style={{ fontWeight: 500 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Mail size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                        <span>{log.credential?.recipientName || log.credentialId}</span>
                      </div>
                    </td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--brand-primary)" }}>
                      {log.credential?.verificationCode || "—"}
                    </td>
                    <td><StatusBadge status={log.status} /></td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {log.openedAt ? new Date(log.openedAt).toLocaleString() : "—"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {log.clickedAt ? new Date(log.clickedAt).toLocaleString() : "—"}
                    </td>
                    <td style={{ fontSize: 13, color: log.bounceReason ? "var(--danger)" : "var(--text-secondary)" }}>
                      {log.bounceReason || "—"}
                    </td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <Activity size={32} style={{ color: "var(--border-color)" }} />
                        <p>No email logs found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="table-card-list" style={{ padding: 12 }}>
            {logs.length === 0 && !loading ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                <Activity size={32} style={{ color: "var(--border-color)", margin: "0 auto 12px" }} />
                <p>No email logs found.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="table-card-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                      <Mail size={14} style={{ color: "var(--text-tertiary)", flexShrink: 0 }} />
                      <span style={{ fontWeight: 600, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {log.credential?.recipientName || log.credentialId}
                      </span>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>

                  {log.credential?.verificationCode && (
                    <div className="table-card-row">
                      <span className="table-card-label">Code</span>
                      <code style={{ fontSize: 11, color: "var(--brand-primary)", fontFamily: "var(--font-mono)", background: "var(--brand-primary-light)", padding: "2px 6px", borderRadius: 4 }}>
                        {log.credential.verificationCode}
                      </code>
                    </div>
                  )}
                  <div className="table-card-row">
                    <span className="table-card-label">Sent At</span>
                    <span className="table-card-value">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  {log.openedAt && (
                    <div className="table-card-row">
                      <span className="table-card-label">Opened</span>
                      <span className="table-card-value">{new Date(log.openedAt).toLocaleString()}</span>
                    </div>
                  )}
                  {log.bounceReason && (
                    <div className="table-card-row">
                      <span className="table-card-label">Bounce</span>
                      <span className="table-card-value" style={{ color: "var(--danger)" }}>{log.bounceReason}</span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <button className="btn btn-secondary btn-sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
