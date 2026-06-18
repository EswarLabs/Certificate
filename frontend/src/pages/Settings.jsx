import { useState, useEffect } from "react";
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

  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState({ firstName: "", lastName: "", avatarUrl: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  const [wsForm, setWsForm] = useState({
    name: "", customDomain: "", smtpEnabled: false,
    smtpHost: "", smtpPort: "", smtpUsername: "", smtpPassword: "",
    brandingPrimaryColor: "", brandingLogo: "",
  });
  const [wsLoading, setWsLoading] = useState(false);

  useEffect(() => {
    if (user) setProfile({ firstName: user.firstName || "", lastName: user.lastName || "", avatarUrl: user.avatarUrl || "" });
  }, [user]);

  useEffect(() => {
    if (selectedWorkspace) {
      setWsForm({
        name: selectedWorkspace.name || "",
        customDomain: selectedWorkspace.customDomain || "",
        smtpEnabled: selectedWorkspace.smtpEnabled || false,
        smtpHost: selectedWorkspace.smtpSettings?.host || "",
        smtpPort: selectedWorkspace.smtpSettings?.port || "",
        smtpUsername: selectedWorkspace.smtpSettings?.username || "",
        smtpPassword: "",
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
          host: wsForm.smtpHost,
          port: parseInt(wsForm.smtpPort) || 587,
          username: wsForm.smtpUsername,
          password: wsForm.smtpPassword,
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
        <div style={{ maxWidth: 540 }}>
          <div className="card">
            {/* Avatar preview row */}
            <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24, paddingBottom: 20, borderBottom: "1px solid var(--border-color)" }}>
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-color)" }} />
              ) : (
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 20 }}>
                  {profile.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
                </div>
              )}
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{profile.firstName} {profile.lastName}</div>
                <div style={{ fontSize: 13, color: "var(--text-tertiary)" }}>{user?.email}</div>
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
        <div style={{ maxWidth: 680 }}>
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
                <div style={{ display: "flex", gap: 16, alignItems: "flex-end" }}>
                  <div className="form-group" style={{ flex: "0 0 auto" }}>
                    <label className="label">Primary Color</label>
                    <input type="color" value={wsForm.brandingPrimaryColor || "#6366f1"} onChange={e => setWsForm({ ...wsForm, brandingPrimaryColor: e.target.value })}
                      style={{ height: 36, width: 72, padding: "2px 4px", cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label className="label">Logo URL</label>
                    <input className="input" type="url" value={wsForm.brandingLogo} onChange={e => setWsForm({ ...wsForm, brandingLogo: e.target.value })} placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div className="divider" />

              {/* SMTP */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 7 }}>
                  <Mail size={13} /> Custom SMTP
                </h3>
                <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, cursor: "pointer", userSelect: "none" }}>
                  <input type="checkbox" checked={wsForm.smtpEnabled} onChange={e => setWsForm({ ...wsForm, smtpEnabled: e.target.checked })}
                    style={{ width: 16, height: 16, cursor: "pointer", accentColor: "var(--brand-primary)" }} />
                  Enable custom SMTP server
                </label>
                {wsForm.smtpEnabled && (
                  <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
                    {[
                      { key: "smtpHost", label: "Host", placeholder: "smtp.mailgun.org", type: "text" },
                      { key: "smtpPort", label: "Port", placeholder: "587", type: "number" },
                      { key: "smtpUsername", label: "Username", placeholder: "", type: "text" },
                      { key: "smtpPassword", label: "Password", placeholder: "••••••••", type: "password" },
                    ].map(f => (
                      <div key={f.key} className="form-group">
                        <label className="label">{f.label}</label>
                        <input className="input" type={f.type} value={wsForm[f.key]} placeholder={f.placeholder}
                          onChange={e => setWsForm({ ...wsForm, [f.key]: e.target.value })} />
                      </div>
                    ))}
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
