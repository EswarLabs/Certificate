import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { verifyCredential, trackEvent } from "../services/verificationServices";
import { renderEditorDataToHtml } from "../utils/editorDataRenderer";

export default function VerifyCredential() {
  const { code: routeCode } = useParams();
  const navigate = useNavigate();

  const [code, setCode] = useState(routeCode || "");
  const [credential, setCredential] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleVerify = async (verificationCode) => {
    if (!verificationCode) return;
    setLoading(true);
    setError(null);
    setCredential(null);
    try {
      const res = await verifyCredential(verificationCode);
      if (res.success && res.credential) {
        setCredential(res.credential);
        // Track the view event
        try {
          await trackEvent(res.credential.id, {
            eventType: "viewed",
            userAgent: navigator.userAgent,
            metadata: { screen: "public_verify" },
          });
        } catch (trackErr) {
          console.warn("Failed to track event", trackErr);
        }
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
    if (routeCode) {
      setCode(routeCode);
      handleVerify(routeCode);
    }
  }, [routeCode]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!code) return;
    navigate(`/verify/${code}`);
  };

  // Helper to compile template html with dynamic variables
  const compileTemplate = (editorData, data, recipientName, issuedAt) => {
    if (!editorData) return "";

    const issuedDateStr = issuedAt ? new Date(issuedAt).toLocaleDateString() : "";
    
    const replacements = {
      recipientName: recipientName || "",
      recipient_name: recipientName || "",
      issuedAt: issuedDateStr,
      issuedDate: issuedDateStr,
      issued_date: issuedDateStr,
      "issued date": issuedDateStr,
      verificationCode: credential.verificationCode,
      verification_code: credential.verificationCode,
      verificationUrl: `${window.location.origin}/verify/${credential.verificationCode}`,
      verification_url: `${window.location.origin}/verify/${credential.verificationCode}`,
      ...(data && typeof data === "object" ? data : {}),
    };

    const certHtml = renderEditorDataToHtml(editorData, replacements);
    const width = editorData.width || 1200;
    const height = editorData.height || 900;

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          * { box-sizing: border-box; }
          html, body {
            margin: 0;
            padding: 0;
            width: ${width}px;
            height: ${height}px;
            overflow: hidden;
            background: #f3f4f6;
          }
          #cert-scale-wrapper {
            width: ${width}px;
            height: ${height}px;
            transform-origin: top left;
            box-shadow: 0 4px 10px rgba(0,0,0,0.15);
            border-radius: 8px;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div id="cert-scale-wrapper">
          ${certHtml}
        </div>
        <script>
          function adjustScale() {
            const wrapper = document.getElementById('cert-scale-wrapper');
            const certWidth = ${width};
            const certHeight = ${height};
            const scale = (window.innerWidth / certWidth) * 0.98;

            wrapper.style.transform = 'scale(' + scale + ')';

            // Notify parent of the scaled height so iframe can resize
            const scaledHeight = certHeight * scale;
            window.parent.postMessage({ scaledHeight }, '*');
          }
          window.addEventListener('resize', adjustScale);
          adjustScale();
        </script>
      </body>
    </html>
  `;
  };

  const statusColor = (status) => {
    switch (status) {
      case "draft": return "#f59e0b";
      case "issued": return "#22c55e";
      case "revoked": return "#ef4444";
      default: return "#6b7280";
    }
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "40px auto", padding: "0 20px" }}>
      <h1>Verify Certificate Credential</h1>
      <p>Enter a unique verification code to verify the validity, recipient details, and template of the certificate.</p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. CERT-8DBC7A98EF10492B"
          style={{ flex: 1, padding: "8px 12px", fontSize: "1rem", borderRadius: "6px", border: "1px solid #d1d5db" }}
          required
        />
        <button type="submit" style={{ padding: "8px 20px", fontSize: "1rem" }} disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>

      {error && (
        <div style={{ padding: "12px", backgroundColor: "#fef2f2", color: "#ef4444", borderRadius: "6px", marginBottom: "24px" }}>
          <strong>Verification Failed:</strong> {error}
        </div>
      )}

      {credential && (
        <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden", backgroundColor: "#fff" }}>
          {/* Header Status Bar */}
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 20px",
            backgroundColor: "#f9fafb",
            borderBottom: "1px solid #e5e7eb",
          }}>
            <div>
              <span style={{ fontSize: "0.85rem", color: "#6b7280", display: "block" }}>STATUS</span>
              <span style={{
                color: "#fff",
                backgroundColor: statusColor(credential.status),
                padding: "2px 10px",
                borderRadius: "9999px",
                fontSize: "0.85rem",
                fontWeight: "600",
              }}>
                {credential.status.toUpperCase()}
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "0.85rem", color: "#6b7280", display: "block" }}>VERIFICATION CODE</span>
              <strong style={{ fontFamily: "monospace" }}>{credential.verificationCode}</strong>
            </div>
          </div>

          {/* Details Section */}
          <div style={{ padding: "20px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
              <div>
                <h3>Recipient Details</h3>
                <p><strong>Name:</strong> {credential.recipientName}</p>
                <p><strong>Email:</strong> {credential.recipientEmail}</p>
              </div>
              <div>
                <h3>Organization & Workspace</h3>
                <p><strong>Org:</strong> {credential.organization?.name || credential.organizationId}</p>
                <p><strong>Workspace:</strong> {credential.workspace?.name || credential.workspaceId}</p>
                {credential.issuedAt && (
                  <p><strong>Issued:</strong> {new Date(credential.issuedAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>

            {/* Credential Attributes */}
            {credential.credentialData && Object.keys(credential.credentialData).length > 0 && (
              <div style={{ marginBottom: "24px" }}>
                <h3>Attributes</h3>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <tbody>
                    {Object.entries(credential.credentialData).map(([k, v]) => (
                      <tr key={k} style={{ borderBottom: "1px solid #f3f4f6" }}>
                        <td style={{ padding: "8px 0", fontWeight: "bold", color: "#4b5563" }}>{k}</td>
                        <td style={{ padding: "8px 0", textAlign: "right" }}>{String(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Live Certificate Preview Frame */}
            {credential.template && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                   <h3>Certificate Preview</h3>
                   {credential.pdfUrl && (
                     <a href={credential.pdfUrl} target="_blank" rel="noreferrer" style={{ padding: "6px 12px", backgroundColor: "#2563eb", color: "white", textDecoration: "none", borderRadius: "4px", fontSize: "0.9rem" }}>
                       Download PDF
                     </a>
                   )}
                </div>
                {credential.imageUrl ? (
                  <img
                    src={credential.imageUrl}
                    alt="Certificate"
                    style={{
                      width: "100%",
                      height: "auto",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      boxShadow: "0 2px 4px 0 rgba(0,0,0,0.06)",
                    }}
                  />
                ) : (
                  <iframe
                    title="Certificate Preview"
                    srcDoc={compileTemplate(
                      credential.template.editorData,
                      credential.credentialData,
                      credential.recipientName,
                      credential.issuedAt
                    )}
                    style={{
                      width: "100%",
                      height: "700px",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                      boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.06)",
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
