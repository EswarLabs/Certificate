import { useState } from "react";
import useSWR from "swr";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listCredentials } from "../services/credentialServices";
import { listTemplates } from "../services/templateServices";
import { listJobs } from "../services/jobServices";
import { listPublicTemplates } from "../services/marketplaceServices";
import EmptyState from "../components/ui/EmptyState";
import {
  FileText, GraduationCap, Settings2, ArrowRight, PlusCircle,
  Activity, Globe, Mail, CheckCircle, Circle, Sparkles,
  Building2, Folder, ChevronRight, AlertTriangle, ShieldCheck,
  HardDrive, Users, Clock, ExternalLink, RefreshCw, Heart, Download, Eye, Layers
} from "lucide-react";
import "./Dashboard.css";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const { data, isLoading, error, mutate } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id
      ? ['dashboard-home', selectedOrg.id, selectedWorkspace.id]
      : null,
    async ([_, orgId, wsId]) => {
      const [credRes, tempRes, jobRes, trendingRes] = await Promise.all([
        listCredentials(orgId, wsId, 1, 6),
        listTemplates(orgId, wsId, 1, 4),
        listJobs(orgId, wsId, 1, 3),
        listPublicTemplates({ sort: "trending", limit: 3 }).catch(() => ({ templates: [] })),
      ]);
      return { credRes, tempRes, jobRes, trendingRes };
    }
  );

  const loading = isLoading && !data;
  const recentCreds = data?.credRes?.credentials || [];
  const recentTemps = data?.tempRes?.templates || [];
  const recentJobs = data?.jobRes?.jobs || [];
  const trendingTemplates = data?.trendingRes?.templates || [];

  const totalCreds = data?.credRes?.total || 14;
  const totalTemps = data?.tempRes?.total || 2;
  const pendingJobs = recentJobs.filter(j => j.status === 'PENDING' || j.status === 'PROCESSING');
  const failedJobs = recentJobs.filter(j => j.status === 'FAILED');

  /* ── Setup Onboarding Milestone Tracker ── */
  const setupItems = [
    { id: "org", label: "Create Organization", done: !!selectedOrg, link: "/organizations" },
    { id: "workspace", label: "Create Workspace", done: !!selectedWorkspace, link: "/workspaces" },
    { id: "domain", label: "Verify Domain DNS", done: Boolean(selectedOrg?.isVerified || selectedWorkspace?.customDomain), link: "/settings?tab=organization" },
    { id: "smtp", label: "Configure Email Provider (SMTP)", done: Boolean(selectedWorkspace?.smtpEnabled || selectedWorkspace?.smtpConfig?.host), link: "/settings?tab=workspace" },
    { id: "template", label: "Design Certificate Template", done: totalTemps > 0, link: "/templates/create" },
    { id: "credential", label: "Issue First Credential", done: totalCreds > 0, link: "/credentials/create" },
  ];
  const completedSetupCount = setupItems.filter(i => i.done).length;
  const setupPct = Math.round((completedSetupCount / setupItems.length) * 100);
  const showSetupBanner = setupPct < 100;

  /* ── Health Status Indicators ── */
  const isVerified = Boolean(selectedOrg?.isVerified || selectedWorkspace?.customDomain);
  const hasSmtp = Boolean(selectedWorkspace?.smtpEnabled || selectedWorkspace?.smtpConfig?.host);
  const firstName = user?.firstName || user?.email?.split('@')[0] || "User";

  const statusBadge = (status) => {
    const map = {
      ISSUED: "badge badge-success",
      DRAFT: "badge badge-warning",
      REVOKED: "badge badge-danger",
    };
    return <span className={map[status] || "badge badge-neutral"}>{status}</span>;
  };

  /* ── No workspace selected fallback ── */
  if (!selectedWorkspace) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Welcome back, {firstName}</h1>
            <p className="page-subtitle">Select or create a workspace to access executive dashboards.</p>
          </div>
        </div>

        <EmptyState
          icon={Folder}
          title="No Workspace Selected"
          description={!selectedOrg ? "Create your organization first to initialize your workspace hierarchy." : "Choose an active workspace from the top sidebar switcher to continue."}
          actionLabel={!selectedOrg ? "Create Organization" : "Manage Workspaces"}
          actionPath={!selectedOrg ? "/organizations" : "/workspaces"}
        />
      </div>
    );
  }

  return (
    <div className="page-container dash-home">
      {/* Executive Welcome Banner */}
      <div className="dash-hero">
        <div className="dash-hero-content">
          <h1 className="dash-welcome-title">Welcome back, {firstName}</h1>
          <p className="dash-welcome-sub">
            <span>Active workspace: <strong>{selectedWorkspace.name}</strong></span>
            <span className="dash-dot-sep">•</span>
            <span className="dash-time-indicator"><Clock size={12} /> {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span>
          </p>
        </div>

        <div className="dash-quick-cta">
          <Link to="/credentials/create" className="btn btn-primary">
            <PlusCircle size={15} />
            <span>Issue Credential</span>
          </Link>
          <Link to="/credentials/batch" className="btn btn-secondary">
            <Activity size={15} />
            <span>Batch Import</span>
          </Link>
        </div>
      </div>

      {/* Onboarding Milestone Progress Card (Linear Vibe) */}
      {showSetupBanner && (
        <div className="dash-onboarding-card" role="region" aria-label="Setup Checklist">
          <div className="dash-onb-header">
            <div className="dash-onb-title-wrap">
              <Sparkles size={18} className="text-brand" />
              <div>
                <h3 className="dash-onb-title">Continue where you left off</h3>
                <p className="dash-onb-sub">Complete your workspace onboarding to unlock full production verification.</p>
              </div>
            </div>
            <div className="dash-onb-pct-badge">{setupPct}% Done</div>
          </div>

          <div className="dash-onb-progress-wrap">
            <div className="dash-onb-progress-bar" style={{ width: `${setupPct}%` }} />
          </div>

          <div className="dash-onb-steps-grid">
            {setupItems.map((step, sIdx) => (
              <Link key={step.id} to={step.link} className={`dash-onb-step ${step.done ? 'completed' : 'pending'}`}>
                <div className="dash-step-num">
                  {step.done ? <CheckCircle size={16} className="text-success" /> : <span>{sIdx + 1}</span>}
                </div>
                <span className="dash-step-label">{step.label}</span>
                {!step.done && <ChevronRight size={14} className="dash-step-arrow" />}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Executive Metrics & Quota Grid */}
      <div className="dash-metrics-grid">
        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-label">Credentials Issued</span>
            <GraduationCap size={16} className="text-tertiary" />
          </div>
          <div className="dash-metric-val">{loading ? <div className="skeleton-shimmer dt-skel-line" style={{ width: 60 }} /> : totalCreds}</div>
          <div className="dash-metric-foot">
            <span className="text-success font-semibold">Usage: {totalCreds} / 1000 limit</span>
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-label">Domain Verification</span>
            <ShieldCheck size={16} className={isVerified ? "text-success" : "text-warning"} />
          </div>
          <div className="dash-metric-val font-medium text-base mt-1">
            {isVerified ? "Verified Active" : "DNS Record Pending"}
          </div>
          <div className="dash-metric-foot">
            <Link to="/settings?tab=organization" className="dash-card-link">
              {isVerified ? "Manage DNS" : "Verify Domain Now"} <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-label">SMTP Delivery Engine</span>
            <Mail size={16} className={hasSmtp ? "text-success" : "text-info"} />
          </div>
          <div className="dash-metric-val font-medium text-base mt-1">
            {hasSmtp ? "Custom SMTP Ready" : "System Relay Active"}
          </div>
          <div className="dash-metric-foot">
            <Link to="/settings?tab=workspace" className="dash-card-link">
              Configure Branding <ArrowRight size={11} />
            </Link>
          </div>
        </div>

        <div className="dash-metric-card">
          <div className="dash-metric-top">
            <span className="dash-metric-label">Storage & Assets</span>
            <HardDrive size={16} className="text-tertiary" />
          </div>
          <div className="dash-metric-val font-medium text-base mt-1">4.2 MB / 1 GB</div>
          <div className="dash-metric-foot">
            <Link to="/files" className="dash-card-link">Manage Assets <ArrowRight size={11} /></Link>
          </div>
        </div>
      </div>

      {/* System Attention Alerts Row */}
      {(failedJobs.length > 0 || pendingJobs.length > 0) && (
        <div className="dash-alert-strip">
          <div className="dash-alert-item warning">
            <AlertTriangle size={16} className="text-warning" />
            <span><strong>{pendingJobs.length + failedJobs.length} Batch Jobs</strong> require operator review in queue.</span>
            <Link to="/jobs" className="btn btn-secondary btn-sm ml-auto">View Queue</Link>
          </div>
        </div>
      )}

      {/* Split Feed Canvas: Recent Templates (Left) + Recent Credentials (Right) */}
      <div className="dash-split-layout">
        {/* Recent Templates Column */}
        <div className="dash-section card flat-card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-tertiary" />
              <h2 className="card-title">Recent Templates</h2>
            </div>
            <Link to="/templates" className="btn btn-ghost btn-sm">All Templates <ArrowRight size={12} /></Link>
          </div>

          <div className="dash-temp-grid">
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => <div key={i} className="skeleton-shimmer" style={{ height: 110, borderRadius: 8 }} />)
            ) : recentTemps.length === 0 ? (
              <EmptyState
                icon={FileText}
                title="No Templates Yet"
                description="Create your certificate layout template to begin issuing credentials."
                actionLabel="Create Template"
                actionPath="/templates/create"
              />
            ) : (
              recentTemps.map(temp => (
                <Link key={temp.id} to={`/templates/${temp.id}`} className="dash-temp-item">
                  <div className="dash-temp-preview" style={{ overflow: "hidden" }}>
                    {temp.thumbnailUrl ? (
                      <img src={temp.thumbnailUrl} alt={temp.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "4px" }} />
                    ) : (
                      <FileText size={24} className="text-tertiary" />
                    )}
                  </div>
                  <div className="dash-temp-body">
                    <div className="dash-temp-name">{temp.name}</div>
                    <div className="dash-temp-desc">{temp.description || "Certificate layout"}</div>
                  </div>
                  <ExternalLink size={12} className="dash-temp-ext" />
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Credentials Feed Column */}
        <div className="dash-section card flat-card">
          <div className="card-header">
            <div className="flex items-center gap-2">
              <GraduationCap size={16} className="text-tertiary" />
              <h2 className="card-title">Recent Credentials Feed</h2>
            </div>
            <Link to="/credentials" className="btn btn-ghost btn-sm">All Credentials <ArrowRight size={12} /></Link>
          </div>

          <div className="dash-cred-feed">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton-shimmer" style={{ height: 50, borderRadius: 6, marginBottom: 8 }} />)
            ) : recentCreds.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="No Credentials Issued"
                description="Issue your first certificate to see activity tracking."
                actionLabel="Issue Credential"
                actionPath="/credentials/create"
              />
            ) : (
              recentCreds.map(cred => (
                <div key={cred.id} className="dash-cred-row">
                  <div className="dash-cred-avatar">
                    {cred.recipientName?.charAt(0) || "C"}
                  </div>
                  <div className="dash-cred-info">
                    <Link to={`/credentials/${cred.id}`} className="dash-cred-recipient">
                      {cred.recipientName}
                    </Link>
                    <div className="dash-cred-meta">
                      <span>{cred.template?.name || "Certificate"}</span>
                      <span>•</span>
                      <span>{new Date(cred.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="dash-cred-status">
                    {statusBadge(cred.status)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Trending in Community Marketplace */}
      <div className="dash-trending-section">
        <div className="dash-trending-header">
          <div className="dash-trending-title-wrap">
            <div className="dash-trending-icon">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="dash-trending-title">Trending in Marketplace</h2>
              <p className="dash-trending-sub">Discover top-performing certificate layouts created by global designers</p>
            </div>
          </div>
          <Link to="/marketplace" className="dash-trending-cta">
            Explore Marketplace <ArrowRight size={14} />
          </Link>
        </div>

        {trendingTemplates.length === 0 ? (
          <div className="dash-trending-empty">
            No trending community templates yet. Be the first to publish one!
          </div>
        ) : (
          <div className="dash-trending-grid">
            {trendingTemplates.map((item) => (
              <Link
                key={item.id}
                to={`/marketplace/${item.id}`}
                className="dash-trending-card"
              >
                <div>
                  <div className="dash-trending-thumb">
                    {item.thumbnailUrl ? (
                      <img src={item.thumbnailUrl} alt={item.title} />
                    ) : (
                      <Layers size={32} className="text-tertiary" />
                    )}
                    <span className="dash-trending-industry">
                      {item.industry || "General"}
                    </span>
                  </div>
                  <h3 className="dash-trending-card-title">{item.title}</h3>
                  <p className="dash-trending-card-desc">
                    {item.description || "Professional credential template"}
                  </p>
                </div>

                <div className="dash-trending-card-footer">
                  <span className="dash-trending-card-creator">
                    {item.creator?.organization || item.creator?.user?.firstName || "Community Creator"}
                  </span>
                  <div className="dash-trending-card-stats">
                    <span className="dash-trending-stat"><Download size={12} className="text-brand" /> {item.copiesCount || 0}</span>
                    <span className="dash-trending-stat"><Heart size={12} className="text-danger" /> {item.likesCount || 0}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
