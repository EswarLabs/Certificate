import { useState, useContext } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useOrg from "../../hooks/useOrg";
import useWorkspace from "../../hooks/useWorkspace";
import { ThemeContext } from "../../context/ThemeContext";
import {
  LayoutDashboard, GraduationCap, FileText, Building2,
  Folder, Files, Settings2, Mail, Settings, Sun, Moon,
  Menu, LogOut, ShieldCheck
} from "lucide-react";
import "./AppLayout.css";

const NAV_SECTIONS = [
  {
    label: "Content",
    links: [
      { to: "/dashboard",   label: "Dashboard",   icon: LayoutDashboard },
      { to: "/credentials", label: "Credentials", icon: GraduationCap },
      { to: "/templates",   label: "Templates",   icon: FileText },
    ]
  },
  {
    label: "Organisation",
    links: [
      { to: "/organizations", label: "Organizations", icon: Building2 },
      { to: "/workspaces",    label: "Workspaces",    icon: Folder },
      { to: "/files",         label: "Files",         icon: Files },
    ]
  },
  {
    label: "System",
    links: [
      { to: "/jobs",        label: "Jobs",        icon: Settings2 },
      { to: "/email-logs",  label: "Email Logs",  icon: Mail },
      { to: "/settings",    label: "Settings",    icon: Settings },
    ]
  },
];

export default function AppLayout() {
  const { user, logoutUser } = useAuth();
  const { selectedOrg }      = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      <div
        className={`mobile-overlay ${isMobileOpen ? "open" : ""}`}
        onClick={() => setIsMobileOpen(false)}
      />

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`}>
        {/* Brand */}
        <div className="sidebar-brand">
          <div className="sidebar-logo">C</div>
          <span className="sidebar-brand-name">CertManager</span>
        </div>

        {/* Context */}
        <div className="sidebar-context">
          <div className="context-row">
            <span className="context-label">Org</span>
            <span className="context-value">{selectedOrg?.name || "—"}</span>
          </div>
          <div className="context-row">
            <span className="context-label">Workspace</span>
            <span className="context-value">{selectedWorkspace?.name || "—"}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="sidebar-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <div className="nav-section-label">{section.label}</div>
              {section.links.map(link => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsMobileOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                    }
                  >
                    <Icon size={15} />
                    {link.label}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="sidebar-avatar" />
              ) : (
                <div className="sidebar-avatar">
                  {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
              )}
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">
                  {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user.email}
                </div>
                <div className="sidebar-user-role">User</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="main-wrapper">
        {/* Header */}
        <header className="top-header">
          <div className="header-left">
            <button
              className="btn-icon mobile-menu-btn"
              onClick={() => setIsMobileOpen(true)}
            >
              <Menu size={16} />
            </button>
            <div className="breadcrumb">
              <ShieldCheck size={14} />
              <span>CertManager</span>
              {selectedOrg && (
                <>
                  <span className="breadcrumb-sep">›</span>
                  <span>{selectedOrg.name}</span>
                </>
              )}
              {selectedWorkspace && (
                <>
                  <span className="breadcrumb-sep">›</span>
                  <span className="breadcrumb-current">{selectedWorkspace.name}</span>
                </>
              )}
            </div>
          </div>
          <div className="header-right">
            <button className="btn-icon" onClick={toggleTheme} title="Toggle theme">
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <button className="btn-icon" onClick={handleLogout} title="Logout">
              <LogOut size={15} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
