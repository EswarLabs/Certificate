import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { getCredential, issueCredential, revokeCredential } from "../services/credentialServices";
import { sendVerificationEmail } from "../services/emailServices";

export default function CredentialDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCredential = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    try {
      const res = await getCredential(selectedOrg.id, selectedWorkspace.id, id);
      if (res.id) {
        setCredential(res);
      } else {
        setError(res.message || "Credential not found");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCredential();
  }, [selectedOrg?.id, selectedWorkspace?.id, id]);

  const handleIssue = async () => {
    setActionLoading(true);
    try {
      const res = await issueCredential(selectedOrg.id, selectedWorkspace.id, id);
      if (res.id) setCredential(res);
      else alert(res.message || "Issue failed");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!confirm("Revoke this credential?")) return;
    setActionLoading(true);
    try {
      const res = await revokeCredential(selectedOrg.id, selectedWorkspace.id, id);
      if (res.id) setCredential(res);
      else alert(res.message || "Revoke failed");
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setActionLoading(true);
    try {
      const res = await sendVerificationEmail(id);
      if (res.success) {
        alert("Verification email sent!");
        fetchCredential(); // Refresh to get updated email logs
      } else {
        alert(res.message || "Failed to send email");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
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

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!credential) return <p>Credential not found</p>;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Credential Detail</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          {credential.status === "draft" && (
            <button onClick={handleIssue} disabled={actionLoading}>Issue</button>
          )}
          {credential.status === "issued" && (
            <>
              <button onClick={handleSendEmail} disabled={actionLoading}>Send Email</button>
              <button onClick={handleRevoke} disabled={actionLoading} style={{ color: "red" }}>Revoke</button>
            </>
          )}
          <button onClick={() => navigate("/credentials")}>Back to List</button>
        </div>
      </div>

      {/* Status Badge */}
      <span style={{
        color: "#fff",
        backgroundColor: statusColor(credential.status),
        padding: "4px 12px",
        borderRadius: "9999px",
        fontSize: "0.85rem",
        fontWeight: "600",
      }}>
        {credential.status}
      </span>

      {/* Credential Info */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "16px" }}>
        <tbody>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>ID</td><td style={{ padding: "6px" }}>{credential.id}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Recipient</td><td style={{ padding: "6px" }}>{credential.recipientName}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Email</td><td style={{ padding: "6px" }}>{credential.recipientEmail}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Verification Code</td><td style={{ padding: "6px", fontFamily: "monospace" }}>{credential.verificationCode}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Template</td><td style={{ padding: "6px" }}>{credential.template?.name || credential.templateId}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Organization</td><td style={{ padding: "6px" }}>{credential.organizationId}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Workspace</td><td style={{ padding: "6px" }}>{credential.workspaceId}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Expires At</td><td style={{ padding: "6px" }}>{credential.expiresAt ? new Date(credential.expiresAt).toLocaleString() : "Never"}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Issued At</td><td style={{ padding: "6px" }}>{credential.issuedAt ? new Date(credential.issuedAt).toLocaleString() : "—"}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Created At</td><td style={{ padding: "6px" }}>{new Date(credential.createdAt).toLocaleString()}</td></tr>
          <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Updated At</td><td style={{ padding: "6px" }}>{new Date(credential.updatedAt).toLocaleString()}</td></tr>
        </tbody>
      </table>

      {/* Created By */}
      {credential.createdBy && (
        <div style={{ marginTop: "16px" }}>
          <h3>Created By</h3>
          <p>{credential.createdBy.firstName} {credential.createdBy.lastName} ({credential.createdBy.email})</p>
        </div>
      )}

      {/* Credential Data */}
      {credential.credentialData && Object.keys(credential.credentialData).length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h3>Credential Data</h3>
          <table style={{ borderCollapse: "collapse" }}>
            <tbody>
              {Object.entries(credential.credentialData).map(([key, val]) => (
                <tr key={key}>
                  <td style={{ padding: "4px 12px 4px 0", fontWeight: "bold" }}>{key}</td>
                  <td style={{ padding: "4px" }}>{String(val)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Events */}
      {credential.events && credential.events.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h3>Events</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #e5e7eb" }}>Type</th>
                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #e5e7eb" }}>IP Address</th>
                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #e5e7eb" }}>User Agent</th>
                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #e5e7eb" }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {credential.events.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ padding: "6px" }}>{ev.eventType}</td>
                  <td style={{ padding: "6px" }}>{ev.ipAddress || "—"}</td>
                  <td style={{ padding: "6px", fontSize: "0.8rem", maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.userAgent || "—"}</td>
                  <td style={{ padding: "6px" }}>{new Date(ev.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Email Logs */}
      {credential.emailLogs && credential.emailLogs.length > 0 && (
        <div style={{ marginTop: "16px" }}>
          <h3>Email Logs</h3>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #e5e7eb" }}>Status</th>
                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #e5e7eb" }}>Opened At</th>
                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #e5e7eb" }}>Clicked At</th>
                <th style={{ textAlign: "left", padding: "6px", borderBottom: "1px solid #e5e7eb" }}>Sent At</th>
              </tr>
            </thead>
            <tbody>
              {credential.emailLogs.map((log) => (
                <tr key={log.id}>
                  <td style={{ padding: "6px" }}>{log.status}</td>
                  <td style={{ padding: "6px" }}>{log.openedAt ? new Date(log.openedAt).toLocaleString() : "—"}</td>
                  <td style={{ padding: "6px" }}>{log.clickedAt ? new Date(log.clickedAt).toLocaleString() : "—"}</td>
                  <td style={{ padding: "6px" }}>{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
