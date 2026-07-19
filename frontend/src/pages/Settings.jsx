import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { updateUser } from "../services/userServices";
import { getCreatorProfile, updateCreatorProfile } from "../services/marketplaceServices";
import { User, Palette, Save, Building2, ShieldCheck, AlertTriangle, Globe, Mail, CheckCircle, RefreshCw, HardDrive, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import DomainVerificationWizard from "../components/ui/DomainVerificationWizard";
import SmtpSetupWizard from "../components/ui/SmtpSetupWizard";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";

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
    if (tabParam && ["profile", "organization", "workspace", "marketplace"].includes(tabParam)) {
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
      toast.success("Creator Marketplace Profile updated! ✨");
    } catch (err) {
      toast.error("Failed to update creator profile");
    } finally {
      setCreatorSaving(false);
    }
  };

  useEffect(() => {
    if (user) {
      setProfile({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        avatarUrl: user.avatarUrl || ""
      });
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

  /* ── Unsaved changes browser guard ── */
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (profileDirty || wsDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [profileDirty, wsDirty]);

  const handleTabSwitch = (tab) => {
    if ((profileDirty || wsDirty) && !window.confirm("You have unsaved changes. Discard changes and switch tabs?")) {
      return;
    }
    setProfileDirty(false);
    setWsDirty(false);
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!profile.firstName.trim()) {
      toast.error("First name is required.");
      return;
    }
    setProfileSaving(true);
    try {
      await updateUser(profile.firstName, profile.lastName, profile.avatarUrl);
      toast.success("Profile saved successfully");
      setProfileDirty(false);
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveWorkspace = async (e) => {
    e.preventDefault();
    if (!wsForm.name.trim()) {
      toast.error("Workspace name is required.");
      return;
    }
    setWsSaving(true);
    try {
      await updateCurrentWorkspace(selectedWorkspace.id, {
        name: wsForm.name,
        customDomain: wsForm.customDomain || null,
        brandingSettings: {
          primaryColor: wsForm.primaryColor,
          logo: wsForm.logo
        }
      });
      toast.success("Workspace configuration updated");
      setWsDirty(false);
    } catch (err) {
      toast.error(err.message || "Workspace save failed");
    } finally {
      setWsSaving(false);
    }
  };

  return (
    <div className="page-container flex flex-col gap-6 max-w-5xl">
      <div className="page-header mb-0">
        <div>
          <h1 className="page-title">Enterprise Settings</h1>
          <p className="page-subtitle">Manage account security, DNS domain verification, and custom email delivery.</p>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-color gap-8">
        <button
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'profile' ? 'border-brand text-brand' : 'border-transparent text-secondary hover:text-primary'}`}
          onClick={() => handleTabSwitch('profile')}
        >
          <User size={16} />
          <span>Personal Profile</span>
          {profileDirty && <span className="w-2 h-2 rounded-full bg-warning inline-block ml-1" title="Unsaved changes" />}
        </button>

        <button
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'organization' ? 'border-brand text-brand' : 'border-transparent text-secondary hover:text-primary'}`}
          onClick={() => handleTabSwitch('organization')}
        >
          <Building2 size={16} />
          <span>Organization & Domain</span>
        </button>

        <button
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'workspace' ? 'border-brand text-brand' : 'border-transparent text-secondary hover:text-primary'}`}
          onClick={() => handleTabSwitch('workspace')}
        >
          <Mail size={16} />
          <span>Workspace & SMTP</span>
          {wsDirty && <span className="w-2 h-2 rounded-full bg-warning inline-block ml-1" title="Unsaved changes" />}
        </button>

        <button
          className={`pb-3 font-semibold text-sm flex items-center gap-2 border-b-2 transition-all ${activeTab === 'marketplace' ? 'border-brand text-brand' : 'border-transparent text-secondary hover:text-primary'}`}
          onClick={() => handleTabSwitch('marketplace')}
        >
          <Sparkles size={16} className="text-brand" />
          <span>Community Publisher</span>
        </button>
      </div>

      {/* Tab 1: Personal Profile */}
      {activeTab === "profile" && (
        <form onSubmit={handleSaveProfile} className="card flat-card p-6 flex flex-col gap-6 max-w-2xl">
          <div className="border-b pb-4">
            <h3 className="font-bold text-base text-primary">Personal Account Profile</h3>
            <p className="text-xs text-secondary mt-1">Your identity displayed across workspace audit trails and notifications.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary">First Name <span className="text-danger">*</span></label>
              <input
                type="text"
                className="st-select h-10 w-full"
                value={profile.firstName}
                onChange={e => { setProfile({ ...profile, firstName: e.target.value }); setProfileDirty(true); }}
                required
              />
              <span className="text-xs text-tertiary">Used in executive welcome banners.</span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-primary">Last Name</label>
              <input
                type="text"
                className="st-select h-10 w-full"
                value={profile.lastName}
                onChange={e => { setProfile({ ...profile, lastName: e.target.value }); setProfileDirty(true); }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-primary">Avatar URL</label>
            <input
              type="url"
              className="st-select h-10 w-full font-mono text-xs"
              placeholder="https://example.com/avatar.png"
              value={profile.avatarUrl}
              onChange={e => { setProfile({ ...profile, avatarUrl: e.target.value }); setProfileDirty(true); }}
            />
          </div>

          <div className="flex items-center justify-between border-t pt-4 mt-2">
            {profileDirty ? (
              <span className="text-xs text-warning flex items-center gap-1 font-medium"><AlertTriangle size={13} /> Unsaved profile edits</span>
            ) : <span />}

            <button type="submit" className="btn btn-primary" disabled={profileSaving || !profileDirty}>
              <Save size={14} />
              <span>{profileSaving ? "Saving..." : "Save Profile"}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Organization & Domain Verification */}
      {activeTab === "organization" && (
        <div className="flex flex-col gap-6">
          <div className="card flat-card p-6">
            <div className="flex items-center justify-between border-b pb-4 mb-6">
              <div>
                <h3 className="font-bold text-base text-primary">Organization DNS Verification</h3>
                <p className="text-xs text-secondary mt-1">Configure TXT records to issue certificates under a verified company badge.</p>
              </div>
              <span className={`badge ${selectedOrg?.isVerified ? 'badge-success' : 'badge-warning'}`}>
                {selectedOrg?.isVerified ? "Verified Active" : "DNS Unverified"}
              </span>
            </div>

            {selectedOrg ? (
              <DomainVerificationWizard orgId={selectedOrg?.id} orgData={selectedOrg} />
            ) : (
              <div className="p-8 text-center text-secondary text-sm">No organization selected.</div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Workspace & SMTP Branding */}
      {activeTab === "workspace" && (
        <div className="flex flex-col gap-6">
          {selectedWorkspace ? (
            <>
              {/* Workspace General Form */}
              <form onSubmit={handleSaveWorkspace} className="card flat-card p-6 flex flex-col gap-6 max-w-2xl">
                <div className="border-b pb-4">
                  <h3 className="font-bold text-base text-primary">Workspace Branding & Settings</h3>
                  <p className="text-xs text-secondary mt-1">Configure custom certificate portals and brand color accents.</p>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-primary">Workspace Project Name <span className="text-danger">*</span></label>
                  <input
                    type="text"
                    className="st-select h-10 w-full"
                    value={wsForm.name}
                    onChange={e => { setWsForm({ ...wsForm, name: e.target.value }); setWsDirty(true); }}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-primary">Brand Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        className="h-10 w-12 rounded cursor-pointer border-0 p-0"
                        value={wsForm.primaryColor}
                        onChange={e => { setWsForm({ ...wsForm, primaryColor: e.target.value }); setWsDirty(true); }}
                      />
                      <input
                        type="text"
                        className="st-select h-10 flex-1 font-mono uppercase text-xs"
                        value={wsForm.primaryColor}
                        onChange={e => { setWsForm({ ...wsForm, primaryColor: e.target.value }); setWsDirty(true); }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-primary">Custom Verification Domain</label>
                    <input
                      type="text"
                      className="st-select h-10 w-full font-mono text-xs"
                      placeholder="certs.company.com"
                      value={wsForm.customDomain}
                      onChange={e => { setWsForm({ ...wsForm, customDomain: e.target.value }); setWsDirty(true); }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between border-t pt-4 mt-2">
                  {wsDirty ? (
                    <span className="text-xs text-warning flex items-center gap-1 font-medium"><AlertTriangle size={13} /> Unsaved workspace edits</span>
                  ) : <span />}

                  <button type="submit" className="btn btn-primary" disabled={wsSaving || !wsDirty}>
                    <Save size={14} />
                    <span>{wsSaving ? "Saving..." : "Save Workspace Configuration"}</span>
                  </button>
                </div>
              </form>

              {/* Dedicated SMTP Wizard Card */}
              <div className="card flat-card p-6 max-w-2xl">
                <div className="border-b pb-4 mb-6">
                  <h3 className="font-bold text-base text-primary">Custom SMTP Mail Server</h3>
                  <p className="text-xs text-secondary mt-1">Deliver credential verification emails directly from your own mail host.</p>
                </div>

                <SmtpSetupWizard
                  workspace={selectedWorkspace}
                  workspaceId={selectedWorkspace?.id}
                  orgId={selectedOrg?.id}
                />
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-secondary text-sm">No workspace selected.</div>
          )}
        </div>
      )}

      {/* Tab 4: Creator Marketplace Profile */}
      {activeTab === "marketplace" && (
        <div className="flex flex-col gap-8" style={{ maxWidth: 768 }}>
          {/* Creator Stats Card */}
          <div className="card" style={{ padding: 24 }}>
            <div className="flex items-center gap-3 mb-6">
              <div className="dash-trending-icon">
                <Sparkles size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>Creator Community Impact</h2>
                <p className="text-xs text-secondary mt-1">Live analytics across all your published marketplace certificate designs</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t pt-4">
              <div className="stat-card">
                <span className="stat-label">Total Views</span>
                <span className="stat-value">{creatorStats.totalViews}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Template Copies</span>
                <span className="stat-value">{creatorStats.totalCopies}</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Downloads</span>
                <span className="stat-value">{creatorStats.totalDownloads}</span>
              </div>
            </div>
          </div>

          {/* Form Card */}
          <form onSubmit={handleSaveCreator} className="card flat-card p-6 flex flex-col gap-6">
            <div className="border-b pb-4">
              <h3 className="font-bold text-base text-primary flex items-center gap-2">
                <Globe size={16} className="text-brand" /> Public Publisher Identity
              </h3>
              <p className="text-xs text-secondary mt-1">
                Customize how your name, biography, and studio appear to the global community on template preview pages.
              </p>
            </div>

            {creatorLoading ? (
              <div className="py-12 text-center text-secondary">Loading creator profile...</div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="label">Studio / Organization Display Name</label>
                  <input
                    type="text"
                    value={creatorForm.organization}
                    onChange={(e) => setCreatorForm({ ...creatorForm, organization: e.target.value })}
                    placeholder="e.g. Acme Design Studio or Open Source Credentials"
                    className="input"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="label">Creator Biography</label>
                  <textarea
                    rows={3}
                    value={creatorForm.bio}
                    onChange={(e) => setCreatorForm({ ...creatorForm, bio: e.target.value })}
                    placeholder="Tell the community about your design background, typography style, or credentialing focus..."
                    className="input"
                    style={{ minHeight: 80 }}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="label">Portfolio / Website URL</label>
                  <input
                    type="url"
                    value={creatorForm.websiteUrl}
                    onChange={(e) => setCreatorForm({ ...creatorForm, websiteUrl: e.target.value })}
                    placeholder="https://yourdesignstudio.com"
                    className="input"
                  />
                </div>
              </div>
            )}

            <div className="border-t pt-4 flex justify-end">
              <button
                type="submit"
                disabled={creatorSaving || creatorLoading}
                className="btn btn-primary"
              >
                <Save size={14} />
                <span>{creatorSaving ? "Saving Profile..." : "Save Publisher Profile"}</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
