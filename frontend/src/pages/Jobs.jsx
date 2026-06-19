import { useState } from "react";
import useSWR from "swr";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listJobs, getJob } from "../services/jobServices";
import { RefreshCw, Eye, X, Activity, AlertCircle } from "lucide-react";

export default function Jobs() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const limit = 10;

  const { data, isLoading, mutate, error: swrError } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id
      ? ['jobs', selectedOrg.id, selectedWorkspace.id, page, statusFilter, typeFilter]
      : null,
    async ([_, orgId, wsId, p, status, type]) => {
      const res = await listJobs(orgId, wsId, p, limit, status || undefined, type || undefined);
      if (!res.success) throw new Error(res.message || "Failed to fetch jobs");
      return res;
    },
    {
      refreshInterval: (data) => {
        if (!data) return 0;
        const hasActive = data.jobs.some(j => j.status === 'PENDING' || j.status === 'RUNNING');
        return hasActive ? 3000 : 0;
      }
    }
  );

  const jobs = data?.jobs || [];
  const total = data?.total || 0;
  const loading = isLoading && !data;
  const error = swrError?.message || null;

  const fetchJobs = () => { mutate(); };

  const handleViewJob = async (jobId) => {
    try {
      const res = await getJob(selectedOrg.id, selectedWorkspace.id, jobId);
      if (res.id) setSelectedJob(res);
    } catch (err) {
      alert(err.message);
    }
  };

  const StatusBadge = ({ status }) => {
    let colorClass = "";
    let bgClass = "";
    switch (status) {
      case "PENDING": colorClass = "var(--warning)"; bgClass = "var(--warning-light)"; break;
      case "RUNNING": colorClass = "var(--brand-primary)"; bgClass = "var(--brand-primary-light)"; break;
      case "COMPLETED": colorClass = "var(--success)"; bgClass = "var(--success-light)"; break;
      case "FAILED": colorClass = "var(--danger)"; bgClass = "var(--danger-light)"; break;
      default: colorClass = "var(--text-secondary)"; bgClass = "var(--bg-hover)"; break;
    }
    return (
      <span style={{ backgroundColor: bgClass, color: colorClass, padding: "2px 8px", borderRadius: "12px", fontSize: "11px", fontWeight: 600 }}>
        {status}
      </span>
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "PENDING": return "var(--warning)";
      case "RUNNING": return "var(--brand-primary)";
      case "COMPLETED": return "var(--success)";
      case "FAILED": return "var(--danger)";
      default: return "var(--text-secondary)";
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
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">Background Jobs</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>Monitor asynchronous tasks and batch operations</p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={fetchJobs} className="btn btn-secondary" disabled={loading}>
            <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {/* Filters */}
        <div style={{ display: "flex", gap: "16px", padding: "16px 24px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
          <select className="input" style={{ width: "200px" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <select className="input" style={{ width: "200px" }} value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="batch_credentials">Batch Credentials</option>
            <option value="bulk_issue">Bulk Issue</option>
          </select>
        </div>

        {error && <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px 24px", fontSize: "13px", fontWeight: 500, borderBottom: "1px solid var(--border-color)" }}>{error}</div>}

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Type</th>
                <th>Status</th>
                <th>Progress</th>
                <th>Created</th>
                <th style={{ width: "80px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{job.id}</td>
                  <td style={{ fontWeight: 500, color: "var(--text-primary)" }}>{job.type}</td>
                  <td><StatusBadge status={job.status} /></td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "120px", height: "6px", backgroundColor: "var(--bg-hover)", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ width: `${job.progress}%`, height: "100%", backgroundColor: getStatusColor(job.status), borderRadius: "3px", transition: "width 0.3s ease" }} />
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--text-secondary)", minWidth: "32px" }}>{job.progress}%</span>
                    </div>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{new Date(job.createdAt).toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => handleViewJob(job.id)} className="btn-icon">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {jobs.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <Activity size={32} style={{ color: "var(--border-color)" }} />
                      <p>No jobs found.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} jobs</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn btn-secondary" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {/* Job Detail Modal Overlay */}
      {selectedJob && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }} onClick={() => setSelectedJob(null)}>
          <div className="card" style={{ width: "100%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", padding: 0 }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)", position: "sticky", top: 0, zIndex: 10 }}>
              <h2 style={{ fontSize: "16px", fontWeight: 600, margin: 0, color: "var(--text-primary)" }}>Job Details</h2>
              <button onClick={() => setSelectedJob(null)} className="btn-icon">
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: "24px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
                <InfoRow label="Job ID" value={<span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{selectedJob.id}</span>} />
                <InfoRow label="Type" value={selectedJob.type} />
                <InfoRow label="Status" value={<StatusBadge status={selectedJob.status} />} />
                <InfoRow label="Progress" value={`${selectedJob.progress}%`} />
                <InfoRow label="Created At" value={new Date(selectedJob.createdAt).toLocaleString()} />
                <InfoRow label="Updated At" value={new Date(selectedJob.updatedAt).toLocaleString()} />
              </div>

              {selectedJob.payload && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>Payload</h3>
                  <pre style={{ backgroundColor: "var(--bg-secondary)", border: "1px solid var(--border-color)", padding: "16px", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", overflowX: "auto" }}>
                    {JSON.stringify(selectedJob.payload, null, 2)}
                  </pre>
                </div>
              )}

              {selectedJob.result && (
                <div style={{ marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px" }}>Result</h3>
                  <pre style={{ backgroundColor: "var(--success-light)", border: "1px solid var(--success)", padding: "16px", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--success)", overflowX: "auto" }}>
                    {JSON.stringify(selectedJob.result, null, 2)}
                  </pre>
                </div>
              )}

              {selectedJob.error && (
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <AlertCircle size={16} color="var(--danger)" /> Error
                  </h3>
                  <pre style={{ backgroundColor: "var(--danger-light)", border: "1px solid var(--danger)", padding: "16px", borderRadius: "8px", fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--danger)", overflowX: "auto", whiteSpace: "pre-wrap" }}>
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

function InfoRow({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--text-secondary)" }}>{label}</span>
      <span style={{ fontSize: "14px", color: "var(--text-primary)" }}>{value}</span>
    </div>
  );
}
