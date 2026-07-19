import { useState, useContext, useEffect } from "react";
import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import useWorkspace from "../../hooks/useWorkspace";
import useOrg from "../../hooks/useOrg";
import { ThemeContext } from "../../context/ThemeContext";
import OrgWorkspaceSwitcher from "./OrgWorkspaceSwitcher";
import CommandPalette from "../ui/CommandPalette";
import NotificationDrawer from "../ui/NotificationDrawer";
import QuickCreateDropdown from "../ui/QuickCreateDropdown";
import Breadcrumbs from "../ui/Breadcrumbs";
import {
  LayoutDashboard, GraduationCap, FileText, Building2,
  Folder, Files, Activity, Mail, Settings, Sun, Moon,
  Menu, LogOut, ShieldCheck, X, Search, CheckCircle,
  AlertTriangle, Users, Monitor, Sparkles
} from "lucide-react";
import "./AppLayout.css";

const NAV_GROUPS = [
  {
    group: "Overview",
    links: [
      { to: "/dashboard", label: "Overview", icon: LayoutDashboard, roles: ["OWNER", "ADMIN", "EDITOR", "ISSUER", "VIEWER", "MEMBER"] }
    ]
  },
  {
    group: "Certificates",
    links: [
      { to: "/credentials", label: "Credentials", icon: GraduationCap, roles: ["OWNER", "ADMIN", "EDITOR", "ISSUER", "VIEWER", "MEMBER"] },
      { to: "/templates", label: "Templates", icon: FileText, roles: ["OWNER", "ADMIN", "EDITOR", "VIEWER", "MEMBER"] },
      { to: "/marketplace", label: "Marketplace", icon: Sparkles, roles: ["OWNER", "ADMIN", "EDITOR", "VIEWER", "MEMBER"] },
      { to: "/jobs", label: "Batch Jobs", icon: Activity, roles: ["OWNER", "ADMIN", "EDITOR", "ISSUER"] }
    ]
  },
  {
    group: "Communication",
    links: [
      { to: "/email-logs", label: "Deliveries", icon: Mail, roles: ["OWNER", "ADMIN", "EDITOR", "ISSUER", "VIEWER", "MEMBER"] }
    ]
  },
  {
    group: "Storage",
    links: [
      { to: "/files", label: "Assets", icon: Files, roles: ["OWNER", "ADMIN", "EDITOR", "MEMBER"] }
    ]
  },
  {
    group: "Administration",
    links: [
      { to: "/workspaces", label: "Team", icon: Users, roles: ["OWNER", "ADMIN", "VIEWER"] },
      { to: "/organizations", label: "Organizations", icon: Building2, roles: ["OWNER", "ADMIN"] }
    ]
  },
  {
    group: "Settings",
    links: [
      { to: "/settings", label: "Settings", icon: Settings, roles: ["OWNER", "ADMIN", "EDITOR", "VIEWER", "MEMBER"] }
    ]
  }
];

