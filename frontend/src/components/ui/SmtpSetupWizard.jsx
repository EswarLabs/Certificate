import { useState } from "react";
import {
  Mail, CheckCircle, XCircle, Eye, EyeOff,
  ExternalLink, Send, Loader2, ChevronDown, ChevronUp,
  Info, AlertCircle
} from "lucide-react";
import toast from "react-hot-toast";
import { sendTestEmail } from "../../services/workspaceServices";
import "./SmtpSetupWizard.css";

const PROVIDERS = [
  {
    id: "resend",
    name: "Resend",
    emoji: "⚡",
    description: "Recommended. Simple API key setup.",
    recommended: true,
    fields: [
      { key: "apiKey", label: "Resend API Key", type: "password", placeholder: "re_xxxxxxxxxxxx", hint: "Create one at resend.com/api-keys" },
      { key: "fromEmail", label: "From Email", type: "email", placeholder: "hello@yourdomain.com", hint: "Must be from a verified Resend domain" },
    ],
    guide: [
      "Sign up at resend.com",
      "Go to API Keys → Create API Key",
      "Add your domain in Resend's Domains section",
      "Paste your API key above",
    ],
    docsUrl: "https://resend.com/docs",
    color: "#000",
  },
  {
    id: "gmail",
    name: "Gmail",
    emoji: "📧",
    description: "Use a Gmail account with App Password.",
    fields: [
      { key: "apiKey", label: "App Password", type: "password", placeholder: "xxxx xxxx xxxx xxxx", hint: "Generate at myaccount.google.com/apppasswords" },
      { key: "fromEmail", label: "Gmail Address", type: "email", placeholder: "you@gmail.com", hint: "The Gmail account you authorized" },
    ],
    guide: [
      "Enable 2-Factor Authentication on your Google account",
      "Go to myaccount.google.com → Security → App Passwords",
      "Create an App Password for 'Mail'",
      "Paste the generated 16-character password above",
    ],
    docsUrl: "https://support.google.com/accounts/answer/185833",
    note: "Gmail has a daily sending limit of 500 emails. For high volume, use Resend or SendGrid.",
  },
  {
    id: "sendgrid",
    name: "SendGrid",
    emoji: "📨",
    description: "Twilio SendGrid — scalable email API.",
    fields: [
      { key: "apiKey", label: "SendGrid API Key", type: "password", placeholder: "SG.xxxxxxxxxxxx", hint: "Create one in your SendGrid dashboard" },
      { key: "fromEmail", label: "Sender Email", type: "email", placeholder: "noreply@yourdomain.com", hint: "Must be a verified sender identity in SendGrid" },
    ],
    guide: [
      "Log in at app.sendgrid.com",
      "Go to Settings → API Keys → Create API Key",
      "Select 'Mail Send' permission",
      "Verify your sender identity under Settings → Sender Authentication",
    ],
    docsUrl: "https://docs.sendgrid.com/for-developers/sending-email/api-getting-started",
  },
  {
    id: "ses",
    name: "Amazon SES",
    emoji: "☁️",
    description: "AWS Simple Email Service — enterprise scale.",
    fields: [
      { key: "apiKey", label: "SES API Key (SMTP Password)", type: "password", placeholder: "SMTP credential password", hint: "Generate SMTP credentials in SES console" },
      { key: "fromEmail", label: "Verified Sender Email", type: "email", placeholder: "noreply@yourdomain.com", hint: "Must be verified in SES" },
    ],
    guide: [
      "Go to AWS SES Console → SMTP Settings",
      "Click 'Create SMTP Credentials'",
      "Save the SMTP username and password shown",
      "Verify your email address or domain in SES",
      "If in sandbox mode, verify recipient emails too",
    ],
    docsUrl: "https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html",
  },
  {
    id: "zoho",
    name: "Zoho Mail",
    emoji: "🔵",
    description: "Zoho Mail SMTP with App-specific password.",
    fields: [
      { key: "apiKey", label: "App Password", type: "password", placeholder: "App-specific password", hint: "Generate in Zoho account settings" },
      { key: "fromEmail", label: "Zoho Email", type: "email", placeholder: "you@zohomail.com", hint: "Your Zoho Mail address" },
    ],
    guide: [
      "Log in to accounts.zoho.com",
      "Go to Security → App-specific Passwords",
      "Generate a password for your mail client",
      "Use SMTP host: smtp.zoho.com, Port: 587",
    ],
    docsUrl: "https://www.zoho.com/mail/help/zoho-smtp.html",
  },
  {
    id: "outlook",
    name: "Outlook",
    emoji: "📮",
    description: "Microsoft Outlook / Office 365 SMTP.",
    fields: [
      { key: "apiKey", label: "App Password / OAuth Token", type: "password", placeholder: "App password or OAuth token", hint: "Use App Passwords if 2FA is enabled" },
      { key: "fromEmail", label: "Outlook Email", type: "email", placeholder: "you@outlook.com", hint: "Your Outlook/Office 365 address" },
    ],
    guide: [
      "Enable 2-Factor Authentication on your Microsoft account",
      "Go to account.microsoft.com → Security → App Passwords",
      "Generate an app password",
      "Use SMTP: smtp.office365.com, Port: 587",
    ],
    docsUrl: "https://support.microsoft.com/en-us/office/pop-imap-and-smtp-settings",
  },
];

