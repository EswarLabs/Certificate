import { useState } from "react";
import useSWR from "swr";
import { useParams, Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { getCredential, issueCredential, revokeCredential } from "../services/credentialServices";
import { sendVerificationEmail } from "../services/emailServices";
import { ArrowLeft, Mail, Ban, CheckCircle, Download, ExternalLink, Clock } from "lucide-react";
import toast from "react-hot-toast";
import SmtpModal from "../components/ui/SmtpModal";

const STATUS_CLASS = { ISSUED: "badge-success", DRAFT: "badge-warning", REVOKED: "badge-danger" };

const isSmtpError = (msg = "", code = "") =>
  code === "SMTP_NOT_CONFIGURED" ||
  /smtp|email.*not.*configured|resend.*api|workspace.*email|api.*key.*missing/i.test(msg);

export default function CredentialDetail() {
  const { id } = useParams();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const [actionLoading, setAction]  = useState(false);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpErrorMsg, setSmtpErrorMsg]   = useState("");

  const { data: credential, isLoading, mutate: fetch, error: swrError } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id && id
      ? ['credential', selectedOrg.id, selectedWorkspace.id, id]
      : null,
    async ([_, orgId, wsId, credId]) => {
      const res = await getCredential(orgId, wsId, credId);
      if (!res.id) throw new Error(res.message || "Not found");
      return res;
    },
    {
      refreshInterval: (data) => {
        if (!data) return 0;
        // If image is missing but it's issued, poll for image.
        return (data.status === "ISSUED" && !data.imageUrl) ? 3000 : 0;
      }
    }
  );

  const loading = isLoading && !credential;
  const error = swrError?.message || null;

  const handleIssue = async () => {
    setAction(true);
    try {
      const res = await issueCredential(selectedOrg.id, selectedWorkspace.id, id);
      if (res.id) { fetch(); toast.success("Credential issued!"); }
      else toast.error(res.message || "Failed");
    } catch (err) { toast.error(err.message); }
    finally { setAction(false); }
  };

  const handleRevoke = async () => {
    if (!window.confirm("Revoke this credential?")) return;
    setAction(true);
    try {
      const res = await revokeCredential(selectedOrg.id, selectedWorkspace.id, id);
      if (res.id) { fetch(); toast.success("Credential revoked"); }
      else toast.error(res.message || "Failed");
    } catch (err) { toast.error(err.message); }
    finally { setAction(false); }
  };

  const handleSendEmail = async () => {
    // Guard: check frontend state first for fast feedback
    if (!selectedWorkspace?.smtpEnabled) {
      setSmtpErrorMsg("Your workspace email (Resend API) settings are not configured. Please enable and configure them in Workspace Settings before sending emails.");
      setShowSmtpModal(true);
      return;
    }
    setAction(true);
    try {
      const res = await sendVerificationEmail(id);
      if (res.success) { toast.success("Email sent!"); fetch(); }
      else {
        const msg = res.message || "Failed to send email";
        const code = res.code || "";
        if (isSmtpError(msg, code)) {
          setSmtpErrorMsg(msg);
          setShowSmtpModal(true);
        } else {
          toast.error(msg);
        }
      }
    } catch (err) {
      const msg = err.message || "Failed to send email";
      const code = err.code || "";
      if (isSmtpError(msg, code)) {
        setSmtpErrorMsg(msg);
        setShowSmtpModal(true);
      } else {
        toast.error(msg);
      }
    }
    finally { setAction(false); }
  };

  if (loading) return <div className="page-container" style={{ padding: 48, textAlign: "center" }}><span className="spinner" /></div>;
  if (error)   return <div className="page-container"><div className="alert alert-error">{error}</div></div>;
  if (!credential) return null;

  const statusClass = STATUS_CLASS[credential.status] || "badge-neutral";

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
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          <Link to="/credentials" className="btn-icon" style={{ flexShrink: 0 }}>
            <ArrowLeft size={16} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <h1 className="page-title" style={{ wordBreak: "break-word" }}>{credential.recipientName}</h1>
              <span className={`badge ${statusClass}`}>{credential.status}</span>
            </div>
            <p className="page-subtitle" style={{ wordBreak: "break-all", fontSize: 11 }}>ID: {credential.id}</p>
          </div>
        </div>
        <div className="btn-group">
          {credential.status === "DRAFT" && (
            <button onClick={handleIssue} disabled={actionLoading} className="btn btn-primary">
              <CheckCircle size={14} /> Issue
            </button>
          )}
          {credential.status === "ISSUED" && (
            <>
              <button onClick={handleSendEmail} disabled={actionLoading} className="btn btn-secondary">
                <Mail size={14} /> Send Email
              </button>
              <Link to={`/verify/${credential.verificationCode}`} target="_blank" className="btn btn-secondary">
                <ExternalLink size={14} /> Verify
              </Link>
              <button onClick={handleRevoke} disabled={actionLoading} className="btn btn-danger">
                <Ban size={14} /> Revoke
              </button>
            </>
          )}
        </div>
      </div>

      {/* Responsive two-column grid */}
      <div className="detail-grid">
        {/* Left — Certificate Preview */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Certificate image */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="card-header">
              <span className="card-title">Certificate</span>
              <div style={{ display: "flex", gap: 8 }}>
                {credential.pdfUrl && (
                  <a href={credential.pdfUrl} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                    <Download size={13} /> Download PDF
                  </a>
                )}
              </div>
            </div>
            <div style={{ padding: 20 }}>
              {credential.imageUrl ? (
                <img
                  src={credential.imageUrl}
                  alt="Certificate"
                  style={{ width: "100%", height: "auto", borderRadius: 8, border: "1px solid var(--border-color)", display: "block" }}
                />
              ) : (
                <div style={{ aspectRatio: "4/3", background: "var(--bg-secondary)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-tertiary)", fontSize: 13, border: "1px dashed var(--border-color)" }}>
                  <span className="spinner" style={{ marginRight: 8 }} /> Generating certificate image…
                </div>
              )}
            </div>
          </div>

          {/* Credential data */}
          {credential.credentialData && Object.keys(credential.credentialData).length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Credential Fields</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {Object.entries(credential.credentialData).map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--border-color)", fontSize: 13, gap: 8, flexWrap: "wrap" }}>
                    <span style={{ color: "var(--text-secondary)", fontWeight: 500, textTransform: "capitalize", flexShrink: 0 }}>{k}</span>
                    <span style={{ color: "var(--text-primary)", fontWeight: 400, textAlign: "right", wordBreak: "break-word", maxWidth: "60%" }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Meta */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* General Info */}
          <div className="card">
            <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Details</h3>
            {[
              ["Recipient", credential.recipientName],
              ["Email", credential.recipientEmail || "—"],
              ["Template", credential.template?.name || credential.templateId],
              ["Issued At", credential.issuedAt ? new Date(credential.issuedAt).toLocaleString() : "—"],
              ["Expires At", credential.expiresAt ? new Date(credential.expiresAt).toLocaleString() : "Never"],
              ["Created At", new Date(credential.createdAt).toLocaleString()],
            ].map(([label, val]) => (
              <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px solid var(--border-color)", fontSize: 12, gap: 8 }}>
                <span style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>{label}</span>
                <span style={{ color: "var(--text-primary)", textAlign: "right", fontWeight: 500, wordBreak: "break-all" }}>{val}</span>
              </div>
            ))}
            <div style={{ marginTop: 12 }}>
              <div className="label">Verification Code</div>
              <code style={{ fontSize: 11, fontFamily: "var(--font-mono)", background: "var(--brand-primary-light)", color: "var(--brand-primary)", padding: "4px 8px", borderRadius: 4, display: "block", wordBreak: "break-all" }}>
                {credential.verificationCode}
              </code>
            </div>
          </div>

          {/* Email Logs */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="card-header"><span className="card-title">Email Logs</span></div>
            {!credential.emailLogs?.length ? (
              <div style={{ padding: "20px 16px", fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>No emails sent</div>
            ) : (
              <div>
                {credential.emailLogs.map(log => (
                  <div key={log.id} style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12 }}>
                    <span className={`badge ${log.status === "SENT" || log.status === "OPENED" ? "badge-success" : log.status === "FAILED" ? "badge-danger" : "badge-neutral"}`}>{log.status}</span>
                    <span style={{ color: "var(--text-tertiary)" }}>{new Date(log.createdAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Events */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="card-header"><span className="card-title">Event History</span></div>
            {!credential.events?.length ? (
              <div style={{ padding: "20px 16px", fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>No events</div>
            ) : (
              <div>
                {credential.events.slice().reverse().map(ev => (
                  <div key={ev.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid var(--border-color)", fontSize: 12 }}>
                    <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{ev.eventType}</span>
                    <span style={{ color: "var(--text-tertiary)", display: "flex", gap: 4, alignItems: "center" }}>
                      <Clock size={11} /> {new Date(ev.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