export default function AppLayout() {
  const { user, logoutUser } = useAuth();
  const { selectedWorkspace, members } = useWorkspace();
  const { selectedOrg } = useOrg();
  const { theme, themeMode, setThemeMode, toggleTheme } = useContext(ThemeContext);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isCmdOpen, setIsCmdOpen] = useState(false);
  const navigate = useNavigate();

  /* ── Determine user role for RBAC ── */
  const currentMember = (members || []).find(m => m.userId === user?.id || m.user?.id === user?.id || m.email === user?.email);
  const userRole = (currentMember?.role || user?.role || "OWNER").toUpperCase();

  /* ── Command Palette (Ctrl+K / Cmd+K) Listener ── */
  useEffect(() => {
    const handleCmdK = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCmdOpen(prev => !prev);
      }
    };
    window.addEventListener("keydown", handleCmdK);
    return () => window.removeEventListener("keydown", handleCmdK);
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    navigate("/login");
  };

  const closeMobile = () => setIsMobileOpen(false);

  /* ── Workspace Health Status Calculations ── */
  const isVerified = Boolean(selectedOrg?.customDomain || selectedOrg?.verificationStatus);
  const hasSmtp = Boolean(selectedWorkspace?.smtpConfig?.host || selectedWorkspace?.smtpEnabled);
  const usageCount = selectedWorkspace?._count?.credentials || selectedWorkspace?.credentialsCount || "14";

  return (
    <div className="app-layout">
      {/* Global Command Palette */}
      <CommandPalette isOpen={isCmdOpen} onClose={() => setIsCmdOpen(false)} />

      {/* Mobile sidebar backdrop */}
      <div
        className={`mobile-overlay ${isMobileOpen ? "open" : ""}`}
        onClick={closeMobile}
      />

      {/* ── Enterprise Sidebar ── */}
      <aside className={`sidebar ${isMobileOpen ? "open" : ""}`} role="navigation" aria-label="Main Sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand">
          <Link to="/dashboard" className="sidebar-brand-link" onClick={closeMobile}>
            <div className="sidebar-logo">
              <ShieldCheck size={16} />
            </div>
            <span className="sidebar-brand-name">CertManager</span>
          </Link>
          <button
            className="btn-icon mobile-close-btn"
            onClick={closeMobile}
            aria-label="Close sidebar"
          >
            <X size={16} />
          </button>
        </div>

        {/* Top Context Switcher */}
        <div className="sidebar-switcher-wrap">
          <OrgWorkspaceSwitcher />
        </div>

        {/* Role-Aware Navigation Hierarchy */}
        <nav className="sidebar-nav">
          {NAV_GROUPS.map(section => {
            const allowedLinks = section.links.filter(l => l.roles.includes(userRole) || userRole === "OWNER");
            if (allowedLinks.length === 0) return null;

            return (
              <div key={section.group} className="nav-group">
                <div className="nav-group-label">{section.group}</div>
                <div className="nav-group-items">
                  {allowedLinks.map(link => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={closeMobile}
                        className={({ isActive }) =>
                          `sidebar-link${isActive ? " sidebar-link-active" : ""}`
                        }
                      >
                        <Icon size={16} className="sidebar-link-icon" />
                        <span>{link.label}</span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer User Card */}
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
                <div className="sidebar-user-role">
                  <span className="sidebar-role-dot" />
                  <span>{userRole}</span>
                </div>
              </div>
              <button
                className="btn-icon sidebar-logout-btn"
                onClick={handleLogout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* ── Main Application Shell ── */}
      <div className="main-wrapper">
        {/* Top Navbar */}
        <header className="top-navbar" role="banner">
          <div className="navbar-left">
            <button
              className="btn-icon mobile-menu-btn"
              onClick={() => setIsMobileOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu size={18} />
            </button>

            <div className="navbar-breadcrumbs">
              <Breadcrumbs />
            </div>
          </div>

          {/* Center Global Search Bar Trigger */}
          <div className="navbar-center">
            <button className="navbar-search-bar" onClick={() => setIsCmdOpen(true)} aria-label="Open Command Palette (Ctrl+K)">
              <Search size={15} className="text-tertiary" />
              <span className="navbar-search-placeholder">Search certificates, templates, jobs...</span>
              <kbd className="navbar-search-kbd">⌘K</kbd>
            </button>
          </div>

          <div className="navbar-right">
            {/* Workspace Status Bar */}
            {selectedWorkspace && (
              <div className="ws-status-bar">
                <span className={`ws-status-item ${isVerified ? 'verified' : 'pending'}`} title={isVerified ? "Domain Verified" : "DNS Verification Pending"}>
                  {isVerified ? <CheckCircle size={12} className="text-success" /> : <AlertTriangle size={12} className="text-warning" />}
                  <span className="ws-status-text">{isVerified ? "Verified" : "DNS Pending"}</span>
                </span>

                <span className={`ws-status-item ${hasSmtp ? 'verified' : 'pending'}`} title="SMTP Email Provider">
                  {hasSmtp ? <CheckCircle size={12} className="text-success" /> : <AlertTriangle size={12} className="text-warning" />}
                  <span className="ws-status-text">SMTP</span>
                </span>

                <span className="ws-status-item usage" title="Monthly Quota Usage">
                  <span className="ws-status-text">{usageCount} / 1000</span>
                </span>
              </div>
            )}

            <QuickCreateDropdown />
            <NotificationDrawer />

            {/* Theme Selector Button */}
            <button
              className="btn-icon theme-toggle-btn"
              onClick={toggleTheme}
              title={`Theme mode (${theme})`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
        </header>

        {/* Main Page Canvas */}
        <main className="main-content app-main" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {/* ── Mobile Bottom Tab Bar ── */}
      <nav className="mobile-bottom-nav" role="navigation" aria-label="Mobile navigation">
        <NavLink to="/dashboard" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
          <LayoutDashboard size={20} />
          <span>Overview</span>
        </NavLink>
        <NavLink to="/credentials" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
          <GraduationCap size={20} />
          <span>Certs</span>
        </NavLink>
        {/* FAB — center button */}
        <NavLink to="/credentials/create" className="mobile-nav-fab" aria-label="Issue credential">
          <GraduationCap size={22} />
        </NavLink>
        <NavLink to="/templates" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
          <FileText size={20} />
          <span>Templates</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `mobile-nav-item${isActive ? " active" : ""}`}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}

