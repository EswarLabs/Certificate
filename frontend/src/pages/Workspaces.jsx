import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useWorkspace from '../hooks/useWorkspace';
import useOrg from '../hooks/useOrg';
import { listUsers } from '../services/userServices';
import DataTable from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import {
  Folder, Plus, Check, Trash2, UserPlus, UserMinus,
  Users, Loader2, Settings, ArrowRight, Shield, Globe, Mail
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';

export default function Workspaces() {
  const {
    workspaces, selectedWorkspace, members, loading, error,
    fetchWorkspaces, selectWorkspace, createNewWorkspace,
    deleteCurrentWorkspace, fetchMembers, addNewMember,
    removeMemberFromOrg, updateRole,
  } = useWorkspace();

  const { selectedOrg } = useOrg();
  const navigate = useNavigate();

  const [newWsName, setNewWsName] = useState('');
  const [wsActionLoading, setWsAction] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [memberActionLoading, setMemberAction] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (selectedOrg?.id) fetchWorkspaces(selectedOrg.id);
  }, [selectedOrg?.id]);

  useEffect(() => {
    if (selectedOrg?.id && selectedWorkspace?.id) {
      fetchMembers(selectedOrg.id, selectedWorkspace.id);
    }
  }, [selectedOrg?.id, selectedWorkspace?.id]);

  useEffect(() => {
    if (!selectedWorkspace && workspaces.length > 0) selectWorkspace(workspaces[0]);
  }, [workspaces, selectedWorkspace]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim() || !selectedOrg?.id) return;
    setWsAction(true);
    try {
      const res = await createNewWorkspace(selectedOrg.id, newWsName.trim());
      if (res?.workspace) {
        toast.success(`Workspace "${newWsName.trim()}" created! Configure branding next.`);
        setNewWsName('');
        setShowCreate(false);
        navigate('/settings?tab=workspace');
      } else {
        toast.error(res?.message || 'Failed to create workspace');
      }
    } catch (err) {
      toast.error(err.message || 'Workspace creation error');
    } finally {
      setWsAction(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    if (!selectedOrg?.id || !deleteModal) return;
    setDeleting(true);
    try {
      const res = await deleteCurrentWorkspace(selectedOrg.id, deleteModal.id);
      if (res?.success !== false) {
        toast.success(`Workspace "${deleteModal.name}" deleted`);
        setDeleteModal(null);
      } else {
        toast.error(res?.message || 'Workspace deletion failed');
      }
    } catch (err) {
      toast.error(err.message || 'Workspace deletion error');
    } finally {
      setDeleting(false);
    }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setFoundUser(null);
    try {
      const res = await listUsers(searchEmail.trim());
      if (res.success && res.users?.length > 0) {
        setFoundUser(res.users[0]);
      } else {
        setSearchError("No active user found with this email address");
      }
    } catch (err) {
      setSearchError(err.message || "User lookup error");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!foundUser || !selectedOrg?.id || !selectedWorkspace?.id) return;
    setMemberAction(true);
    try {
      await addNewMember(selectedOrg.id, selectedWorkspace.id, foundUser.email, inviteRole);
      toast.success(`${foundUser.firstName} added as ${inviteRole}`);
      setFoundUser(null);
      setSearchEmail('');
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setMemberAction(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setMemberAction(true);
    try {
      await updateRole(selectedOrg.id, selectedWorkspace.id, memberId, newRole);
      toast.success("Member role updated");
    } catch (err) {
      toast.error(err.message || "Role update error");
    } finally {
      setMemberAction(false);
    }
  };

  const handleRemoveMember = async (memberId, email) => {
    if (!selectedOrg?.id || !selectedWorkspace?.id || !window.confirm(`Remove ${email} from this workspace?`)) return;
    setMemberAction(true);
    try {
      await removeMemberFromOrg(selectedOrg.id, selectedWorkspace.id, memberId);
      toast.success("Member removed");
    } catch (err) {
      toast.error(err.message || "Member removal failed");
    } finally {
      setMemberAction(false);
    }
  };

  const roleBadge = (role) => {
    const r = role?.toUpperCase() || "MEMBER";
    const map = {
      OWNER:  "badge badge-primary",
      ADMIN:  "badge badge-purple",
      EDITOR: "badge badge-info",
      ISSUER: "badge badge-success",
      VIEWER: "badge badge-neutral"
    };
    return <span className={map[r] || "badge badge-neutral"}>{r === 'OWNER' ? '👑 OWNER' : r}</span>;
  };

  const memberColumns = [
    {
      field: "user",
      header: "Team Member",
      render: (row) => (
        <div>
          <div className="font-semibold text-primary">{row.user?.firstName} {row.user?.lastName}</div>
          <div className="text-xs text-tertiary">{row.user?.email || row.email}</div>
        </div>
      )
    },
    {
      field: "role",
      header: "Access Role",
      render: (row) => {
        if (row.role === 'OWNER') {
          return roleBadge('OWNER');
        }
        return (
          <select
            className="st-select h-8 text-xs font-semibold w-28"
            value={row.role}
            onChange={e => handleRoleChange(row.id, e.target.value)}
            disabled={memberActionLoading}
          >
            <option value="ADMIN">ADMIN</option>
            <option value="EDITOR">EDITOR</option>
            <option value="ISSUER">ISSUER</option>
            <option value="VIEWER">VIEWER</option>
          </select>
        );
      }
    },
    {
      field: "joinedAt",
      header: "Joined Date",
      render: (row) => <span className="text-xs text-tertiary font-mono">{new Date(row.joinedAt || Date.now()).toLocaleDateString()}</span>
    }
  ];

  if (!selectedOrg) {
    return (
      <div className="page-container">
        <EmptyState
          icon={Folder}
          title="No Organization Selected"
          description="Create your company organization before initializing workspace contexts."
          actionLabel="Create Organization"
          actionPath="/organizations"
        />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col gap-8">
      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDeleteWorkspace}
        title="Delete Workspace"
        resourceName={deleteModal?.name}
        description="This will permanently delete the workspace along with all issued certificates, templates, and batch jobs."
        loading={deleting}
      />

      {/* Header */}
      <div className="page-header mb-0">
        <div>
          <h1 className="page-title">Workspaces & Team Access</h1>
          <p className="page-subtitle">Organize certificate projects and manage role-based operator permissions.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={14} />
          <span>New Workspace</span>
        </button>
      </div>

      {/* New Workspace Inline Creation Card */}
      {showCreate && (
        <form onSubmit={handleCreateWorkspace} className="card flat-card p-4 bg-secondary flex items-center gap-3 flex-wrap">
          <Folder size={18} className="text-brand" />
          <input
            type="text"
            className="st-select h-9 flex-1 min-w-48 text-sm"
            placeholder="Workspace name (e.g. Production Certificates)"
            value={newWsName}
            onChange={e => setNewWsName(e.target.value)}
            required
            autoFocus
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={wsActionLoading}>
              {wsActionLoading ? "Creating..." : "Create Workspace"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowCreate(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Workspaces Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card flat-card h-32 skeleton-shimmer" />)}
        </div>
      ) : workspaces.length === 0 ? (
        <EmptyState
          icon={Folder}
          title="No Workspaces Created"
          description="Create your first workspace project to start issuing digital credentials."
          actionLabel="Create Workspace"
          onAction={() => setShowCreate(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {workspaces.map(ws => {
            const isSelected = selectedWorkspace?.id === ws.id;
            return (
              <div
                key={ws.id}
                onClick={() => selectWorkspace(ws)}
                className={`card flat-card p-4 cursor-pointer transition-all flex flex-col relative ${isSelected ? 'border-brand bg-hover shadow-sm' : 'hover:border-strong'}`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 text-brand" title="Active Workspace">
                    <Check size={16} />
                  </span>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {ws.name?.charAt(0) || "W"}
                  </div>
                  <div className="min-w-0 pr-6">
                    <h4 className="font-bold text-primary truncate text-sm">{ws.name}</h4>
                    <span className="text-xs text-tertiary font-mono">/{ws.slug || ws.id.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-secondary mb-4 mt-auto">
                  {ws.customDomain && (
                    <span className="flex items-center gap-1.5 text-tertiary truncate"><Globe size={13} /> {ws.customDomain}</span>
                  )}
                  <span className={`flex items-center gap-1.5 ${ws.smtpEnabled ? 'text-success font-medium' : 'text-tertiary'}`}>
                    <Mail size={13} /> {ws.smtpEnabled ? 'Custom SMTP Configured' : 'System Email Relay'}
                  </span>
                </div>

                {isSelected && (
                  <div className="flex gap-2 border-t pt-3 mt-auto" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary btn-sm flex-1 justify-center" onClick={() => navigate('/settings?tab=workspace')}>
                      <Settings size={12} />
                      <span>Settings</span>
                    </button>
                    <button className="btn btn-danger btn-sm p-2" onClick={() => setDeleteModal(ws)} title="Delete workspace">
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Team Members & Operator Invitations */}
      {selectedWorkspace && (
        <div className="card flat-card p-0 overflow-hidden flex flex-col">
          <div className="card-header bg-secondary border-b p-4">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-tertiary" />
              <h3 className="card-title">Operators & Access — {selectedWorkspace.name}</h3>
            </div>
          </div>

          {/* User Lookup Bar */}
          <div className="p-4 bg-secondary border-b flex flex-col gap-3">
            <form onSubmit={handleSearchUser} className="flex gap-2 flex-wrap">
              <input
                type="email"
                className="st-select h-9 flex-1 min-w-56 text-xs"
                placeholder="Lookup registered user by email address..."
                value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)}
                disabled={searchLoading}
                required
              />
              <button type="submit" className="btn btn-secondary btn-sm" disabled={searchLoading}>
                {searchLoading ? <Loader2 size={13} className="animate-spin" /> : 'Lookup Operator'}
              </button>
            </form>

            {searchError && <div className="text-xs text-danger font-medium">{searchError}</div>}

            {foundUser && (
              <div className="card flat-card p-3 bg-primary flex items-center justify-between gap-3 flex-wrap border-brand">
                <div>
                  <div className="font-semibold text-xs text-primary">{foundUser.firstName} {foundUser.lastName}</div>
                  <div className="text-xs text-tertiary">{foundUser.email}</div>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    className="st-select h-8 text-xs font-semibold w-28"
                    value={inviteRole}
                    onChange={e => setInviteRole(e.target.value)}
                  >
                    <option value="ADMIN">ADMIN</option>
                    <option value="EDITOR">EDITOR</option>
                    <option value="ISSUER">ISSUER</option>
                    <option value="VIEWER">VIEWER</option>
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleAddMember} disabled={memberActionLoading}>
                    <UserPlus size={13} />
                    <span>Assign Role</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Clean Data Table for Team Members (No duplicate mobile cards bug!) */}
          <DataTable
            columns={memberColumns}
            data={members || []}
            keyField="id"
            isLoading={loading}
            emptyState={
              <EmptyState
                icon={Users}
                title="No Operators Assigned"
                description="Use the email lookup bar above to assign operators to this workspace."
              />
            }
            rowActions={(row) => row.role !== 'OWNER' ? (
              <button
                onClick={() => handleRemoveMember(row.id, row.user?.email || row.email)}
                className="btn-icon p-1.5 text-secondary hover:text-danger"
                title="Revoke Access"
              >
                <UserMinus size={14} />
              </button>
            ) : null}
          />
        </div>
      )}
    </div>
  );
}
