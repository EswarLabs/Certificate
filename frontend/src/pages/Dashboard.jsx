import { useState } from "react";
import useSWR from "swr";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listCredentials } from "../services/credentialServices";
import { listTemplates } from "../services/templateServices";
import { listJobs } from "../services/jobServices";
import { FileText, GraduationCap, Settings2, ArrowRight, PlusCircle, Activity } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const { data, isLoading } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id
      ? ['dashboard', selectedOrg.id, selectedWorkspace.id]
      : null,
    async ([_, orgId, wsId]) => {
      const [credRes, tempRes, jobRes] = await Promise.all([
        listCredentials(orgId, wsId, 1, 5),
        listTemplates(orgId, wsId, 1, 1),
        listJobs(orgId, wsId, 1, 1),
      ]);
      return { credRes, tempRes, jobRes };
    }
  );

  const loading = isLoading && !data;
  const stats = data ? {
    credentials: data.credRes.total || 0,
    templates: data.tempRes.total || 0,
    jobs: data.jobRes.total || 0,
  } : { credentials: 0, templates: 0, jobs: 0 };
  const recentCreds = data?.credRes?.credentials || [];

  const statusBadge = (status) => {
    const map = {
      ISSUED: "badge badge-success",
      DRAFT: "badge badge-warning",
      REVOKED: "badge badge-danger",
    };
    return <span className={map[status] || "badge badge-neutral"}>{status}</span>;
  };

  if (!selectedWorkspace) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.firstName || user?.email}</p>
          </div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: "64px 24px" }}>
          <div className="empty-state">
            <Activity size={40} />
            <h3>No Workspace Selected</h3>
            <p>Select an organization and workspace from the sidebar to get started.</p>
            <Link to="/organizations" className="btn btn-primary" style={{ marginTop: 8 }}>
              Set Up Organization <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" style={{ width: 40, height: 40, borderRadius: "50%", objectFit: "cover", border: "2px solid var(--border-color)" }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
          )}
          <div>
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Welcome back, {user?.firstName || user?.email}</p>
          </div>
        </div>
        <Link to="/credentials/create" className="btn btn-primary">
          <PlusCircle size={15} /> New Credential
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div className="stat-card">
          <div className="stat-label"><GraduationCap size={14} /> Credentials</div>
          <div className="stat-value">{loading ? "—" : stats.credentials}</div>
          <Link to="/credentials" style={{ fontSize: 12, color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: 4 }}>
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label"><FileText size={14} /> Templates</div>
          <div className="stat-value">{loading ? "—" : stats.templates}</div>
          <Link to="/templates" style={{ fontSize: 12, color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: 4 }}>
            View all <ArrowRight size={11} />
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-label"><Settings2 size={14} /> Jobs Processed</div>
          <div className="stat-value">{loading ? "—" : stats.jobs}</div>
          <Link to="/jobs" style={{ fontSize: 12, color: "var(--brand-primary)", display: "flex", alignItems: "center", gap: 4 }}>
            View all <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      {/* Recent credentials */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="card-header">
          <span className="card-title">Recent Credentials</span>
          <Link to="/credentials" className="btn btn-ghost btn-sm">View all <ArrowRight size={12} /></Link>
        </div>
        {loading ? (
          <div style={{ padding: 32, textAlign: "center" }}><span className="spinner" /></div>
        ) : recentCreds.length === 0 ? (
          <div className="empty-state">
            <GraduationCap size={32} />
            <h3>No credentials yet</h3>
            <p>Create your first credential to get started.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Recipient</th>
                  <th>Template</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentCreds.map(cred => (
                  <tr key={cred.id}>
                    <td>
                      <Link to={`/credentials/${cred.id}`} style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                        {cred.recipientName}
                      </Link>
                      <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{cred.recipientEmail || "—"}</div>
                    </td>
                    <td style={{ color: "var(--text-secondary)" }}>{cred.template?.name || "—"}</td>
                    <td>{statusBadge(cred.status)}</td>
                    <td style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{new Date(cred.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
