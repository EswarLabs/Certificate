import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Check, Plus, Search, Building2, Folder, Loader2 } from "lucide-react";
import useOrg from "../../hooks/useOrg";
import useWorkspace from "../../hooks/useWorkspace";
import toast from "react-hot-toast";
import "./OrgWorkspaceSwitcher.css";

export default function OrgWorkspaceSwitcher() {
  const {
    org: orgs,
    selectedOrg,
    selectOrganization,
    createOrganization,
    listOrganization,
  } = useOrg();

  const {
    workspaces,
    selectedWorkspace,
    selectWorkspace,
    createNewWorkspace,
    fetchWorkspaces,
  } = useWorkspace();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [wsQuery, setWsQuery] = useState("");
  const [showOrgCreate, setShowOrgCreate] = useState(false);
  const [showWsCreate, setShowWsCreate] = useState(false);
  const [newOrgName, setNewOrgName] = useState("");
  const [newWsName, setNewWsName] = useState("");
  const [creating, setCreating] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState({});

  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  /* ── Position the dropdown ── */
  const positionDropdown = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const dropdownWidth = Math.min(Math.max(rect.width, 280), viewportWidth - 24);
    const leftPos = Math.max(12, Math.min(rect.left, viewportWidth - dropdownWidth - 12));

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    if (spaceBelow < 300 && spaceAbove > spaceBelow) {
      // Open upward
      setDropdownStyle({
        left: leftPos,
        bottom: viewportHeight - rect.top + 4,
        top: "auto",
        width: dropdownWidth,
      });
    } else {
      setDropdownStyle({
        left: leftPos,
        top: rect.bottom + 4,
        width: dropdownWidth,
      });
    }
  }, []);

  useEffect(() => {
    if (open) {
      positionDropdown();
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open, positionDropdown]);

  /* ── Close on outside click ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !dropdownRef.current?.contains(e.target)
      ) {
        setOpen(false);
        setQuery("");
        setWsQuery("");
        setShowOrgCreate(false);
        setShowWsCreate(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  /* ── Close on Escape ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape" && open) setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  /* ── Fetch workspaces when org changes ── */
  useEffect(() => {
    if (selectedOrg?.id) fetchWorkspaces(selectedOrg.id);
  }, [selectedOrg?.id]);

  const filteredOrgs = orgs.filter((o) =>
    o.name.toLowerCase().includes(query.toLowerCase())
  );

  const filteredWorkspaces = workspaces.filter((w) =>
    w.name.toLowerCase().includes(wsQuery.toLowerCase())
  );

  const handleSelectOrg = (org) => {
    selectOrganization(org);
    // Reset workspace when switching orgs (auto-selected by WorkspaceContext later)
    selectWorkspace(null);
    setQuery("");
    setOpen(false);
    toast.success(`Switched to ${org.name}`);
  };

  const handleSelectWs = (ws) => {
    selectWorkspace(ws);
    setOpen(false);
    setWsQuery("");
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    try {
      await createOrganization({ name: newOrgName.trim() });
      toast.success(`Organization "${newOrgName.trim()}" created!`);
      await listOrganization(1, 50);
      setNewOrgName("");
      setShowOrgCreate(false);
    } catch (err) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleCreateWs = async (e) => {
    e.preventDefault();
    if (!newWsName.trim() || !selectedOrg?.id) return;
    setCreating(true);
    try {
      await createNewWorkspace(selectedOrg.id, newWsName.trim());
      toast.success(`Workspace "${newWsName.trim()}" created!`);
      setNewWsName("");
      setShowWsCreate(false);
    } catch (err) {
      toast.error(err.message || "Failed to create workspace");
    } finally {
      setCreating(false);
    }
  };

  /* ── Trigger label ── */
  const orgLabel = selectedOrg?.name || "Select Organization";
  const wsLabel = selectedWorkspace?.name || (selectedOrg ? "Select Workspace" : "No org selected");

  return (
    <div className="switcher-wrap">
      {/* Trigger */}
      <button
        ref={triggerRef}
        className="switcher-trigger"
        onClick={() => setOpen((p) => !p)}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <div className="switcher-avatar">
          {selectedOrg?.logoUrl ? (
            <img src={selectedOrg.logoUrl} alt={selectedOrg.name} />
          ) : (
            <Building2 size={14} />
          )}
        </div>
        <div className="switcher-info">
          <div className="switcher-org-name">{orgLabel}</div>
          <div className="switcher-ws-name">{wsLabel}</div>
        </div>
        <ChevronDown size={14} className={`switcher-chevron ${open ? "open" : ""}`} />
      </button>

      {/* Dropdown Portal */}
      {open && (
        <div
          ref={dropdownRef}
          className="switcher-dropdown"
          style={dropdownStyle}
          role="listbox"
        >
          {/* Search */}
          <div className="switcher-search-wrap">
            <Search size={13} />
            <input
              ref={searchRef}
              className="switcher-search"
              placeholder="Search organizations…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </div>

          <div className="switcher-scroll">
            {/* ── Organizations ── */}
            <div className="switcher-section-head">
              <span className="switcher-section-label">Organizations</span>
              <button
                className="switcher-section-action"
                onClick={() => setShowOrgCreate((p) => !p)}
              >
                <Plus size={11} /> New
              </button>
            </div>

            {showOrgCreate && (
              <form className="switcher-create-form" onSubmit={handleCreateOrg}>
                <div className="switcher-create-input-row">
                  <input
                    className="switcher-create-input"
                    placeholder="Organization name…"
                    value={newOrgName}
                    onChange={(e) => setNewOrgName(e.target.value)}
                    required
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={creating || !newOrgName.trim()}
                  >
                    {creating ? <Loader2 size={12} className="spin-icon" /> : "Add"}
                  </button>
                </div>
              </form>
            )}

            {filteredOrgs.length === 0 ? (
              <div className="switcher-empty">
                {query ? `No orgs matching "${query}"` : "No organizations yet"}
              </div>
            ) : (
              filteredOrgs.map((org) => (
                <button
                  key={org.id}
                  className={`switcher-item ${selectedOrg?.id === org.id ? "active" : ""}`}
                  onClick={() => handleSelectOrg(org)}
                >
                  <div className="switcher-item-avatar">
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt={org.name} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 6 }} />
                    ) : (
                      (org.name?.charAt(0) || "O").toUpperCase()
                    )}
                  </div>
                  <div className="switcher-item-info">
                    <div className="switcher-item-name">{org.name}</div>
                    <div className="switcher-item-sub">/{org.slug}</div>
                  </div>
                  {selectedOrg?.id === org.id && <Check size={13} className="switcher-item-check" />}
                </button>
              ))
            )}

            {/* ── Workspaces ── */}
            {selectedOrg && (
              <>
                <div className="switcher-divider" />
                <div className="switcher-section-head">
                  <span className="switcher-section-label">Workspaces — {selectedOrg.name}</span>
                  <button
                    className="switcher-section-action"
                    onClick={() => setShowWsCreate((p) => !p)}
                  >
                    <Plus size={11} /> New
                  </button>
                </div>

                {/* Workspace search */}
                {workspaces.length > 4 && (
                  <div style={{ padding: "0 12px 6px" }}>
                    <div style={{ position: "relative" }}>
                      <Search size={12} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", pointerEvents: "none" }} />
                      <input
                        className="switcher-search"
                        style={{ paddingLeft: 26 }}
                        placeholder="Search workspaces…"
                        value={wsQuery}
                        onChange={(e) => setWsQuery(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {showWsCreate && (
                  <form className="switcher-create-form" onSubmit={handleCreateWs}>
                    <div className="switcher-create-input-row">
                      <input
                        className="switcher-create-input"
                        placeholder="Workspace name…"
                        value={newWsName}
                        onChange={(e) => setNewWsName(e.target.value)}
                        required
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="btn btn-primary btn-sm"
                        disabled={creating || !newWsName.trim()}
                      >
                        {creating ? <Loader2 size={12} /> : "Add"}
                      </button>
                    </div>
                  </form>
                )}

                {filteredWorkspaces.length === 0 ? (
                  <div className="switcher-empty">
                    {wsQuery ? `No workspaces matching "${wsQuery}"` : "No workspaces yet"}
                  </div>
                ) : (
                  filteredWorkspaces.map((ws) => (
                    <button
                      key={ws.id}
                      className={`switcher-item ${selectedWorkspace?.id === ws.id ? "active" : ""}`}
                      onClick={() => handleSelectWs(ws)}
                    >
                      <div className="switcher-item-avatar" style={{ borderRadius: 6, background: "linear-gradient(135deg, #10b981, #059669)" }}>
                        <Folder size={12} color="#fff" />
                      </div>
                      <div className="switcher-item-info">
                        <div className="switcher-item-name">{ws.name}</div>
                        <div className="switcher-item-sub">
                          {ws.smtpEnabled ? "✓ Email configured" : "Email not set up"}
                        </div>
                      </div>
                      {selectedWorkspace?.id === ws.id && <Check size={13} className="switcher-item-check" />}
                    </button>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
