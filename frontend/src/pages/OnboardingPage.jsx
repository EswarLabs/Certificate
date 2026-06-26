import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listTemplates } from "../services/templateServices";
import { listCredentials } from "../services/credentialServices";
import {
  ShieldCheck, Building2, Folder, Globe, Mail, Image,
  FileText, GraduationCap, Check, ChevronRight, ArrowRight,
  Sparkles, Loader2
} from "lucide-react";
import toast from "react-hot-toast";
import "../index.css";

const STEPS = [
  {
    id: "org",
    number: 1,
    icon: Building2,
    title: "Create Organization",
    desc: "An organization is your company or institution's top-level account. Everything lives under it.",
    action: "Create Organization",
    link: null, // handled inline
  },
  {
    id: "workspace",
    number: 2,
    icon: Folder,
    title: "Create Workspace",
    desc: "A workspace is a project space within your org — like 'Engineering Certs' or 'Course Certificates 2024'. You can have multiple.",
    action: "Create Workspace",
    link: null,
  },
  {
    id: "domain",
    number: 3,
    icon: Globe,
    title: "Verify Your Domain",
    desc: "Prove you own your domain so certificates show a verified badge — building trust with recipients.",
    action: "Verify Domain",
    link: "/settings?tab=organization",
    optional: true,
  },
  {
    id: "smtp",
    number: 4,
    icon: Mail,
    title: "Configure Email (SMTP)",
    desc: "Set up your email provider so certificates are delivered from your own domain, not a generic address.",
    action: "Set Up Email",
    link: "/settings?tab=workspace",
    optional: true,
  },
  {
    id: "brand",
    number: 5,
    icon: Image,
    title: "Upload Brand Assets",
    desc: "Add your logo and signature to make certificates look professional and on-brand.",
    action: "Upload Assets",
    link: "/files",
    optional: true,
  },
  {
    id: "template",
    number: 6,
    icon: FileText,
    title: "Create Certificate Template",
    desc: "Design the visual layout for your certificates. Templates define what data fields are included.",
    action: "Create Template",
    link: "/templates/create",
    optional: true,
  },
  {
    id: "credential",
    number: 7,
    icon: GraduationCap,
    title: "Issue Your First Credential",
    desc: "Send a certificate to a recipient — either manually or by uploading a CSV for bulk issuance.",
    action: "Issue Credential",
    link: "/credentials/create",
    optional: true,
  },
];

