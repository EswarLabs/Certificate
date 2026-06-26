import { useState } from "react";
import {
  Shield, ShieldCheck, AlertTriangle, Copy, Check,
  RefreshCcw, Globe, ChevronRight, ExternalLink, Clock,
  Info, CheckCircle, XCircle, Loader2, RotateCcw
} from "lucide-react";
import { requestVerification, checkVerification } from "../../services/orgServices";
import toast from "react-hot-toast";
import "./DomainVerificationWizard.css";

const REGISTRAR_LINKS = [
  { name: "Cloudflare", url: "https://dash.cloudflare.com/" },
  { name: "GoDaddy", url: "https://dcc.godaddy.com/manage/" },
  { name: "Namecheap", url: "https://www.namecheap.com/domains/dns/" },
  { name: "AWS Route 53", url: "https://console.aws.amazon.com/route53/" },
  { name: "Google Domains", url: "https://domains.google.com/" },
];

const isTokenExpired = (expiry) => expiry && new Date() > new Date(expiry);

export default function DomainVerificationWizard({ orgId, orgData, onVerified }) {
  const pendingWithToken = orgData?.verificationStatus === "PENDING" && orgData?.verificationToken;
  const [step, setStep] = useState(pendingWithToken ? 2 : 0);
  const [domain, setDomain] = useState(orgData?.verifiedDomain || "");
  const [verifyData, setVerifyData] = useState(
    pendingWithToken
      ? { token: orgData.verificationToken, domain: orgData.verifiedDomain, expiry: orgData.verificationExpiry }
      : null
  );
  const [tokenRefreshed, setTokenRefreshed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null); // null | "success" | "failed"

  // Already verified
  if (orgData?.isVerified) {
    return (
      <div style={{ background: "var(--success-light)", border: "1px solid var(--success)", borderRadius: "var(--radius-lg)", padding: "20px 24px", display: "flex", alignItems: "flex-start", gap: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <ShieldCheck size={20} color="#fff" />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: "var(--success-text, var(--success))", marginBottom: 4 }}>Domain Verified ✓</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{orgData.verifiedDomain}</strong> is verified.
            Your certificates will display a verified badge.
          </div>
        </div>
      </div>
    );
  }

  const copyToken = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — please copy manually");
    }
  };

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    if (!domain.trim()) return;
    setRequesting(true);
    try {
      const res = await requestVerification(orgId, domain.trim());
      if (res.success) {
        // backend returns res.verification = { token, domain, expiry }
        const v = res.verification;
        setVerifyData({ token: v?.token || v?.verificationToken, domain: domain.trim(), expiry: v?.expiry });
        setTokenRefreshed(false);
        setStep(2);
        toast.success("DNS record generated — now add it to your domain!");
      } else {
        toast.error(res.message || "Failed to request verification");
      }
    } catch (err) {
      toast.error(err.message || "Failed to request verification");
    } finally {
      setRequesting(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await checkVerification(orgId);
      if (res.success) {
        setCheckResult("success");
        toast.success("Domain verified successfully!");
        setTimeout(() => onVerified?.(), 1000);
      } else if (res.code === 'TOKEN_EXPIRED') {
        // Token expired — backend generated a fresh one; show it to the user
        setVerifyData({ token: res.newToken, domain: res.domain, expiry: res.newExpiry });
        setTokenRefreshed(true);
        setCheckResult(null);
        setStep(2);
        toast(
          '⚠️ Your verification token had expired. A new token has been generated — please update your DNS TXT record.',
          { duration: 6000, icon: '🔄' }
        );
      } else {
        setCheckResult("failed");
        toast.error(res.message || "Verification not found. DNS may still be propagating.");
      }
    } catch (err) {
      setCheckResult("failed");
      toast.error(err.message || "Verification check failed");
    } finally {
      setChecking(false);
    }
  };

  const token = verifyData?.token;
  const verifyDomain = verifyData?.domain || domain;

  return (
    <div className="dvw-container">
      {/* ── Step Indicator ── */}
      <div className="dvw-steps">
        {["Why Verify?", "Enter Domain", "Add DNS Record", "Verify"].map((label, i) => (
          <div key={i} className={`dvw-step-pill ${step === i ? "active" : step > i ? "done" : ""}`}>
            <span className="dvw-step-num">{step > i ? <Check size={11} /> : i + 1}</span>
            <span className="dvw-step-label">{label}</span>
          </div>
        ))}
      </div>

      {/* ── Step 0: Why Verify ── */}
      {step === 0 && (
        <div className="dvw-body">
          <div className="dvw-icon-wrap">
            <Shield size={28} color="var(--brand-primary)" />
          </div>
          <h3 className="dvw-title">Why verify your domain?</h3>
          <p className="dvw-desc">
            Domain verification proves that your organization actually owns the domain associated with issued certificates. This adds a "Verified ✓" badge to all your public certificates.
          </p>
          <div className="dvw-benefits">
            {[
              ["🏛️ Credibility", "Certificates display your verified organization badge"],
              ["🔒 Trust", "Recipients can confirm certificates are genuinely from you"],
              ["🌐 Custom domain", "Use your own domain for certificate verification pages"],
            ].map(([title, desc]) => (
              <div key={title} className="dvw-benefit-item">
                <div className="dvw-benefit-title">{title}</div>
                <div className="dvw-benefit-desc">{desc}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-primary btn-lg" style={{ width: "100%" }} onClick={() => setStep(1)}>
            Get Started <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* ── Step 1: Enter Domain ── */}
      {step === 1 && (
        <div className="dvw-body">
          <div className="dvw-icon-wrap">
            <Globe size={28} color="var(--brand-primary)" />
          </div>
          <h3 className="dvw-title">Enter your domain</h3>
          <p className="dvw-desc">
            Enter the root domain of your organization. We'll generate a DNS TXT record for you to add.
          </p>
          <form onSubmit={handleRequestVerification} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="form-group">
              <label className="label">Domain Name</label>
              <input
                className="input"
                value={domain}
                onChange={(e) => setDomain(e.target.value.toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*/, "").trim())}
                placeholder="example.com"
                required
                autoFocus
              />
              <span className="form-hint">Enter the root domain only (e.g. <code>harvard.edu</code>), not a subdomain or full URL.</span>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setStep(0)}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={requesting || !domain.trim()} style={{ flex: 1, justifyContent: "center" }}>
                {requesting ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Generating…</> : "Generate DNS Record"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Step 2: Add DNS Record ── */}
      {step === 2 && token && (
        <div className="dvw-body">
          <div className="dvw-icon-wrap" style={{ background: tokenRefreshed ? "var(--danger-light, #fee2e2)" : "var(--warning-light)" }}>
            {tokenRefreshed ? <RotateCcw size={28} color="var(--danger, #ef4444)" /> : <Clock size={28} color="var(--warning)" />}
          </div>
          <h3 className="dvw-title">{tokenRefreshed ? "New Token Generated" : "Add this DNS TXT record"}</h3>

          {/* Token-refreshed banner */}
          {tokenRefreshed && (
            <div className="alert alert-warning" style={{ marginBottom: 8 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>Your previous token had expired.</strong> A fresh token has been generated below.
                Please <strong>replace</strong> the old TXT record in your DNS with this new value, then click "I've added the record".
              </div>
            </div>
          )}

          {/* Stale-token banner (token was loaded from DB and is already past expiry) */}
          {!tokenRefreshed && verifyData?.expiry && isTokenExpired(verifyData.expiry) && (
            <div className="alert alert-warning" style={{ marginBottom: 8 }}>
              <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <strong>This token may have expired.</strong> Click "Check Now" on the next step — a new token will be automatically generated if needed.
              </div>
            </div>
          )}

          <p className="dvw-desc">
            Log in to your domain registrar (where you manage DNS for <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{verifyDomain}</strong>) and add the following TXT record:
          </p>

          {/* DNS Record Table */}
          <div className="dns-record">
            <div className="dns-record-row">
              <div className="dns-record-key">Type</div>
              <div className="dns-record-val">
                <span style={{ fontFamily: "var(--font-mono)", fontWeight: 600 }}>TXT</span>
              </div>
            </div>
            <div className="dns-record-row">
              <div className="dns-record-key">Name / Host</div>
              <div className="dns-record-val">
                <code style={{ fontFamily: "var(--font-mono)" }}>@ <span style={{ fontFamily: "var(--font-sans)", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 400 }}>(or leave blank)</span></code>
              </div>
            </div>
            <div className="dns-record-row">
              <div className="dns-record-key">Value</div>
              <div className="dns-record-val">
                <code style={{ flex: 1, wordBreak: "break-all", fontSize: 12 }}>{token}</code>
                <button
                  className={`copy-btn ${copied ? "copied" : ""}`}
                  onClick={() => copyToken(token)}
                  type="button"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
            </div>
            <div className="dns-record-row">
              <div className="dns-record-key">TTL</div>
              <div className="dns-record-val">
                <code style={{ fontFamily: "var(--font-mono)" }}>300</code>
                <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>(or lowest available)</span>
              </div>
            </div>
          </div>

          {/* Propagation Warning */}
          <div className="alert alert-warning" style={{ marginTop: 4 }}>
            <Clock size={14} style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <strong>DNS propagation can take 5 minutes to 48 hours.</strong> If verification fails, wait a bit and try again.
            </div>
          </div>

          {/* Quick links */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Quick links to common registrars:
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {REGISTRAR_LINKS.map(r => (
                <a key={r.name} href={r.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-sm">
                  {r.name} <ExternalLink size={11} />
                </a>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button type="button" className="btn btn-secondary" onClick={() => setStep(1)}>Back</button>
            <button type="button" className="btn btn-primary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setStep(3)}>
              I've added the record <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Verify ── */}
      {step === 3 && (
        <div className="dvw-body">
          <div className={`dvw-icon-wrap ${checkResult === "success" ? "success" : checkResult === "failed" ? "danger" : ""}`}>
            {checkResult === "success" ? <CheckCircle size={28} color="var(--success)" /> :
             checkResult === "failed" ? <XCircle size={28} color="var(--danger)" /> :
             <RefreshCcw size={28} color="var(--brand-primary)" />}
          </div>
          <h3 className="dvw-title">
            {checkResult === "success" ? "Domain Verified! 🎉" :
             checkResult === "failed" ? "Verification Failed" :
             "Check verification"}
          </h3>
          <p className="dvw-desc">
            {checkResult === "success"
              ? `Your domain ${verifyDomain} is now verified. Your certificates will display a verified badge.`
              : checkResult === "failed"
              ? "We couldn't find the DNS record yet. DNS propagation can take time — please wait a few minutes and try again."
              : `Click "Check Now" to verify your DNS record for ${verifyDomain}. Make sure you've added the TXT record first.`}
          </p>

          {checkResult !== "success" && (
            <>
              <button
                className="btn btn-primary btn-lg"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={handleCheckVerification}
                disabled={checking}
              >
                {checking
                  ? <><Loader2 size={16} style={{ animation: "spin 0.7s linear infinite" }} /> Checking…</>
                  : <><RefreshCcw size={16} /> Check Now</>}
              </button>

              {checkResult === "failed" && (
                <div className="dvw-troubleshoot">
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                    <Info size={14} /> Troubleshooting
                  </div>
                  <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
                    {[
                      "Ensure the Name/Host field is set to @ or left blank",
                      "Double-check the Value — it must be an exact match",
                      "DNS propagation can take up to 48 hours",
                      "Try using a DNS checker tool to confirm the record is live",
                    ].map((tip, i) => (
                      <li key={i} style={{ fontSize: 13, color: "var(--text-secondary)", display: "flex", gap: 8 }}>
                        <span style={{ color: "var(--warning)", flexShrink: 0 }}>›</span> {tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setStep(2)}>
                ← Back to DNS record
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
