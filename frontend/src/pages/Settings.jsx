import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { updateUser } from "../services/userServices";
import { Building2, Folder, Files as FilesIcon, Settings2, Mail, User, Palette } from "lucide-react";
import toast from "react-hot-toast";

export default function Settings() {
  const { user } = useAuth();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace, updateCurrentWorkspace } = useWorkspace();
  
  const [activeTab, setActiveTab] = useState("administration");

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Workspace state
  const [wsForm, setWsForm] = useState({
    name: "",
    customDomain: "",
    smtpEnabled: false,
    smtpHost: "",
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
    brandingPrimaryColor: "",
    brandingLogo: "",
  });
  const [wsLoading, setWsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
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
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error(err);
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
      toast.success("Workspace updated successfully");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update workspace");
    } finally {
      setWsLoading(false);
    }
  };

  const adminLinks = [
    { to: "/organizations", label: "Organizations", description: "Manage your organizations and switch contexts.", icon: Building2 },
    { to: "/workspaces", label: "Workspaces", description: "Manage workspaces within the current organization.", icon: Folder },
    { to: "/files", label: "Files", description: "View and manage uploaded files and assets.", icon: FilesIcon },
    { to: "/jobs", label: "Jobs", description: "Monitor background jobs and bulk operations.", icon: Settings2 },
    { to: "/email-logs", label: "Email Logs", description: "Track email delivery status and bounces.", icon: Mail },
  ];

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "16px" }}>
        <h1 className="page-title">Settings</h1>
      </div>
      
      <div style={{ display: "flex", gap: "24px", borderBottom: "1px solid var(--border-color)", marginBottom: "32px" }}>
        <button 
          onClick={() => setActiveTab("administration")}
          style={{ 
            background: "none", 
            border: "none", 
            padding: "8px 0", 
            marginRight: "24px", 
            cursor: "pointer", 
            fontSize: "14px", 
            fontWeight: 500, 
            color: activeTab === "administration" ? "var(--text-primary)" : "var(--text-secondary)",
            borderBottom: activeTab === "administration" ? "2px solid var(--text-primary)" : "2px solid transparent"
          }}>
          Administration
        </button>
        <button 
          onClick={() => setActiveTab("profile")}
          style={{ 
            background: "none", 
            border: "none", 
            padding: "8px 0", 
            marginRight: "24px", 
            cursor: "pointer", 
            fontSize: "14px", 
            fontWeight: 500, 
            color: activeTab === "profile" ? "var(--text-primary)" : "var(--text-secondary)",
            borderBottom: activeTab === "profile" ? "2px solid var(--text-primary)" : "2px solid transparent"
          }}>
          Profile
        </button>
        {selectedWorkspace && (
          <button 
            onClick={() => setActiveTab("workspace")}
            style={{ 
              background: "none", 
              border: "none", 
              padding: "8px 0", 
              cursor: "pointer", 
              fontSize: "14px", 
              fontWeight: 500, 
              color: activeTab === "workspace" ? "var(--text-primary)" : "var(--text-secondary)",
              borderBottom: activeTab === "workspace" ? "2px solid var(--text-primary)" : "2px solid transparent"
            }}>
            Workspace Configuration
          </button>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Navigation Hub */}
        {activeTab === "administration" && (
          <section>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {adminLinks.map(link => {
                const Icon = link.icon;
                return (
                  <Link key={link.to} to={link.to} style={{ textDecoration: "none" }}>
                    <div className="card" style={{ display: "flex", gap: "16px", alignItems: "flex-start", cursor: "pointer", height: "100%" }}>
                      <div style={{ padding: "8px", borderRadius: "6px", backgroundColor: "var(--bg-hover)", color: "var(--text-secondary)" }}>
                        <Icon size={20} />
                      </div>
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: 500, margin: "0 0 4px 0", color: "var(--text-primary)" }}>{link.label}</h3>
                        <p style={{ margin: 0, fontSize: "13px", color: "var(--text-secondary)" }}>{link.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === "profile" && (
          <section style={{ maxWidth: "600px" }}>
            <div className="card">
              <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Email</label>
                  <input type="text" value={user?.email || ""} disabled className="input" style={{ opacity: 0.7 }} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>First Name</label>
                    <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} className="input" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Last Name</label>
                    <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} className="input" />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Avatar URL</label>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {profile.avatarUrl ? (
                      <img src={profile.avatarUrl} alt="Avatar" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}><User size={16} color="var(--text-secondary)" /></div>
                    )}
                    <input type="url" value={profile.avatarUrl} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })} className="input" placeholder="https://..." />
                  </div>
                </div>
                <button type="submit" disabled={profileLoading} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                  {profileLoading ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          </section>
        )}

        {/* Workspace Form */}
        {activeTab === "workspace" && selectedWorkspace && (
          <section style={{ maxWidth: "800px" }}>
            <div className="card">
              <form onSubmit={handleWsUpdate} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* General */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Workspace Name</label>
                    <input type="text" value={wsForm.name} onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} className="input" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ fontSize: "13px", fontWeight: 500, color: "var(--text-secondary)" }}>Custom Domain</label>
                    <input type="text" value={wsForm.customDomain} onChange={(e) => setWsForm({ ...wsForm, customDomain: e.target.value })} className="input" placeholder="certs.yourdomain.com" />
                  </div>
                </div>

                {/* Branding */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><Palette size={14} /> Branding</h3>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Primary Color</label>
                      <input type="color" value={wsForm.brandingPrimaryColor || "#000000"} onChange={(e) => setWsForm({ ...wsForm, brandingPrimaryColor: e.target.value })} style={{ height: "32px", width: "64px", padding: "0", cursor: "pointer", border: "1px solid var(--border-color)", borderRadius: "4px" }} />
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", flex: 1 }}>
                      <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Logo URL</label>
                      <input type="url" value={wsForm.brandingLogo} onChange={(e) => setWsForm({ ...wsForm, brandingLogo: e.target.value })} className="input" placeholder="https://..." />
                    </div>
                  </div>
                </div>

                {/* SMTP */}
                <div style={{ display: "flex", flexDirection: "column", gap: "16px", paddingTop: "16px", borderTop: "1px solid var(--border-color)" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><Mail size={14} /> Custom SMTP</h3>
                  <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", cursor: "pointer" }}>
                    <input type="checkbox" checked={wsForm.smtpEnabled} onChange={(e) => setWsForm({ ...wsForm, smtpEnabled: e.target.checked })} style={{ width: "16px", height: "16px", cursor: "pointer" }} />
                    Enable Custom SMTP Server
                  </label>
                  {wsForm.smtpEnabled && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Host</label>
                        <input type="text" value={wsForm.smtpHost} onChange={(e) => setWsForm({ ...wsForm, smtpHost: e.target.value })} className="input" placeholder="smtp.mailgun.org" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Port</label>
                        <input type="number" value={wsForm.smtpPort} onChange={(e) => setWsForm({ ...wsForm, smtpPort: e.target.value })} className="input" placeholder="587" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Username</label>
                        <input type="text" value={wsForm.smtpUsername} onChange={(e) => setWsForm({ ...wsForm, smtpUsername: e.target.value })} className="input" />
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <label style={{ fontSize: "12px", color: "var(--text-secondary)" }}>Password</label>
                        <input type="password" value={wsForm.smtpPassword} onChange={(e) => setWsForm({ ...wsForm, smtpPassword: e.target.value })} className="input" />
                      </div>
                    </div>
                  )}
                </div>

                <button type="submit" disabled={wsLoading} className="btn btn-primary" style={{ alignSelf: "flex-start" }}>
                  {wsLoading ? "Saving..." : "Save Configuration"}
                </button>
              </form>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
