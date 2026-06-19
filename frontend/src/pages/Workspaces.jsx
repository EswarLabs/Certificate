import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useWorkspace from '../hooks/useWorkspace';
import useOrg from '../hooks/useOrg';
import { listUsers } from '../services/userServices';
import { Folder, Plus, Check, Trash2, UserPlus, UserMinus, Users } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Workspaces() {
  const {
    workspaces, selectedWorkspace, members, loading, error,
    fetchWorkspaces, selectWorkspace, createNewWorkspace,
    deleteCurrentWorkspace, fetchMembers, addNewMember,
    removeMemberFromOrg, updateRole,
  } = useWorkspace();

  const { selectedOrg } = useOrg();

  const [newWsName, setNewWsName]         = useState('');
  const [wsActionLoading, setWsAction]    = useState(false);
  const [searchEmail, setSearchEmail]     = useState('');
  const [foundUser, setFoundUser]         = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError]     = useState(null);
  const [inviteRole, setInviteRole]       = useState('MEMBER');
  const [memberAction, setMemberAction]   = useState(false);
  const [showCreate, setShowCreate]       = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (selectedOrg?.id) { fetchWorkspaces(selectedOrg.id); }
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
      await createNewWorkspace(selectedOrg.id, newWsName.trim());
      setNewWsName(''); setShowCreate(false);
      toast.success('Workspace created! Please configure your SMTP settings.');
      navigate('/settings');
    } catch (err) { toast.error(err.message); }
    finally { setWsAction(false); }
  };

  const handleDeleteWorkspace = async (wsId) => {
    if (!selectedOrg?.id) return;
    if (!window.confirm("Delete this workspace? This is irreversible.")) return;
    setWsAction(true);
    try { await deleteCurrentWorkspace(selectedOrg.id, wsId); toast.success('Workspace deleted'); }
    catch (err) { toast.error(err.message); }
    finally { setWsAction(false); }
  };

  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSearchLoading(true); setSearchError(null); setFoundUser(null);
    try {
      const res = await listUsers(searchEmail.trim());
      if (res.success && res.users?.length > 0) setFoundUser(res.users[0]);
      else setSearchError("No user found with this email");
    } catch (err) { setSearchError(err.message); }
    finally { setSearchLoading(false); }
  };

  const handleAddMember = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id || !foundUser) return;
    setMemberAction(true);
    try {
      const res = await addNewMember(selectedOrg.id, foundUser.id, selectedWorkspace.id, inviteRole);
      if (res?.success) { toast.success('Member added!'); setFoundUser(null); setSearchEmail(''); }
      else toast.error(res?.message || 'Failed to add member');
    } catch (err) { toast.error(err.message); }
    finally { setMemberAction(false); }
  };

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm("Remove this member?")) return;
    setMemberAction(true);
    try { await removeMemberFromOrg(selectedOrg.id, selectedWorkspace.id, memberId); toast.success('Member removed'); }
    catch (err) { toast.error(err.message); }
    finally { setMemberAction(false); }
  };

  const handleRoleChange = async (memberId, newRole) => {
    setMemberAction(true);
    try { await updateRole(selectedOrg.id, selectedWorkspace.id, memberId, newRole); toast.success('Role updated'); }
    catch (err) { toast.error(err.message); }
    finally { setMemberAction(false); }
  };

  if (!selectedOrg) {
    return (
      <div className="page-container">
        <div className="empty-state card">
          <Folder size={36} />
          <h3>No Organization Selected</h3>
          <p>Please select an organization first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workspaces</h1>
          <p className="page-subtitle">{selectedOrg.name}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={14} /> New Workspace
        </button>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}

      {showCreate && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
          <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', gap: 10 }}>
            <input className="input" placeholder="Workspace name" value={newWsName} onChange={e => setNewWsName(e.target.value)} required />
            <button type="submit" disabled={wsActionLoading} className="btn btn-primary">{wsActionLoading ? 'Creating…' : 'Create'}</button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
          </form>
        </div>
      )}

      {/* Workspace Cards */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48 }}><span className="spinner" /></div>
      ) : workspaces.length === 0 ? (
        <div className="card"><div className="empty-state"><Folder size={36} /><h3>No workspaces found</h3></div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginBottom: 32 }}>
          {workspaces.map(ws => {
            const isSelected = selectedWorkspace?.id === ws.id;
            return (
              <div
                key={ws.id}
                className="card"
                style={{ cursor: 'pointer', border: isSelected ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)', background: isSelected ? 'var(--brand-primary-light)' : 'var(--bg-card)', position: 'relative' }}
                onClick={() => selectWorkspace(ws)}
              >
                {isSelected && (
                  <div style={{ position: 'absolute', top: 12, right: 12, background: 'var(--brand-primary)', borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Check size={12} style={{ color: '#fff' }} />
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Folder size={16} style={{ color: '#fff' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ws.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>/{ws.slug}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text-secondary)' }}>
                  {ws.customDomain && <span>🌐 {ws.customDomain}</span>}
                  <span>SMTP: {ws.smtpEnabled ? '✅ Enabled' : '—'}</span>
                  <span>Created {new Date(ws.createdAt).toLocaleDateString()}</span>
                </div>
                {isSelected && (
                  <button
                    className="btn btn-danger btn-sm"
                    style={{ marginTop: 12, width: '100%' }}
                    onClick={e => { e.stopPropagation(); handleDeleteWorkspace(ws.id); }}
                    disabled={wsActionLoading}
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Members */}
      {selectedWorkspace && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={15} />
              <span className="card-title">Members — {selectedWorkspace.name}</span>
            </div>
          </div>

          {/* Invite */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
            <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input className="input" type="email" placeholder="Search user by email…" value={searchEmail}
                onChange={e => setSearchEmail(e.target.value)} disabled={searchLoading} required />
              <button type="submit" disabled={searchLoading} className="btn btn-secondary btn-sm">
                {searchLoading ? 'Searching…' : 'Search'}
              </button>
            </form>
            {searchError && <div className="alert alert-error" style={{ padding: '6px 12px', fontSize: 12 }}>{searchError}</div>}
            {foundUser && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{foundUser.firstName} {foundUser.lastName}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{foundUser.email}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select className="input" style={{ width: 120, padding: '4px 8px' }} value={inviteRole} onChange={e => setInviteRole(e.target.value)}>
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                  <button className="btn btn-primary btn-sm" onClick={handleAddMember} disabled={memberAction}>
                    <UserPlus size={12} /> {memberAction ? 'Adding…' : 'Add'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Members table */}
          {members.length === 0 ? (
            <div style={{ padding: '24px 20px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>No members found</div>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Member</th>
                    <th>Role</th>
                    <th>Joined</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{m.user?.firstName} {m.user?.lastName}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{m.user?.email}</div>
                      </td>
                      <td>
                        <select className="input" style={{ width: 110, padding: '3px 8px', fontSize: 12 }}
                          value={m.role} onChange={e => handleRoleChange(m.id, e.target.value)} disabled={memberAction}>
                          <option value="OWNER">OWNER</option>
                          <option value="ADMIN">ADMIN</option>
                          <option value="MEMBER">MEMBER</option>
                          <option value="VIEWER">VIEWER</option>
                        </select>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{new Date(m.joinedAt).toLocaleDateString()}</td>
                      <td style={{ textAlign: 'right' }}>
                        <button className="btn-icon" style={{ color: 'var(--danger)' }}
                          onClick={() => handleRemoveMember(m.id)} disabled={memberAction}>
                          <UserMinus size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
