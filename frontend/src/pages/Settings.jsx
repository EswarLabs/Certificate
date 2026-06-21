import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { updateUser } from "../services/userServices";
import { User, Mail, Palette, Save } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { user } = useAuth();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace, updateCurrentWorkspace } = useWorkspace();
  const [searchParams] = useSearchParams();

  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({ firstName: "", lastName: "", avatarUrl: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  const [wsForm, setWsForm] = useState({
    name: "", customDomain: "", smtpEnabled: false,
    resendApiKey: "", fromEmail: "",
    brandingPrimaryColor: "", brandingLogo: "",
  });
  const [wsLoading, setWsLoading] = useState(false);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "workspace" && selectedWorkspace) {
      setActiveTab("workspace");
    }
  }, [searchParams, selectedWorkspace]);

  useEffect(() => {
    if (user) setProfile({ firstName: user.firstName || "", lastName: user.lastName || "", avatarUrl: user.avatarUrl || "" });
  }, [user]);

  useEffect(() => {
    if (selectedWorkspace) {
      setWsForm({
        name: selectedWorkspace.name || "",
        customDomain: selectedWorkspace.customDomain || "",
        smtpEnabled: selectedWorkspace.smtpEnabled || false,
        resendApiKey: selectedWorkspace.smtpSettings?.apiKey || "",
        fromEmail: selectedWorkspace.smtpSettings?.fromEmail || "",
        brandingPrimaryColor: selectedWorkspace.brandingSettings?.primaryColor || "",
        brandingLogo: selectedWorkspace.brandingSettings?.logo || "",
      });
    }
  }, [selectedWorkspace]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    if (!user?.id) return;
    setProfileLoading(true);
    try {
      await updateUser(user.id, profile);
      toast.success("Profile updated");
    } catch (err) {
      toast.error("Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleWsUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setWsLoading(true);
    try {
      const data = {
        name: wsForm.name,
        customDomain: wsForm.customDomain || null,
        smtpEnabled: wsForm.smtpEnabled,
        brandingSettings: {
          primaryColor: wsForm.brandingPrimaryColor || null,
          logo: wsForm.brandingLogo || null,
        },
      };
      if (wsForm.smtpEnabled) {
        data.smtpSettings = {
          apiKey: wsForm.resendApiKey,
          fromEmail: wsForm.fromEmail,
        };
      }
      await updateCurrentWorkspace(selectedOrg.id, selectedWorkspace.id, data);
      toast.success("Workspace updated");
    } catch (err) {
      toast.error("Failed to update workspace");
    } finally {
      setWsLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manage your profile and workspace configuration</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${activeTab === "profile" ? "active" : ""}`} onClick={() => setActiveTab("profile")}>
          <User size={13} style={{ marginRight: 5 }} />Profile
        </button>
        {selectedWorkspace && (
          <button className={`tab-btn ${activeTab === "workspace" ? "active" : ""}`} onClick={() => setActiveTab("workspace")}>
            <Palette size={13} style={{ marginRight: 5 }} />Workspace
          </button>
        )}
      </div>

      {/* ── Profile Tab ── */}
      {activeTab === "profile" && (
        <div style={{ maxWidth: 540, width: "100%" }}>
          <div className="card">
            {/* Avatar preview row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border-color)", flexWrap: "wrap" }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-color)", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20, flexShrink: 0 }}>
                  {profile.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
              )}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 15, wordBreak: "break-word" }}>{profile.firstName} {profile.lastName}</div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", wordBreak: "break-all" }}>{user?.email}</div>
              </div>
            </div>

            <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="label">Email</label>
                <input className="input" value={user?.email || ""} disabled />
              </div>
              <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <div className="form-group">
                  <label className="label">First Name</label>
                  <input className="input" value={profile.firstName} onChange={e => setProfile({ ...profile, firstName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Last Name</label>
                  <input className="input" value={profile.lastName} onChange={e => setProfile({ ...profile, lastName: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="label">Avatar URL</label>
                <input className="input" type="url" value={profile.avatarUrl} onChange={e => setProfile({ ...profile, avatarUrl: e.target.value })} placeholder="https://..." />
              </div>
              <button type="submit" disabled={profileLoading} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                <Save size={14} /> {profileLoading ? "Saving…" : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Workspace Tab ── */}
      {activeTab === "workspace" && selectedWorkspace && (
        <div style={{ maxWidth: 680, width: "100%" }}>
          <div className="card">
            <form onSubmit={handleWsUpdate} style={{ display: "flex", flexDirection: "column", gap: 24 }}>

              {/* General */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>General</h3>
                <div className="form-group">
                  <label className="label">Workspace Name</label>
                  <input className="input" value={wsForm.name} onChange={e => setWsForm({ ...wsForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="label">Custom Domain</label>
                  <input className="input" value={wsForm.customDomain} onChange={e => setWsForm({ ...wsForm, customDomain: e.target.value })} placeholder="certs.yourdomain.com" />
                </div>
              </div>

              <div className="divider" />

              {/* Branding */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>Branding</h3>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end", flexWrap: "wrap" }}>
                  <div className="form-group" style={{ flex: "0 0 auto" }}>
                    <label className="label">Primary Color</label>
                    <input type="color" value={wsForm.brandingPrimaryColor || "#6366f1"} onChange={e => setWsForm({ ...wsForm, brandingPrimaryColor: e.target.value })}
                      style={{ height: 36, width: 72, padding: "2px 4px", cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }} />
                  </div>
                  <div className="form-group" style={{ flex: "1 1 180px" }}>
                    <label className="label">Logo URL</label>
                    <input className="input" type="url" value={wsForm.brandingLogo} onChange={e => setWsForm({ ...wsForm, brandingLogo: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* SMTP */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                  <Mail size={13} /> Custom Email (Resend API)
                </h3>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={wsForm.smtpEnabled} onChange={e => setWsForm({ ...wsForm, smtpEnabled: e.target.checked })}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--brand-primary)" }} />
                  Enable custom emails via Resend
                </label>
                {wsForm.smtpEnabled && (
                  <div className="form-row" style={{ gridTemplateColumns: "1fr" }}>
                    <div className="form-group">
                      <label className="label">Resend API Key</label>
                      <input className="input" type="password" value={wsForm.resendApiKey} placeholder="re_..."
                        onChange={e => setWsForm({ ...wsForm, resendApiKey: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label className="label">From Email Address</label>
                      <input className="input" type="email" value={wsForm.fromEmail} placeholder="hello@yourdomain.com"
                        onChange={e => setWsForm({ ...wsForm, fromEmail: e.target.value })} />
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" disabled={wsLoading} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                <Save size={14} /> {wsLoading ? "Saving…" : "Save Configuration"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