export default function OnboardingPage() {
  const { user } = useAuth();
  const { org: orgs, selectedOrg, createOrganization, listOrganization } = useOrg();
  const { workspaces, selectedWorkspace, createNewWorkspace, fetchWorkspaces } = useWorkspace();
  const navigate = useNavigate();

  const [orgName, setOrgName] = useState("");
  const [wsName, setWsName] = useState("");
  const [creatingOrg, setCreatingOrg] = useState(false);
  const [creatingWs, setCreatingWs] = useState(false);
  const [templateCount, setTemplateCount] = useState(0);
  const [credCount, setCredCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedStep, setExpandedStep] = useState(null);

  useEffect(() => {
    const init = async () => {
      await listOrganization(1, 50);
      setLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (selectedOrg?.id) fetchWorkspaces(selectedOrg.id);
  }, [selectedOrg?.id]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!selectedOrg?.id || !selectedWorkspace?.id) return;
      try {
        const [tmpl, cred] = await Promise.all([
          listTemplates(selectedOrg.id, selectedWorkspace.id, 1, 1),
          listCredentials(selectedOrg.id, selectedWorkspace.id, 1, 1),
        ]);
        setTemplateCount(tmpl.total || 0);
        setCredCount(cred.total || 0);
      } catch {}
    };
    fetchStats();
  }, [selectedOrg?.id, selectedWorkspace?.id]);

  /* ── Compute completion ── */
  const completion = {
    org: orgs.length > 0,
    workspace: workspaces.length > 0,
    domain: selectedOrg?.isVerified === true,
    smtp: selectedWorkspace?.smtpEnabled === true,
    brand: !!(selectedWorkspace?.brandingSettings?.logo),
    template: templateCount > 0,
    credential: credCount > 0,
  };

  const completedCount = Object.values(completion).filter(Boolean).length;
  const totalCount = STEPS.length;
  const percentage = Math.round((completedCount / totalCount) * 100);

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setCreatingOrg(true);
    try {
      await createOrganization({ name: orgName.trim() });
      toast.success(`Organization "${orgName.trim()}" created!`);
      await listOrganization(1, 50);
      setOrgName("");
    } catch (err) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setCreatingOrg(false);
    }
  };

  const handleCreateWs = async (e) => {
    e.preventDefault();
    if (!wsName.trim() || !selectedOrg?.id) {
      toast.error("Please create an organization first");
      return;
    }
    setCreatingWs(true);
    try {
      await createNewWorkspace(selectedOrg.id, wsName.trim());
      toast.success(`Workspace "${wsName.trim()}" created!`);
      setWsName("");
    } catch (err) {
      toast.error(err.message || "Failed to create workspace");
    } finally {
      setCreatingWs(false);
    }
  };

  if (loading) {
    return (
      <div className="onboarding-container" style={{ alignItems: "center", justifyContent: "center" }}>
        <Loader2 size={32} style={{ animation: "spin 0.7s linear infinite", color: "var(--brand-primary)" }} />
      </div>
    );
  }

  // If fully set up — redirect to dashboard
  if (percentage === 100) {
    navigate("/dashboard");
    return null;
  }

  return (
    <div className="onboarding-container">
      {/* Nav */}
      <div className="onboarding-nav">
        <div className="sidebar-logo" style={{ width: 28, height: 28 }}>
          <ShieldCheck size={14} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>CertManager</span>
        <div style={{ marginLeft: "auto", display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
            {completedCount}/{totalCount} steps complete
          </span>
          <Link to="/dashboard" className="btn btn-ghost btn-sm">
            Skip for now
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="onboarding-body">
        <div className="onboarding-panel">
          {/* Header */}
          <div className="onboarding-header">
            <div style={{ width: 56, height: 56, borderRadius: "var(--radius-xl)", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
              <Sparkles size={24} color="#fff" />
            </div>
            <h1 className="onboarding-title">
              Welcome{user?.firstName ? `, ${user.firstName}` : ""}! 👋
            </h1>
            <p className="onboarding-subtitle">
              Let's get your account set up in a few simple steps. You can skip optional steps and come back later.
            </p>
          </div>

          {/* Progress */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>Setup Progress</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--brand-primary)" }}>{percentage}%</span>
            </div>
            <div className="progress-bar-wrap">
              <div className="progress-bar-fill" style={{ width: `${percentage}%` }} />
            </div>
          </div>

          {/* Steps */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {STEPS.map((step, idx) => {
              const isDone = completion[step.id];
              const Icon = step.icon;
              const isExpanded = expandedStep === step.id;
              const isNextStep = !isDone && STEPS.slice(0, idx).every(s => completion[s.id]);

              return (
                <div
                  key={step.id}
                  style={{
                    borderBottom: idx < STEPS.length - 1 ? "1px solid var(--border-color)" : "none",
                    background: isNextStep && !isDone ? "linear-gradient(90deg, var(--brand-primary-light), transparent)" : "transparent",
                  }}
                >
                  <button
                    style={{
                      width: "100%",
                      padding: "16px 20px",
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      background: "none",
                      border: "none",
                      cursor: isDone ? "default" : "pointer",
                      textAlign: "left",
                    }}
                    onClick={() => !isDone && setExpandedStep(isExpanded ? null : step.id)}
                  >
                    {/* Circle */}
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      background: isDone ? "var(--success)" : isNextStep ? "var(--brand-primary)" : "var(--bg-secondary)",
                      border: isDone ? "none" : isNextStep ? "none" : "2px dashed var(--border-strong)",
                      transition: "all 0.2s",
                    }}>
                      {isDone
                        ? <Check size={16} color="#fff" />
                        : <Icon size={16} color={isNextStep ? "#fff" : "var(--text-tertiary)"} />
                      }
                    </div>

                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <span style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isDone ? "var(--text-tertiary)" : "var(--text-primary)",
                          textDecoration: isDone ? "line-through" : "none",
                        }}>
                          {step.title}
                        </span>
                        {isDone && <span className="badge badge-success">Done</span>}
                        {step.optional && !isDone && <span className="badge badge-neutral">Optional</span>}
                        {isNextStep && !isDone && <span className="badge badge-brand">Next step</span>}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>
                        Step {step.number} of {totalCount}
                      </div>
                    </div>

                    {!isDone && (
                      <ChevronRight
                        size={16}
                        style={{
                          color: "var(--text-tertiary)",
                          flexShrink: 0,
                          transform: isExpanded ? "rotate(90deg)" : "none",
                          transition: "transform 0.15s",
                        }}
                      />
                    )}
                  </button>

                  {/* Expanded content */}
                  {isExpanded && !isDone && (
                    <div style={{ padding: "0 20px 20px 70px" }}>
                      <p style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.6 }}>
                        {step.desc}
                      </p>

                      {/* Step 1: Inline org create */}
                      {step.id === "org" && (
                        <form onSubmit={handleCreateOrg} style={{ display: "flex", gap: 10 }}>
                          <input
                            className="input"
                            value={orgName}
                            onChange={e => setOrgName(e.target.value)}
                            placeholder="e.g. Harvard University"
                            required
                            style={{ flex: 1 }}
                          />
                          <button type="submit" className="btn btn-primary" disabled={creatingOrg || !orgName.trim()}>
                            {creatingOrg ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : "Create"}
                          </button>
                        </form>
                      )}

                      {/* Step 2: Inline workspace create */}
                      {step.id === "workspace" && (
                        completion.org ? (
                          <form onSubmit={handleCreateWs} style={{ display: "flex", gap: 10, flexDirection: "column" }}>
                            {selectedOrg && <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginBottom: 4 }}>Under: <strong>{selectedOrg.name}</strong></div>}
                            <div style={{ display: "flex", gap: 10 }}>
                              <input
                                className="input"
                                value={wsName}
                                onChange={e => setWsName(e.target.value)}
                                placeholder="e.g. Computer Science Certs 2024"
                                required
                                style={{ flex: 1 }}
                              />
                              <button type="submit" className="btn btn-primary" disabled={creatingWs || !wsName.trim()}>
                                {creatingWs ? <Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> : "Create"}
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="alert alert-warning">
                            <span>Create an organization first (Step 1).</span>
                          </div>
                        )
                      )}

                      {/* Steps 3-7: Link buttons */}
                      {step.link && (
                        <div style={{ display: "flex", gap: 10 }}>
                          <Link to={step.link} className="btn btn-primary">
                            {step.action} <ArrowRight size={14} />
                          </Link>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setExpandedStep(null)}
                          >
                            Skip for now
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer CTA */}
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <Link to="/dashboard" className="btn btn-secondary">
              Go to Dashboard <ChevronRight size={14} />
            </Link>
            <p style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 10 }}>
              You can always return to this guide from Settings.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
