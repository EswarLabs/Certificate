import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verifyCredential, trackEvent } from "../services/verificationServices";
import { renderEditorDataToHtml } from "../utils/editorDataRenderer";
import { ShieldCheck, ShieldX, Download, CheckCircle, XCircle, Clock, Award } from "lucide-react";

export default function VerifyCredential() {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();

  const [code, setCode]           = useState(routeCode || "");
  const [credential, setCredential] = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  const handleVerify = async (verificationCode) => {
    if (!verificationCode) return;
    setLoading(true);
    setError(null);
    setCredential(null);
    try {
      const res = await verifyCredential(verificationCode);
      if (res.success && res.credential) {
        setCredential(res.credential);
        try {
          await trackEvent(res.credential.id, {
            eventType: "viewed",
            userAgent: navigator.userAgent,
            metadata: { screen: "public_verify" },
          });
        } catch {}
      } else {
        setError(res.message || "Credential not found or invalid.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routeCode) { setCode(routeCode); handleVerify(routeCode); }
  }, [routeCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    navigate(`/verify/${code.trim()}`);
  };

  const compileTemplate = (editorData, data, recipientName, issuedAt) => {
    if (!editorData) return "";
    const issuedDateStr = issuedAt ? new Date(issuedAt).toLocaleDateString() : "";
    const replacements = {
      recipientName: recipientName || "",
      recipient_name: recipientName || "",
      issuedAt: issuedDateStr, issuedDate: issuedDateStr, issued_date: issuedDateStr, "issued date": issuedDateStr,
      verificationCode: credential?.verificationCode || "",
      verification_code: credential?.verificationCode || "",
      verificationUrl: `${window.location.origin}/verify/${credential?.verificationCode}`,
      ...(data && typeof data === "object" ? data : {}),
    };
    const certHtml = renderEditorDataToHtml(editorData, replacements);
    const width = editorData.width || 1200;
    const height = editorData.height || 900;
    return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>*{box-sizing:border-box}html,body{margin:0;padding:0;width:${width}px;height:${height}px;overflow:hidden}#w{width:${width}px;height:${height}px;transform-origin:top left}</style></head><body><div id="w">${certHtml}</div><script>function adj(){const s=window.innerWidth/${width}*0.98;document.getElementById('w').style.transform='scale('+s+')';window.parent.postMessage({scaledHeight:${height}*s},'*')}window.addEventListener('resize',adj);adj();</script></body></html>`;
  };

  const statusConfig = {
    issued:  { icon: ShieldCheck, color: "#10b981", bg: "#d1fae5", label: "Valid & Verified" },
    draft:   { icon: Clock,       color: "#f59e0b", bg: "#fef3c7", label: "Draft" },
    revoked: { icon: ShieldX,     color: "#ef4444", bg: "#fee2e2", label: "Revoked" },
  };

  const st = credential ? statusConfig[credential.status?.toLowerCase()] || statusConfig.draft : null;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-tertiary, #f1f5f9)", fontFamily: "Inter, sans-serif" }}>
      {/* Top bar */}
      <div style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <Award size={22} style={{ color: "#a5b4fc" }} />
        <span style={{ color: "#fff", fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>CertManager Verification</span>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "36px 24px" }}>
        {/* Search card */}
        <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", padding: 32, marginBottom: 28 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: "#0f172a" }}>Verify Certificate</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24 }}>Enter the unique verification code found on the certificate to check its authenticity.</p>
          <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10 }}>
            <input
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="e.g. CERT-8DBC7A98EF10492B"
              required
              style={{ flex: 1, padding: "10px 14px", border: "1.5px solid #e2e8f0", borderRadius: 8, fontSize: 14, outline: "none", fontFamily: "monospace", letterSpacing: "0.04em", transition: "border-color 0.15s" }}
              onFocus={e => e.target.style.borderColor = "#6366f1"}
              onBlur={e => e.target.style.borderColor = "#e2e8f0"}
            />
            <button
              type="submit"
              disabled={loading}
              style={{ padding: "10px 22px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? "Verifying…" : <><ShieldCheck size={16} /> Verify</>}
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "16px 20px", display: "flex", gap: 12, alignItems: "center", marginBottom: 24 }}>
            <XCircle size={20} style={{ color: "#ef4444", flexShrink: 0 }} />
            <div>
              <div style={{ fontWeight: 600, color: "#991b1b", fontSize: 14 }}>Verification Failed</div>
              <div style={{ fontSize: 13, color: "#dc2626", marginTop: 2 }}>{error}</div>
            </div>
          </div>
        )}

        {/* Result */}
        {credential && st && (
          <div style={{ background: "#fff", borderRadius: 16, border: "1px solid #e2e8f0", boxShadow: "0 4px 24px rgba(0,0,0,0.07)", overflow: "hidden" }}>
            {/* Status banner */}
            <div style={{ background: st.bg, borderBottom: `2px solid ${st.color}22`, padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <st.icon size={22} style={{ color: st.color }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 15, color: "#0f172a" }}>{st.label}</div>
                  <div style={{ fontSize: 12, color: "#475569" }}>This certificate has been verified</div>
                </div>
              </div>
              <code style={{ fontSize: 12, fontFamily: "monospace", background: "rgba(99,102,241,0.1)", color: "#6366f1", padding: "4px 10px", borderRadius: 6 }}>
                {credential.verificationCode}
              </code>
            </div>

            {/* Info grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, borderBottom: "1px solid #e2e8f0" }}>
              {[
                ["Recipient", credential.recipientName],
                ["Email", credential.recipientEmail || "—"],
                ["Organization", credential.organization ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{credential.organization.name}</span>
                    {credential.organization.isVerified ? (
                      <span title={`Verified Domain: ${credential.organization.verifiedDomain}`} style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, background: "#d1fae5", color: "#10b981", padding: "2px 6px", borderRadius: 10, flexShrink: 0 }}>
                        <ShieldCheck size={10} /> Verified
                      </span>
                    ) : (
                      <span title="Unverified Organization - exercise caution" style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, background: "#fef3c7", color: "#f59e0b", padding: "2px 6px", borderRadius: 10, flexShrink: 0 }}>
                        <ShieldX size={10} /> Unverified
                      </span>
                    )}
                  </div>
                ) : "—"],
                ["Workspace", credential.workspace?.name || "—"],
                ["Issued", credential.issuedAt ? new Date(credential.issuedAt).toLocaleDateString() : "—"],
                ["Expires", credential.expiresAt ? new Date(credential.expiresAt).toLocaleDateString() : "Never"],
              ].map(([label, val]) => (
                <div key={label} style={{ padding: "14px 24px", borderBottom: "1px solid #f1f5f9", borderRight: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: 10, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>{label}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#0f172a" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Credential fields */}
            {credential.credentialData && Object.keys(credential.credentialData).length > 0 && (
              <div style={{ padding: "20px 24px", borderBottom: "1px solid #e2e8f0" }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.04em" }}>Credential Fields</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {Object.entries(credential.credentialData).map(([k, v]) => (
                    <div key={k} style={{ background: "#f8fafc", borderRadius: 8, padding: "10px 14px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{k}</div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>{String(v)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certificate preview */}
            {credential.template && (
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "#0f172a" }}>Certificate Preview</div>
                  {credential.pdfUrl && (
                    <a href={credential.pdfUrl} target="_blank" rel="noreferrer"
                      style={{ display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", background: "#6366f1", color: "#fff", borderRadius: 8, fontSize: 13, fontWeight: 500, textDecoration: "none" }}>
                      <Download size={14} /> Download PDF
                    </a>
                  )}
                </div>
                {credential.imageUrl ? (
                  <img
                    src={credential.imageUrl}
                    alt="Certificate"
                    style={{ width: "100%", height: "auto", borderRadius: 10, border: "1px solid #e2e8f0", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", display: "block" }}
                  />
                ) : (
                  <iframe
                    title="Certificate Preview"
                    srcDoc={compileTemplate(credential.template.editorData, credential.credentialData, credential.recipientName, credential.issuedAt)}
                    style={{ width: "100%", height: 600, border: "1px solid #e2e8f0", borderRadius: 10, display: "block" }}
                  />
                )}
                {/* Platform Trust Signal */}
                <div style={{ marginTop: 16, fontSize: 12, color: "#64748b", textAlign: "center", padding: "12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <ShieldCheck size={14} style={{ verticalAlign: "middle", marginRight: 4, color: "#10b981" }} />
                  Issued via <strong>CertManager</strong>. This certificate's authenticity can be verified at {window.location.origin}/verify/{credential.verificationCode}.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