export default function SmtpSetupWizard({ workspaceId, orgId, workspace, onSave }) {
  const [selectedProvider, setSelectedProvider] = useState(
    workspace?.smtpEnabled ? "resend" : null
  );
  const [fields, setFields] = useState({
    apiKey: workspace?.smtpSettings?.apiKey || "",
    fromEmail: workspace?.smtpSettings?.fromEmail || "",
  });
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null); // null | 'success' | 'failed'
  const [testEmail, setTestEmail] = useState("");
  const [showGuide, setShowGuide] = useState(false);
  const [saving, setSaving] = useState(false);

  const provider = PROVIDERS.find(p => p.id === selectedProvider);

  const handleSave = async () => {
    if (!provider || !fields.apiKey || !fields.fromEmail) {
      toast.error("Please fill in all required fields");
      return;
    }
    setSaving(true);
    try {
      await onSave({
        smtpEnabled: true,
        smtpSettings: {
          apiKey: fields.apiKey,
          fromEmail: fields.fromEmail,
          provider: selectedProvider,
        },
      });
      toast.success("Email settings saved successfully!");
      setTestResult(null);
    } catch (err) {
      toast.error(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleDisable = async () => {
    setSaving(true);
    try {
      await onSave({ smtpEnabled: false });
      toast.success("Custom email disabled. System emails will be used.");
      setSelectedProvider(null);
      setFields({ apiKey: "", fromEmail: "" });
    } catch (err) {
      toast.error(err.message || "Failed to disable email");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) return toast.error("Please enter a test email address");
    if (!fields.apiKey || !fields.fromEmail || !selectedProvider) {
      return toast.error("Please fill in your email provider settings first");
    }
    if (!workspaceId || !orgId) {
      return toast.error("Workspace context is missing — try refreshing the page");
    }
    setTesting(true);
    setTestResult(null);
    try {
      await sendTestEmail(orgId, workspaceId, {
        to: testEmail,
        provider: selectedProvider,
        apiKey: fields.apiKey,
        fromEmail: fields.fromEmail,
      });
      setTestResult("success");
      toast.success(`Test email sent to ${testEmail}!`);
    } catch (err) {
      setTestResult("failed");
      toast.error(err.message || "Test failed — check your credentials");
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="smtp-wizard">
      {/* Current status */}
      {workspace?.smtpEnabled && (
        <div className="alert alert-success" style={{ marginBottom: 4 }}>
          <CheckCircle size={14} />
          <span>Custom email is <strong>enabled</strong> — using <code style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{workspace.smtpSettings?.fromEmail}</code></span>
        </div>
      )}

      {/* Provider selection */}
      <div>
        <div className="label" style={{ marginBottom: 10 }}>Select your email provider</div>
        <div className="provider-grid">
          {PROVIDERS.map(p => (
            <button
              key={p.id}
              className={`provider-card ${selectedProvider === p.id ? "selected" : ""}`}
              onClick={() => { setSelectedProvider(p.id); setTestResult(null); }}
              type="button"
            >
              <span style={{ fontSize: 22 }}>{p.emoji}</span>
              <div className="provider-card-name">
                {p.name}
                {p.recommended && <span style={{ display: "block", fontSize: 10, fontWeight: 600, color: "var(--brand-primary)", marginTop: 2 }}>Recommended</span>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Provider config */}
      {provider && (
        <div className="smtp-config-panel">
          <div className="smtp-config-header">
            <div>
              <div style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>
                {provider.emoji} Configure {provider.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>
                {provider.description}
              </div>
            </div>
            <a
              href={provider.docsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost btn-sm"
            >
              Docs <ExternalLink size={12} />
            </a>
          </div>

          {/* Note if any */}
          {provider.note && (
            <div className="alert alert-warning">
              <AlertCircle size={14} style={{ flexShrink: 0 }} />
              {provider.note}
            </div>
          )}

          {/* Fields */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {provider.fields.map(f => (
              <div key={f.key} className="form-group">
                <label className="label">{f.label}</label>
                <div style={{ position: "relative" }}>
                  <input
                    className="input"
                    type={f.type === "password" && !showKey ? "password" : f.type === "password" ? "text" : f.type}
                    value={fields[f.key]}
                    onChange={e => setFields(prev => ({ ...prev, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={f.type === "password" ? { paddingRight: 40 } : undefined}
                  />
                  {f.type === "password" && (
                    <button
                      type="button"
                      onClick={() => setShowKey(p => !p)}
                      style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 2 }}
                    >
                      {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  )}
                </div>
                {f.hint && <span className="form-hint">{f.hint}</span>}
              </div>
            ))}
          </div>

          {/* Setup Guide (collapsible) */}
          <div className="smtp-guide">
            <button
              type="button"
              className="smtp-guide-toggle"
              onClick={() => setShowGuide(p => !p)}
            >
              <Info size={14} />
              Setup guide for {provider.name}
              {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {showGuide && (
              <ol className="smtp-guide-steps">
                {provider.guide.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
            )}
          </div>

          {/* Test email */}
          <div className="smtp-test-section">
            <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
              <Send size={13} /> Send Test Email
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input
                className="input"
                type="email"
                value={testEmail}
                onChange={e => setTestEmail(e.target.value)}
                placeholder="recipient@example.com"
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleTest}
                disabled={testing || !testEmail}
                style={{ flexShrink: 0 }}
              >
                {testing ? <><Loader2 size={13} style={{ animation: "spin 0.7s linear infinite" }} /> Sending…</> : "Send Test"}
              </button>
            </div>
            {testResult === "success" && (
              <div className="alert alert-success" style={{ marginTop: 8 }}>
                <CheckCircle size={14} /> Test email sent! Check your inbox.
              </div>
            )}
            {testResult === "failed" && (
              <div className="alert alert-error" style={{ marginTop: 8 }}>
                <XCircle size={14} /> Test failed. Check your credentials and try again.
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSave}
              disabled={saving || !fields.apiKey || !fields.fromEmail}
            >
              {saving ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Saving…</> : <><CheckCircle size={14} /> Save Email Settings</>}
            </button>
            {workspace?.smtpEnabled && (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDisable}
                disabled={saving}
              >
                Disable Custom Email
              </button>
            )}
          </div>
        </div>
      )}

      {!selectedProvider && (
        <div style={{ textAlign: "center", padding: "24px", color: "var(--text-tertiary)", fontSize: 13 }}>
          Select a provider above to get started
        </div>
      )}
    </div>
  );
}
