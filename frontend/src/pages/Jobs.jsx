import { useState, useEffect } from "react";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listJobs, getJob } from "../services/jobServices";

export default function Jobs() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [jobs, setJobs] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const limit = 10;

  const fetchJobs = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listJobs(
        selectedOrg.id, selectedWorkspace.id, page, limit,
        statusFilter || undefined, typeFilter || undefined
      );
      if (res.success) {
        setJobs(res.jobs || []);
        setTotal(res.total || 0);
      } else {
        setError(res.message || "Failed to fetch jobs");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [selectedOrg?.id, selectedWorkspace?.id, page, statusFilter, typeFilter]);

  const handleViewJob = async (jobId) => {
    try {
      const res = await getJob(selectedOrg.id, selectedWorkspace.id, jobId);
      if (res.id) setSelectedJob(res);
    } catch (err) {
      alert(err.message);
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "pending": return "#f59e0b";
      case "in_progress": return "#3b82f6";
      case "completed": return "#22c55e";
      case "failed": return "#ef4444";
      default: return "#6b7280";
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return <div><p>Please select an organization and workspace first.</p></div>;
  }

  return (
    <div>
      <h1>Background Jobs</h1>

      {/* Filters */}
      <div style={{ display: "flex", gap: "12px", margin: "12px 0" }}>
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="failed">Failed</option>
        </select>
        <select value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}>
          <option value="">All Types</option>
          <option value="batch_credentials">Batch Credentials</option>
          <option value="bulk_issue">Bulk Issue</option>
        </select>
        <button onClick={fetchJobs}>Refresh</button>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Job ID</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Type</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Status</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Progress</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Created</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr key={job.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "8px", fontFamily: "monospace", fontSize: "0.8rem" }}>{job.id}</td>
              <td style={{ padding: "8px" }}>{job.type}</td>
              <td style={{ padding: "8px" }}>
                <span style={{ color: "#fff", backgroundColor: statusColor(job.status), padding: "2px 8px", borderRadius: "9999px", fontSize: "0.8rem" }}>
                  {job.status}
                </span>
              </td>
              <td style={{ padding: "8px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "100px", height: "8px", backgroundColor: "#e5e7eb", borderRadius: "4px" }}>
                    <div style={{ width: `${job.progress}%`, height: "100%", backgroundColor: statusColor(job.status), borderRadius: "4px" }} />
                  </div>
                  <span style={{ fontSize: "0.85rem" }}>{job.progress}%</span>
                </div>
              </td>
              <td style={{ padding: "8px" }}>{new Date(job.createdAt).toLocaleString()}</td>
              <td style={{ padding: "8px" }}>
                <button onClick={() => handleViewJob(job.id)}>Details</button>
              </td>
            </tr>
          ))}
          {jobs.length === 0 && !loading && (
            <tr>
              <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                No jobs found.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {total > limit && (
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <button disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}

      {/* Job Detail Modal */}
      {selectedJob && (
        <div style={{ marginTop: "24px", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Job Detail</h2>
            <button onClick={() => setSelectedJob(null)}>Close</button>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>ID</td><td style={{ padding: "6px", fontFamily: "monospace" }}>{selectedJob.id}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Type</td><td style={{ padding: "6px" }}>{selectedJob.type}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Status</td><td style={{ padding: "6px" }}>{selectedJob.status}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Progress</td><td style={{ padding: "6px" }}>{selectedJob.progress}%</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Created</td><td style={{ padding: "6px" }}>{new Date(selectedJob.createdAt).toLocaleString()}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Updated</td><td style={{ padding: "6px" }}>{new Date(selectedJob.updatedAt).toLocaleString()}</td></tr>
            </tbody>
          </table>

          {selectedJob.payload && (
            <div style={{ marginTop: "12px" }}>
              <h3>Payload</h3>
              <pre style={{ background: "#f9fafb", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", overflow: "auto" }}>
                {JSON.stringify(selectedJob.payload, null, 2)}
              </pre>
            </div>
          )}

          {selectedJob.result && (
            <div style={{ marginTop: "12px" }}>
              <h3>Result</h3>
              <pre style={{ background: "#f0fdf4", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", overflow: "auto" }}>
                {JSON.stringify(selectedJob.result, null, 2)}
              </pre>
            </div>
          )}

          {selectedJob.error && (
            <div style={{ marginTop: "12px" }}>
              <h3>Error</h3>
              <pre style={{ background: "#fef2f2", padding: "12px", borderRadius: "8px", fontSize: "0.85rem", color: "#ef4444" }}>
                {selectedJob.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
