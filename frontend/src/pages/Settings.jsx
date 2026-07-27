import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { updateUser } from "../services/userServices";
import { getCreatorProfile, updateCreatorProfile } from "../services/marketplaceServices";
import {
  User, Palette, Save, Building2, Globe, Mail,
  AlertTriangle, CheckCircle, Sparkles, ChevronRight
} from "lucide-react";
import toast from "react-hot-toast";
import DomainVerificationWizard from "../components/ui/DomainVerificationWizard";
import SmtpSetupWizard from "../components/ui/SmtpSetupWizard";
import "./Settings.css";

const TABS = [
  {
    id: "profile",
    label: "My Profile",
    icon: User,
    description: "Your name and avatar"
  },
  {
    id: "organization",
    label: "Organization",
    icon: Building2,
    description: "Domain verification"
  },
  {
    id: "workspace",
    label: "Workspace",
    icon: Palette,
    description: "Branding & email setup"
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: Sparkles,
    description: "Creator profile"
  },
];

export default function Settings() {
  const { user } = useAuth();
  const { selectedOrg, deleteOrganization } = useOrg();
  const { selectedWorkspace, updateCurrentWorkspace } = useWorkspace();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get("tab") || "profile";
  const [activeTab, setActiveTab] = useState(tabParam);

  /* Profile state */
  const [profile, setProfile] = useState({ firstName: "", lastName: "", avatarUrl: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileDirty, setProfileDirty] = useState(false);

  /* Workspace state */
  const [wsForm, setWsForm] = useState({ name: "", customDomain: "", primaryColor: "#6366f1", logo: "" });
  const [wsSaving, setWsSaving] = useState(false);
  const [wsDirty, setWsDirty] = useState(false);

  /* Marketplace Creator state */
  const [creatorForm, setCreatorForm] = useState({ bio: "", websiteUrl: "", organization: "" });
  const [creatorStats, setCreatorStats] = useState({ totalViews: 0, totalDownloads: 0, totalCopies: 0 });
  const [creatorLoading, setCreatorLoading] = useState(false);
  const [creatorSaving, setCreatorSaving] = useState(false);

  useEffect(() => {
    if (tabParam && TABS.map(t => t.id).includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (activeTab === "marketplace" && user) {
      setCreatorLoading(true);
      getCreatorProfile()
        .then((res) => {
          if (res.success && res.profile) {
            setCreatorForm({
              bio: res.profile.bio || "",
              websiteUrl: res.profile.websiteUrl || "",
              organization: res.profile.organization || "",
            });
            setCreatorStats({
              totalViews: res.profile.totalViews || 0,
              totalDownloads: res.profile.totalDownloads || 0,
              totalCopies: res.profile.totalCopies || 0,
            });
          }
        })
        .finally(() => setCreatorLoading(false));
    }
  }, [activeTab, user]);

  const handleSaveCreator = async (e) => {
    e.preventDefault();
    setCreatorSaving(true);
    try {
      await updateCreatorProfile(creatorForm);
      toast.success("Marketplace profile saved!");
    } catch (err) {
      toast.error("Failed to save marketplace profile");
    } finally {
      setCreatorSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfile({ firstName: user.firstName || "", lastName: user.lastName || "", avatarUrl: user.avatarUrl || "" });
      setProfileDirty(false);
    }
  }, [user]);

  useEffect(() => {
    if (selectedWorkspace) {
      setWsForm({
        name: selectedWorkspace.name || "",
        customDomain: selectedWorkspace.customDomain || "",
        primaryColor: selectedWorkspace.brandingSettings?.primaryColor || "#6366f1",
        logo: selectedWorkspace.brandingSettings?.logo || ""
      });
      setWsDirty(false);
    }
  }, [selectedWorkspace]);

  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (profileDirty || wsDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [profileDirty, wsDirty]);

  const handleTabSwitch = (tab) => {
    if ((profileDirty || wsDirty) && !window.confirm("You have unsaved changes. Discard and switch?")) return;
    setProfileDirty(false);
    setWsDirty(false);
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.firstName.trim()) { toast.error("First name is required."); return; }
    setProfileSaving(true);
    try {
      await updateUser(profile.firstName, profile.lastName, profile.avatarUrl);
      toast.success("Profile saved");
      setProfileDirty(false);
    } catch (err) {
      toast.error(err.message || "Failed to save profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!wsForm.name.trim()) { toast.error("Workspace name is required."); return; }
    setWsSaving(true);
    try {
      await updateCurrentWorkspace(selectedOrg?.id, selectedWorkspace.id, {
        name: wsForm.name,
        customDomain: wsForm.customDomain || null,
        brandingSettings: { primaryColor: wsForm.primaryColor, logo: wsForm.logo }
      });
      toast.success("Workspace saved");
      setWsDirty(false);
    } catch (err) {
      toast.error(err.message || "Failed to save workspace");
    } finally {
      setWsSaving(false);
    }
  };

  const handleSaveSmtpSettings = async (smtpData) => {
    if (!selectedWorkspace?.id || !selectedOrg?.id) throw new Error("Workspace context is missing");
    await updateCurrentWorkspace(selectedOrg.id, selectedWorkspace.id, smtpData);
  };

  const activeTabDef = TABS.find(t => t.id === activeTab);

  return (
    <div className="page-container settings-root">

      {/* Page header */}
      <div className="settings-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your profile, workspace, and email delivery.</p>
      </div>

      <div className="settings-layout">

        {/* ── Left: Tab sidebar ── */}
        <aside className="settings-sidebar">
          <nav className="settings-nav">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasDot = (tab.id === "profile" && profileDirty) || (tab.id === "workspace" && wsDirty);
              return (
                <button
                  key={tab.id}
                  className={`settings-nav-item ${isActive ? "active" : ""}`}
                  onClick={() => handleTabSwitch(tab.id)}
                >
                  <div className="settings-nav-icon">
                    <Icon size={16} />
                  </div>
                  <div className="settings-nav-text">
                    <span className="settings-nav-label">
                      {tab.label}
                      {hasDot && <span className="settings-nav-dot" title="Unsaved changes" />}
                    </span>
                    <span className="settings-nav-desc">{tab.description}</span>
                  </div>
                  {isActive && <ChevronRight size={14} className="settings-nav-chevron" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* ── Right: Content panel ── */}
        <div className="settings-content">

          {/* ── Profile tab ── */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="settings-panel">
              <div className="settings-panel-header">
                <h2 className="settings-panel-title">My Profile</h2>
                <p className="settings-panel-desc">Your name and avatar shown across the platform.</p>
              </div>

              <div className="settings-fields">
                <div className="settings-field-row">
                  <div className="settings-field">
                    <label className="settings-label">First Name <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="input"
                      value={profile.firstName}
                      onChange={e => { setProfile({ ...profile, firstName: e.target.value }); setProfileDirty(true); }}
                      placeholder="Jane"
                      required
                    />
                  </div>
                  <div className="settings-field">
                    <label className="settings-label">Last Name</label>
                    <input
                      type="text"
                      className="input"
                      value={profile.lastName}
                      onChange={e => { setProfile({ ...profile, lastName: e.target.value }); setProfileDirty(true); }}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div className="settings-field">
                  <label className="settings-label">Avatar URL</label>
                  <input
                    type="url"
                    className="input font-mono"
                    placeholder="https://example.com/photo.png"
                    value={profile.avatarUrl}
                    onChange={e => { setProfile({ ...profile, avatarUrl: e.target.value }); setProfileDirty(true); }}
                  />
                  <span className="settings-hint">Link to a profile photo (JPG, PNG, WebP)</span>
                </div>
              </div>

              <div className="settings-panel-footer">
                {profileDirty && (
                  <span className="settings-dirty-warn">
                    <AlertTriangle size={13} /> Unsaved changes
                  </span>
                )}
                <button type="submit" className="btn btn-primary" disabled={profileSaving || !profileDirty}>
                  <Save size={14} />
                  {profileSaving ? "Saving…" : "Save Profile"}
                </button>
              </div>
            </form>
          )}

          {/* ── Organization tab ── */}
          {activeTab === "organization" && (
            <div className="settings-panel">
              <div className="settings-panel-header">
                <div className="settings-panel-title-row">
                  <h2 className="settings-panel-title">Organization & Domain</h2>
                  <span className={`badge ${selectedOrg?.isVerified ? "badge-success" : "badge-warning"}`}>
                    {selectedOrg?.isVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
                <p className="settings-panel-desc">
                  Verify your domain so certificates show a trusted company badge.
                </p>
              </div>

              {selectedOrg ? (
                <DomainVerificationWizard orgId={selectedOrg?.id} orgData={selectedOrg} />
              ) : (
                <div className="settings-empty">No organization selected.</div>
              )}
            </div>
          )}

          {/* ── Workspace tab ── */}
          {activeTab === "workspace" && (
            <div className="settings-panel-stack">
              {selectedWorkspace ? (
                <>
                  {/* Branding form */}
                  <form onSubmit={handleSaveWorkspace} className="settings-panel">
                    <div className="settings-panel-header">
                      <h2 className="settings-panel-title">Workspace Settings</h2>
                      <p className="settings-panel-desc">Change the name, brand color, and custom domain for this workspace.</p>
                    </div>

                    <div className="settings-fields">
                      <div className="settings-field">
                        <label className="settings-label">Workspace Name <span className="text-danger">*</span></label>
                        <input
                          type="text"
                          className="input"
                          value={wsForm.name}
                          onChange={e => { setWsForm({ ...wsForm, name: e.target.value }); setWsDirty(true); }}
                          placeholder="My Company Certificates"
                          required
                        />
                      </div>

                      <div className="settings-field-row">
                        <div className="settings-field">
                          <label className="settings-label">Brand Color</label>
                          <div className="settings-color-row">
                            <input
                              type="color"
                              className="settings-color-swatch"
                              value={wsForm.primaryColor}
                              onChange={e => { setWsForm({ ...wsForm, primaryColor: e.target.value }); setWsDirty(true); }}
                            />
                            <input
                              type="text"
                              className="input font-mono"
                              style={{ textTransform: "uppercase" }}
                              value={wsForm.primaryColor}
                              onChange={e => { setWsForm({ ...wsForm, primaryColor: e.target.value }); setWsDirty(true); }}
                            />
                          </div>
                          <span className="settings-hint">Used as the accent color on certificates and emails</span>
                        </div>

                        <div className="settings-field">
                          <label className="settings-label">Custom Domain</label>
                          <input
                            type="text"
                            className="input font-mono"
                            placeholder="certs.yourcompany.com"
                            value={wsForm.customDomain}
                            onChange={e => { setWsForm({ ...wsForm, customDomain: e.target.value }); setWsDirty(true); }}
                          />
                          <span className="settings-hint">Where certificate verification links point to</span>
                        </div>
                      </div>
                    </div>

                    <div className="settings-panel-footer">
                      {wsDirty && (
                        <span className="settings-dirty-warn">
                          <AlertTriangle size={13} /> Unsaved changes
                        </span>
                      )}
                      <button type="submit" className="btn btn-primary" disabled={wsSaving || !wsDirty}>
                        <Save size={14} />
                        {wsSaving ? "Saving…" : "Save Changes"}
                      </button>
                    </div>
                  </form>

                  {/* SMTP Email Setup */}
                  <div className="settings-panel">
                    <div className="settings-panel-header">
                      <h2 className="settings-panel-title">Email Delivery (SMTP)</h2>
                      <p className="settings-panel-desc">
                        Connect your own email provider so certificates are sent from your domain.
                      </p>
                    </div>
                    <SmtpSetupWizard
                      workspace={selectedWorkspace}
                      workspaceId={selectedWorkspace?.id}
                      orgId={selectedOrg?.id}
                      onSave={handleSaveSmtpSettings}
                    />
                  </div>
                </>
              ) : (
                <div className="settings-panel">
                  <div className="settings-empty">No workspace selected.</div>
                </div>
              )}
            </div>
          )}

          {/* ── Marketplace tab ── */}
          {activeTab === "marketplace" && (
            <div className="settings-panel-stack">
              {/* Stats */}
              <div className="settings-panel">
                <div className="settings-panel-header">
                  <h2 className="settings-panel-title">Your Marketplace Stats</h2>
                  <p className="settings-panel-desc">How your published templates are performing in the community.</p>
                </div>
                <div className="settings-stats-grid">
                  <div className="settings-stat">
                    <span className="settings-stat-value">{creatorStats.totalViews}</span>
                    <span className="settings-stat-label">Total Views</span>
                  </div>
                  <div className="settings-stat">
                    <span className="settings-stat-value">{creatorStats.totalCopies}</span>
                    <span className="settings-stat-label">Templates Copied</span>
                  </div>
                  <div className="settings-stat">
                    <span className="settings-stat-value">{creatorStats.totalDownloads}</span>
                    <span className="settings-stat-label">Downloads</span>
                  </div>
                </div>
              </div>

              {/* Creator form */}
              <form onSubmit={handleSaveCreator} className="settings-panel">
                <div className="settings-panel-header">
                  <h2 className="settings-panel-title">Public Creator Profile</h2>
                  <p className="settings-panel-desc">
                    This is what the community sees on your template pages.
                  </p>
                </div>

                {creatorLoading ? (
                  <div className="settings-empty">Loading…</div>
                ) : (
                  <div className="settings-fields">
                    <div className="settings-field">
                      <label className="settings-label">Studio / Organization Name</label>
                      <input
                        type="text"
                        className="input"
                        value={creatorForm.organization}
                        onChange={(e) => setCreatorForm({ ...creatorForm, organization: e.target.value })}
                        placeholder="e.g. Acme Design Studio"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Bio</label>
                      <textarea
                        rows={3}
                        className="input"
                        style={{ minHeight: 80, resize: "vertical" }}
                        value={creatorForm.bio}
                        onChange={(e) => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                        placeholder="Tell the community a little about yourself…"
                      />
                    </div>

                    <div className="settings-field">
                      <label className="settings-label">Website URL</label>
                      <input
                        type="url"
                        className="input font-mono"
                        value={creatorForm.websiteUrl}
                        onChange={(e) => setCreatorForm({ ...creatorForm, websiteUrl: e.target.value })}
                        placeholder="https://yourwebsite.com"
                      />
                    </div>
                  </div>
                )}

                <div className="settings-panel-footer">
                  <button type="submit" disabled={creatorSaving || creatorLoading} className="btn btn-primary">
                    <Save size={14} />
                    {creatorSaving ? "Saving…" : "Save Profile"}
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
