import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listCredentials } from "../services/credentialServices";
import { listTemplates } from "../services/templateServices";
import { listJobs } from "../services/jobServices";
import { FileText, GraduationCap, Settings2, Activity } from "lucide-react";

export default function Dashboard() {
  const { user, logoutUser } = useAuth();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    credentials: 0,
    templates: 0,
    jobs: 0
  });
  const [recentCreds, setRecentCreds] = useState([]);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      if (!selectedOrg?.id || !selectedWorkspace?.id) return;
      setLoadingStats(true);
      try {
        const [credRes, tempRes, jobRes] = await Promise.all([
          listCredentials(selectedOrg.id, selectedWorkspace.id, 1, 5),
          listTemplates(selectedOrg.id, selectedWorkspace.id, 1, 1),
          listJobs(selectedOrg.id, selectedWorkspace.id, 1, 1)
        ]);

        setStats({
          credentials: credRes.total || 0,
          templates: tempRes.total || 0,
          jobs: jobRes.total || 0
        });

        if (credRes.credentials) {
          setRecentCreds(credRes.credentials);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoadingStats(false);
      }
    }
    fetchStats();
  }, [selectedOrg?.id, selectedWorkspace?.id]);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", backgroundColor: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid var(--border-color)" }}>
              {user?.firstName?.charAt(0) || user?.email?.charAt(0) || "U"}
            </div>
          )}
          <div>
            <h1 className="page-title">Overview</h1>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Welcome back, {user?.firstName || user?.email}</span>
          </div>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary">
          Logout
        </button>
      </div>
      
      {!selectedWorkspace ? (
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <Activity size={32} style={{ margin: "0 auto 16px", color: "var(--text-tertiary)" }} />
          <h3 style={{ marginBottom: "8px" }}>No Workspace Selected</h3>
          <p style={{ color: "var(--text-secondary)" }}>Please select or create an organization and workspace to view analytics.</p>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "32px" }}>
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <GraduationCap size={16} />
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Total Credentials</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 600 }}>{loadingStats ? "-" : stats.credentials}</div>
            </div>
            
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <FileText size={16} />
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Active Templates</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 600 }}>{loadingStats ? "-" : stats.templates}</div>
            </div>

            <div className="card" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                <Settings2 size={16} />
                <span style={{ fontSize: "13px", fontWeight: 500 }}>Jobs Processed</span>
              </div>
              <div style={{ fontSize: "24px", fontWeight: 600 }}>{loadingStats ? "-" : stats.jobs}</div>
            </div>
          </div>

          <h2 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px" }}>Recent Activity</h2>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            {recentCreds.length === 0 ? (
              <div style={{ padding: "24px", textAlign: "center", color: "var(--text-secondary)", fontSize: "13px" }}>
                {loadingStats ? "Loading..." : "No recent credentials issued."}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border-color)", backgroundColor: "var(--bg-secondary)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)" }}>Recipient</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: 500, color: "var(--text-secondary)" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentCreds.map((cred, idx) => (
                    <tr key={cred.id} style={{ borderBottom: idx === recentCreds.length - 1 ? "none" : "1px solid var(--border-color)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 500 }}>{cred.recipientName}</div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "12px" }}>{cred.recipientEmail || "—"}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          padding: "2px 8px", 
                          borderRadius: "12px", 
                          fontSize: "11px", 
                          fontWeight: 500,
                          backgroundColor: cred.status === "ISSUED" ? "var(--success-light)" : "var(--bg-hover)",
                          color: cred.status === "ISSUED" ? "var(--success)" : "var(--text-secondary)"
                        }}>
                          {cred.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)" }}>
                        {new Date(cred.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
