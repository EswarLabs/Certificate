import { useState, useContext } from "react";
import { NavLink, Outlet } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useOrg from "../../hooks/useOrg";
import useWorkspace from "../../hooks/useWorkspace";
import { ThemeContext } from "../../context/ThemeContext";
import { 
  LayoutDashboard, 
  Building2, 
  Folder, 
  FileText, 
  GraduationCap, 
  Files, 
  Settings2, 
  Mail, 
  Settings,
  Sun,
  Moon,
  Menu
} from "lucide-react";
import "./AppLayout.css";

export default function AppLayout() {
  const { user } = useAuth();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const { theme, toggleTheme } = useContext(ThemeContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const links = [
    { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { to: "/credentials", label: "Credentials", icon: GraduationCap },
    { to: "/templates", label: "Templates", icon: FileText },
    { to: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="app-layout">
      {/* Mobile Overlay */}
      <div 
        className={`mobile-overlay ${isMobileMenuOpen ? "open" : ""}`} 
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Sidebar */}
      <aside className={`sidebar ${isMobileMenuOpen ? "open" : ""}`}>
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
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `sidebar-link ${isActive ? "sidebar-link-active" : ""}`
                }
              >
                <Icon size={16} style={{ marginRight: '10px', color: 'currentColor' }} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        {/* User Info */}
        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-user">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" className="sidebar-avatar" style={{ objectFit: 'cover' }} />
              ) : (
                <div className="sidebar-avatar">
                  {user.firstName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
              )}
              <span>{user.firstName || user.email}</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="main-wrapper">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            <button 
              className="mobile-menu-btn btn-icon" 
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={18} />
            </button>
            <div className="breadcrumb">
              <span>CertManager</span>
              {selectedOrg && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span>{selectedOrg.name}</span>
                </>
              )}
              {selectedWorkspace && (
                <>
                  <span className="breadcrumb-separator">/</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {selectedWorkspace.name}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="header-right">
            <button className="btn-icon" onClick={toggleTheme} title="Toggle Theme">
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
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
