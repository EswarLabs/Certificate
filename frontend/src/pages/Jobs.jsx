import { useState } from "react";
import useSWR from "swr";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listJobs, getJob } from "../services/jobServices";
import { RefreshCw, Eye, X, Activity, AlertCircle, ChevronRight } from "lucide-react";

const StatusBadge = ({ status }) => {
  let color, bg;
  switch (status) {
    case "PENDING":   color = "var(--warning)";      bg = "var(--warning-light)";       break;
    case "RUNNING":   color = "var(--brand-primary)"; bg = "var(--brand-primary-light)"; break;
    case "COMPLETED": color = "var(--success)";       bg = "var(--success-light)";       break;
    case "FAILED":    color = "var(--danger)";        bg = "var(--danger-light)";        break;
    default:          color = "var(--text-secondary)"; bg = "var(--bg-hover)";           break;
  }
  return (
    <span style={{ backgroundColor: bg, color, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
      {status}
    </span>
  );
};

const getStatusColor = (status) => {
  switch (status) {
    case "PENDING":   return "var(--warning)";
    case "RUNNING":   return "var(--brand-primary)";
    case "COMPLETED": return "var(--success)";
    case "FAILED":    return "var(--danger)";
    default:          return "var(--text-secondary)";
  }
};

const ProgressBar = ({ progress, status, compact = false }) => (
  <div style={{ display: "flex", alignItems: "center", gap: compact ? 6 : 12 }}>
    <div style={{ flex: 1, height: 6, backgroundColor: "var(--bg-hover)", borderRadius: 3, overflow: "hidden", minWidth: compact ? 60 : 100 }}>
      <div style={{ width: `${progress}%`, height: "100%", backgroundColor: getStatusColor(status), borderRadius: 3, transition: "width 0.3s ease" }} />
    </div>
    <span style={{ fontSize: 12, color: "var(--text-secondary)", minWidth: 32 }}>{progress}%</span>
  </div>
);

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: 14, color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}

export default function Jobs() {
  const { selectedOrg }     = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [page, setPage]         = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter]     = useState("");
  const [selectedJob, setSelectedJob]   = useState(null);
  const limit = 10;

  const { data, isLoading, mutate, error: swrError } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id
      ? ["jobs", selectedOrg.id, selectedWorkspace.id, page, statusFilter, typeFilter]
      : null,
    async ([_, orgId, wsId, p, status, type]) => {
      const res = await listJobs(orgId, wsId, p, limit, status || undefined, type || undefined);
      if (!res.success) throw new Error(res.message || "Failed to fetch jobs");
      return res;
    },
    {
      refreshInterval: (data) => {
        if (!data) return 0;
        const hasActive = data.jobs.some(j => j.status === "PENDING" || j.status === "RUNNING");
        return hasActive ? 3000 : 0;
      },
    }
  );

  const jobs    = data?.jobs  || [];
  const total   = data?.total || 0;
  const loading = isLoading && !data;
  const error   = swrError?.message || null;

  const handleViewJob = async (jobId) => {
    try {
      const res = await getJob(selectedOrg.id, selectedWorkspace.id, jobId);
      if (res.id) setSelectedJob(res);
    } catch (err) {
      alert(err.message);
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--text-secondary)" }}>Please select an organization and workspace first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 24 }}>
        <div>
          <h1 className="page-title">Background Jobs</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 4 }}>
            Monitor asynchronous tasks and batch operations
          </p>
        </div>
        <button onClick={() => mutate()} className="btn btn-secondary" disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: 12, padding: "12px 16px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", flexWrap: "wrap" }}>
          <select
            className="input"
            style={{ flex: "1 1 140px", minWidth: 0 }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select
            className="input"
            style={{ flex: "1 1 140px", minWidth: 0 }}
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Types</option>
            <option value="batch_credentials">Batch Credentials</option>
            <option value="bulk_issue">Bulk Issue</option>
          </select>
        </div>

        {error && (
          <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px 24px", fontSize: 13, fontWeight: 500, borderBottom: "1px solid var(--border-color)" }}>
            {error}
          </div>
        )}

        {/* ── Responsive table/cards ── */}
        <div className="table-responsive">
          {/* Desktop table */}
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Progress</th>
                  <th>Created</th>
                  <th style={{ width: 80, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id}>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)" }}>{job.id}</td>
                    <td style={{ fontWeight: 500 }}>{job.type}</td>
                    <td><StatusBadge status={job.status} /></td>
                    <td><ProgressBar progress={job.progress} status={job.status} /></td>
                    <td style={{ fontSize: 13, color: "var(--text-secondary)" }}>{new Date(job.createdAt).toLocaleString()}</td>
                    <td style={{ textAlign: "right" }}>
                      <button onClick={() => handleViewJob(job.id)} className="btn-icon" title="View details">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                        <Activity size={32} style={{ color: "var(--border-color)" }} />
                        <p>No jobs found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="table-card-list" style={{ padding: 12 }}>
            {jobs.length === 0 && !loading ? (
              <div style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                <Activity size={32} style={{ color: "var(--border-color)", margin: "0 auto 12px" }} />
                <p>No jobs found.</p>
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="table-card-item">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{job.type}</div>
                      <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {job.id}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <StatusBadge status={job.status} />
                      <button onClick={() => handleViewJob(job.id)} className="btn-icon" title="View details">
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                  <div style={{ marginTop: 4 }}>
                    <ProgressBar progress={job.progress} status={job.status} compact />
                  </div>
                  <div className="table-card-row">
                    <span className="table-card-label">Created</span>
                    <span className="table-card-value">{new Date(job.createdAt).toLocaleString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pagination */}
        {total > limit && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border-color)", flexWrap: "wrap", gap: 8 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total} jobs
            </span>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-secondary btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Previous</button>
              <button className="btn btn-secondary btn-sm" disabled={page * limit >= total} onClick={() => setPage(p => p + 1)}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* ── Job Detail Modal ── */}
      {selectedJob && (
        <div
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
          onClick={() => setSelectedJob(null)}
        >
          <div
            className="card"
            style={{ width: "100%", maxWidth: 800, maxHeight: "90vh", overflowY: "auto", padding: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Job Details</h2>
              <button onClick={() => setSelectedJob(null)} className="btn-icon"><X size={20} /></button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px 20px" }}>
              {/* Info grid — 2 cols on desktop, 1 col on mobile */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 28 }}>
                <InfoRow label="Job ID" value={<span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-secondary)", wordBreak: "break-all" }}>{selectedJob.id}</span>} />
                <InfoRow label="Type"       value={selectedJob.type} />
                <InfoRow label="Status"     value={<StatusBadge status={selectedJob.status} />} />
                <InfoRow label="Progress"   value={<ProgressBar progress={selectedJob.progress} status={selectedJob.status} compact />} />
                <InfoRow label="Created At" value={new Date(selectedJob.createdAt).toLocaleString()} />
                <InfoRow label="Updated At" value={new Date(selectedJob.updatedAt).toLocaleString()} />
              </div>

              {selectedJob.payload && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Payload</h3>
                  <pre style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: 16, borderRadius: 8, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--text-secondary)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {JSON.stringify(selectedJob.payload, null, 2)}
                  </pre>
                </div>
              )}

              {selectedJob.result && (
                <div style={{ marginBottom: 20 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Result</h3>
                  <pre style={{ backgroundColor: "var(--success-light)", border: "1px solid var(--success)", padding: 16, borderRadius: 8, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--success)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {JSON.stringify(selectedJob.result, null, 2)}
                  </pre>
                </div>
              )}

              {selectedJob.error && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertCircle size={16} color="var(--danger)" /> Error
                  </h3>
                  <pre style={{ backgroundColor: "var(--danger-light)", border: "1px solid var(--danger)", padding: 16, borderRadius: 8, fontSize: 12, fontFamily: "var(--font-mono)", color: "var(--danger)", overflowX: "auto", whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                    {selectedJob.error}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
