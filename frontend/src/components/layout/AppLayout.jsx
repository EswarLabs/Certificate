import { NavLink, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useOrg from "../../hooks/useOrg";
import useWorkspace from "../../hooks/useWorkspace";

export default function AppLayout() {
  const { user } = useAuth();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const links = [
    { to: "/dashboard", label: "Dashboard" },
    { to: "/organizations", label: "Organizations" },
    { to: "/workspaces", label: "Workspaces" },
    { to: "/templates", label: "Templates" },
    { to: "/credentials", label: "Credentials" },
    { to: "/files", label: "Files" },
    { to: "/jobs", label: "Jobs" },
    { to: "/email-logs", label: "Email Logs" },
    { to: "/settings", label: "Settings" },
  ];

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2>CertManager</h2>
        </div>

        {/* Context Indicator */}
        <div className="sidebar-context">
          <div className="context-item">
            <span className="context-label">Org</span>
            <span className="context-value">{selectedOrg?.name || "None"}</span>
          </div>
          <div className="context-item">
            <span className="context-label">Workspace</span>
            <span className="context-value">{selectedWorkspace?.name || "None"}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        {/* User Info */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              {user.avatarUrl && (
                <img src={user.avatarUrl} alt="" className="sidebar-avatar" />
              )}
              <span>{user.firstName} {user.lastName}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
