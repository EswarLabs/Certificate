import { useState, useEffect } from "react";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { updateUser, getUserById } from "../services/userServices";
import { updateWorkspace as updateWsApi } from "../services/workspaceServices";

export default function Settings() {
  const { user } = useAuth();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace, updateCurrentWorkspace } = useWorkspace();

  // Profile state
  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    avatarUrl: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

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
  const [wsMsg, setWsMsg] = useState(null);

  // Populate profile
  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        avatarUrl: user.avatarUrl || "",
      });
    }
  }, [user]);

  // Populate workspace settings
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
    setProfileMsg(null);
    try {
      const res = await updateUser(user.id, profile);
      if (res.id) {
        setProfileMsg("Profile updated successfully");
      } else {
        setProfileMsg(res.message || "Update failed");
      }
    } catch (err) {
      setProfileMsg(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleWsUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setWsLoading(true);
    setWsMsg(null);
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
      setWsMsg("Workspace updated successfully");
    } catch (err) {
      setWsMsg(err.message);
    } finally {
      setWsLoading(false);
    }
  };

  return (
    <div>
      <h1>Settings</h1>

      {/* Profile Section */}
      <section style={{ marginBottom: "32px" }}>
        <h2>Profile</h2>
        {profileMsg && <p style={{ color: profileMsg.includes("success") ? "green" : "red" }}>{profileMsg}</p>}
        <form onSubmit={handleProfileUpdate} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "400px" }}>
          <label>
            Email
            <input type="text" value={user?.email || ""} disabled style={{ display: "block", width: "100%" }} />
          </label>
          <label>
            First Name
            <input type="text" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} style={{ display: "block", width: "100%" }} />
          </label>
          <label>
            Last Name
            <input type="text" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} style={{ display: "block", width: "100%" }} />
          </label>
          <label>
            Avatar URL
            <input type="url" value={profile.avatarUrl} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })} style={{ display: "block", width: "100%" }} />
          </label>
          {profile.avatarUrl && <img src={profile.avatarUrl} alt="Avatar" style={{ width: "64px", height: "64px", borderRadius: "50%" }} />}
          <button type="submit" disabled={profileLoading}>{profileLoading ? "Saving..." : "Update Profile"}</button>
        </form>
      </section>

      {/* Workspace Settings Section */}
      {selectedWorkspace && (
        <section>
          <h2>Workspace Settings — {selectedWorkspace.name}</h2>
          {wsMsg && <p style={{ color: wsMsg.includes("success") ? "green" : "red" }}>{wsMsg}</p>}
          <form onSubmit={handleWsUpdate} style={{ display: "flex", flexDirection: "column", gap: "12px", maxWidth: "500px" }}>
            <label>
              Workspace Name
              <input type="text" value={wsForm.name} onChange={(e) => setWsForm({ ...wsForm, name: e.target.value })} style={{ display: "block", width: "100%" }} />
            </label>
            <label>
              Custom Domain
              <input type="text" value={wsForm.customDomain} onChange={(e) => setWsForm({ ...wsForm, customDomain: e.target.value })} placeholder="certs.yourdomain.com" style={{ display: "block", width: "100%" }} />
            </label>

            {/* Branding */}
            <fieldset style={{ border: "1px solid #e5e7eb", padding: "12px", borderRadius: "8px" }}>
              <legend>Branding</legend>
              <label>
                Primary Color
                <input type="color" value={wsForm.brandingPrimaryColor || "#000000"} onChange={(e) => setWsForm({ ...wsForm, brandingPrimaryColor: e.target.value })} style={{ display: "block" }} />
              </label>
              <label>
                Logo URL
                <input type="url" value={wsForm.brandingLogo} onChange={(e) => setWsForm({ ...wsForm, brandingLogo: e.target.value })} style={{ display: "block", width: "100%" }} />
              </label>
            </fieldset>

            {/* SMTP */}
            <fieldset style={{ border: "1px solid #e5e7eb", padding: "12px", borderRadius: "8px" }}>
              <legend>SMTP Settings</legend>
              <label>
                <input type="checkbox" checked={wsForm.smtpEnabled} onChange={(e) => setWsForm({ ...wsForm, smtpEnabled: e.target.checked })} />
                Enable SMTP
              </label>
              {wsForm.smtpEnabled && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "8px" }}>
                  <label>
                    Host
                    <input type="text" value={wsForm.smtpHost} onChange={(e) => setWsForm({ ...wsForm, smtpHost: e.target.value })} placeholder="smtp.mailgun.org" style={{ display: "block", width: "100%" }} />
                  </label>
                  <label>
                    Port
                    <input type="number" value={wsForm.smtpPort} onChange={(e) => setWsForm({ ...wsForm, smtpPort: e.target.value })} placeholder="587" style={{ display: "block", width: "100%" }} />
                  </label>
                  <label>
                    Username
                    <input type="text" value={wsForm.smtpUsername} onChange={(e) => setWsForm({ ...wsForm, smtpUsername: e.target.value })} style={{ display: "block", width: "100%" }} />
                  </label>
                  <label>
                    Password
                    <input type="password" value={wsForm.smtpPassword} onChange={(e) => setWsForm({ ...wsForm, smtpPassword: e.target.value })} style={{ display: "block", width: "100%" }} />
                  </label>
                </div>
              )}
            </fieldset>

            <button type="submit" disabled={wsLoading}>{wsLoading ? "Saving..." : "Update Workspace"}</button>
          </form>
        </section>
      )}
    </div>
  );
}
