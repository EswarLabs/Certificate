import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { getCredential, issueCredential, revokeCredential } from "../services/credentialServices";
import { sendVerificationEmail } from "../services/emailServices";
import { ArrowLeft, Mail, Ban, CheckCircle, Clock } from "lucide-react";
import toast from "react-hot-toast";

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
      if (res.id) {
        setCredential(res);
        toast.success("Credential issued successfully");
      } else {
        toast.error(res.message || "Issue failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!window.confirm("Revoke this credential?")) return;
    setActionLoading(true);
    try {
      const res = await revokeCredential(selectedOrg.id, selectedWorkspace.id, id);
      if (res.id) {
        setCredential(res);
        toast.success("Credential revoked");
      } else {
        toast.error(res.message || "Revoke failed");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendEmail = async () => {
    setActionLoading(true);
    try {
      const res = await sendVerificationEmail(id);
      if (res.success) {
        toast.success("Verification email sent!");
        fetchCredential(); // Refresh to get updated email logs
      } else {
        toast.error(res.message || "Failed to send email");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const StatusBadge = ({ status }) => {
    let colorClass = "";
    switch (status) {
      case "DRAFT": colorClass = "var(--warning)"; break;
      case "ISSUED": colorClass = "var(--success)"; break;
      case "REVOKED": colorClass = "var(--danger)"; break;
      default: colorClass = "var(--text-secondary)"; break;
    }
    
    let bgClass = "";
    switch (status) {
      case "DRAFT": bgClass = "var(--warning-light)"; break;
      case "ISSUED": bgClass = "var(--success-light)"; break;
      case "REVOKED": bgClass = "var(--danger-light)"; break;
      default: bgClass = "var(--bg-hover)"; break;
    }

    return (
      <span style={{
        backgroundColor: bgClass,
        color: colorClass,
        padding: "4px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
      }}>
        {status}
      </span>
    );
  };

  if (loading) return <div className="page-container" style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "40px" }}>Loading...</div>;
  if (error) return <div className="page-container" style={{ textAlign: "center", color: "var(--danger)", marginTop: "40px" }}>{error}</div>;
  if (!credential) return <div className="page-container" style={{ textAlign: "center", color: "var(--text-secondary)", marginTop: "40px" }}>Credential not found</div>;

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link to="/credentials" style={{ textDecoration: "none" }}>
            <button className="btn-icon">
              <ArrowLeft size={20} />
            </button>
          </Link>
          <div>
            <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              Credential Detail
              <StatusBadge status={credential.status} />
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>ID: {credential.id}</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          {credential.status === "DRAFT" && (
            <button onClick={handleIssue} disabled={actionLoading} className="btn btn-primary">
              <CheckCircle size={16} /> Issue
            </button>
          )}
          {credential.status === "ISSUED" && (
            <>
              <button onClick={handleSendEmail} disabled={actionLoading} className="btn btn-secondary">
                <Mail size={16} /> Send Email
              </button>
              <button onClick={handleRevoke} disabled={actionLoading} className="btn btn-secondary" style={{ color: "var(--danger)", borderColor: "var(--danger-light)" }}>
                <Ban size={16} /> Revoke
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          <div className="card">
            <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "8px" }}>
              General Information
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <InfoRow label="Recipient Name" value={credential.recipientName} />
              <InfoRow label="Recipient Email" value={credential.recipientEmail} />
              <InfoRow label="Verification Code" value={<code style={{ color: "var(--brand-primary)", fontFamily: "var(--font-mono)" }}>{credential.verificationCode}</code>} />
              <InfoRow label="Template" value={credential.template?.name || credential.templateId} />
              <InfoRow label="Expires At" value={credential.expiresAt ? new Date(credential.expiresAt).toLocaleString() : "Never"} />
              <InfoRow label="Issued At" value={credential.issuedAt ? new Date(credential.issuedAt).toLocaleString() : "—"} />
              <InfoRow label="Created At" value={new Date(credential.createdAt).toLocaleString()} />
            </div>
          </div>

          {credential.credentialData && Object.keys(credential.credentialData).length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", color: "var(--text-primary)" }}>Credential Data</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(credential.credentialData).map(([key, val]) => (
                  <InfoRow key={key} label={key} value={String(val)} />
                ))}
              </div>
            </div>
          )}

          {(credential.imageUrl || credential.pdfUrl) && (
            <div className="card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Certificate Preview</h3>
                {credential.pdfUrl && (
                  <a href={credential.pdfUrl} target="_blank" rel="noreferrer" style={{ fontSize: "13px", color: "var(--brand-primary)", textDecoration: "none", fontWeight: 500 }}>
                    Download PDF
                  </a>
                )}
              </div>
              {credential.imageUrl ? (
                <img src={credential.imageUrl} alt="Certificate" style={{ width: "100%", height: "auto", borderRadius: "6px", border: "1px solid var(--border-color)", display: "block" }} />
              ) : (
                <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px", backgroundColor: "var(--bg-secondary)", borderRadius: "6px" }}>
                  Generating image...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Email Logs */}
          <div className="card" style={{ padding: "0" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Email Logs</h3>
            </div>
            {(!credential.emailLogs || credential.emailLogs.length === 0) ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>No email logs found.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Status</th>
                    <th style={{ textAlign: "left", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Sent At</th>
                  </tr>
                </thead>
                <tbody>
                  {credential.emailLogs.map((log) => (
                    <tr key={log.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--text-primary)" }}>{log.status}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--text-secondary)" }}>{new Date(log.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Events */}
          <div className="card" style={{ padding: "0" }}>
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-color)" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: 0 }}>Event History</h3>
            </div>
            {(!credential.events || credential.events.length === 0) ? (
              <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>No events found.</div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Type</th>
                    <th style={{ textAlign: "left", padding: "12px 24px", borderBottom: "1px solid var(--border-color)", fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500 }}>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {credential.events.map((ev) => (
                    <tr key={ev.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--text-primary)" }}>{ev.eventType}</td>
                      <td style={{ padding: "16px 24px", fontSize: "13px", color: "var(--text-secondary)" }}>{new Date(ev.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", paddingBottom: "12px", borderBottom: "1px solid var(--border-color)", fontSize: "13px" }}>
      <span style={{ color: "var(--text-secondary)", fontWeight: 500, flexShrink: 0 }}>{label}</span>
      <span style={{ color: "var(--text-primary)", textAlign: "right" }}>{value}</span>
    </div>
  );
}
