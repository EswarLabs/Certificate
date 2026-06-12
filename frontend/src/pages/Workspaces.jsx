import React, { useEffect, useState } from 'react';
import useWorkspace from '../hooks/useWorkspace';
import useOrg from '../hooks/useOrg';
import { listUsers } from '../services/userServices';

function Workspaces() {
  const {
    workspaces,
    selectedWorkspace,
    members,
    loading,
    error,
    fetchWorkspaces,
    selectWorkspace,
    createNewWorkspace,
    deleteCurrentWorkspace,
    fetchMembers,
    addNewMember,
    removeMemberFromOrg,
    updateRole,
  } = useWorkspace();

  const { selectedOrg } = useOrg();

  // Local state
  const [newWsName, setNewWsName] = useState('');
  const [wsActionLoading, setWsActionLoading] = useState(false);
  
  // Member invite search
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [inviteRole, setInviteRole] = useState('MEMBER');
  const [memberActionLoading, setMemberActionLoading] = useState(false);

  // Fetch workspaces when selected org changes
  useEffect(() => {
    if (selectedOrg?.id) {
      fetchWorkspaces(selectedOrg.id);
    }
  }, [selectedOrg?.id]);

  // Fetch members when selected org changes
  useEffect(() => {
    if (selectedOrg?.id) {
      fetchMembers(selectedOrg.id);
    }
  }, [selectedOrg?.id]);

  // Auto-select first workspace if none selected
  useEffect(() => {
    if (!selectedWorkspace && workspaces.length > 0) {
      selectWorkspace(workspaces[0]);
    }
  }, [workspaces, selectedWorkspace]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    if (!newWsName.trim() || !selectedOrg?.id) return;
    setWsActionLoading(true);
    try {
      await createNewWorkspace(selectedOrg.id, newWsName.trim());
      setNewWsName('');
    } catch (err) {
      alert(err.message);
    } finally {
      setWsActionLoading(false);
    }
  };

  const handleDeleteWorkspace = async (wsId) => {
    if (!selectedOrg?.id) return;
    if (!confirm("Are you sure you want to delete this workspace? This action is irreversible.")) return;
    setWsActionLoading(true);
    try {
      await deleteCurrentWorkspace(selectedOrg.id, wsId);
    } catch (err) {
      alert(err.message);
    } finally {
      setWsActionLoading(false);
    }
  };

  // Search user by email to prepare membership invite
  const handleSearchUser = async (e) => {
    e.preventDefault();
    if (!searchEmail.trim()) return;
    setSearchLoading(true);
    setSearchError(null);
    setFoundUser(null);
    try {
      const res = await listUsers(searchEmail.trim());
      if (res.success && res.users && res.users.length > 0) {
        setFoundUser(res.users[0]);
      } else {
        setSearchError("No user found with this email address");
      }
    } catch (err) {
      setSearchError(err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Add the found user as a member
  const handleAddMember = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id || !foundUser) return;
    setMemberActionLoading(true);
    try {
      const res = await addNewMember(selectedOrg.id, foundUser.id, selectedWorkspace.id, inviteRole);
      if (res && res.success) {
        alert("Member added successfully!");
        setFoundUser(null);
        setSearchEmail('');
      } else {
        alert(res?.message || "Failed to add member");
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!selectedOrg?.id) return;
    if (!confirm("Remove this member from the organization?")) return;
    setMemberActionLoading(true);
    try {
      await removeMemberFromOrg(selectedOrg.id, memberId);
    } catch (err) {
      alert(err.message);
    } finally {
      setMemberActionLoading(false);
    }
  };

  const handleRoleChange = async (memberId, newRole) => {
    if (!selectedOrg?.id) return;
    setMemberActionLoading(true);
    try {
      await updateRole(selectedOrg.id, memberId, newRole);
    } catch (err) {
      alert(err.message);
    } finally {
      setMemberActionLoading(false);
    }
  };

  if (!selectedOrg) {
    return (
      <div style={styles.emptyState}>
        <h2>No Organization Selected</h2>
        <p>Please select an organization first from the Organizations page.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <h1 style={styles.title}>Workspaces</h1>
      <p style={styles.subtitle}>Organization: <strong>{selectedOrg.name}</strong></p>

      {loading && <div style={styles.loading}>Loading...</div>}
      {error && <div style={styles.error}>Error: {error}</div>}

      {/* Create Workspace Section */}
      <form onSubmit={handleCreateWorkspace} style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <input
          type="text"
          placeholder="New Workspace Name"
          value={newWsName}
          onChange={(e) => setNewWsName(e.target.value)}
          disabled={wsActionLoading}
          style={{ flex: 1, padding: '8px 12px', borderRadius: '6px', border: '1px solid #d1d5db' }}
          required
        />
        <button type="submit" disabled={wsActionLoading}>
          {wsActionLoading ? 'Creating...' : '+ Create Workspace'}
        </button>
      </form>

      {/* Workspace Cards */}
      <div style={styles.grid}>
        {workspaces.map((ws) => {
          const isSelected = selectedWorkspace?.id === ws.id;
          return (
            <div
              key={ws.id}
              style={{
                ...styles.card,
                ...(isSelected ? styles.cardSelected : {}),
              }}
              onClick={() => selectWorkspace(ws)}
            >
              <h3 style={styles.cardTitle}>{ws.name}</h3>
              <p style={styles.cardDetail}><strong>ID:</strong> {ws.id}</p>
              <p style={styles.cardDetail}><strong>Slug:</strong> {ws.slug}</p>
              {ws.customDomain && (
                <p style={styles.cardDetail}><strong>Domain:</strong> {ws.customDomain}</p>
              )}
              <p style={styles.cardDetail}>
                <strong>SMTP:</strong> {ws.smtpEnabled ? 'Enabled' : 'Disabled'}
              </p>
              <p style={styles.cardDetail}>
                <strong>Created:</strong> {new Date(ws.createdAt).toLocaleDateString()}
              </p>
              
              {isSelected && <span style={styles.badge}>Selected</span>}

              {/* Delete Workspace Button */}
              {isSelected && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleDeleteWorkspace(ws.id); }}
                  disabled={wsActionLoading}
                  style={{
                    marginTop: '12px',
                    padding: '4px 8px',
                    fontSize: '0.8rem',
                    color: '#ef4444',
                    backgroundColor: '#fef2f2',
                    border: '1px solid #fee2e2',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    width: '100%',
                  }}
                >
                  Delete Workspace
                </button>
              )}
            </div>
          );
        })}
      </div>

      {workspaces.length === 0 && !loading && (
        <div style={styles.emptyState}>
          <p>No workspaces found for this organization.</p>
        </div>
      )}

      {/* Members Section */}
      {selectedWorkspace && (
        <div style={styles.membersSection}>
          <h2>Members of {selectedOrg.name}</h2>
          
          {/* Invite Member Section */}
          <div style={{
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '20px',
            backgroundColor: '#f9fafb'
          }}>
            <h3>Invite Member to Organization</h3>
            <form onSubmit={handleSearchUser} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <input
                type="email"
                placeholder="Search user by email"
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                disabled={searchLoading || memberActionLoading}
                style={{ flex: 1, padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
                required
              />
              <button type="submit" disabled={searchLoading || memberActionLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
            {searchError && <p style={{ color: '#ef4444', fontSize: '0.9rem', margin: 0 }}>{searchError}</p>}
            
            {foundUser && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', padding: '12px', borderRadius: '6px', border: '1px solid #e5e7eb' }}>
                <div>
                  <strong style={{ display: 'block' }}>{foundUser.firstName} {foundUser.lastName}</strong>
                  <span style={{ fontSize: '0.85rem', color: '#6b7280' }}>{foundUser.email}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                    <option value="MEMBER">MEMBER</option>
                    <option value="ADMIN">ADMIN</option>
                    <option value="OWNER">OWNER</option>
                  </select>
                  <button onClick={handleAddMember} disabled={memberActionLoading}>
                    {memberActionLoading ? 'Adding...' : 'Add Member'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {members.length === 0 ? (
            <p style={styles.noMembers}>No members found.</p>
          ) : (
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Email</th>
                  <th style={styles.th}>Role</th>
                  <th style={styles.th}>Joined</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} style={styles.tr}>
                    <td style={styles.td}>
                      {m.user?.firstName} {m.user?.lastName}
                    </td>
                    <td style={styles.td}>{m.user?.email}</td>
                    <td style={styles.td}>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        disabled={memberActionLoading}
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          border: '1px solid #d1d5db',
                          backgroundColor: m.role === 'OWNER' ? '#f5f3ff' : m.role === 'ADMIN' ? '#ecfeff' : '#fff',
                          color: m.role === 'OWNER' ? '#4f46e5' : m.role === 'ADMIN' ? '#0891b2' : '#374151',
                          fontWeight: '600'
                        }}
                      >
                        <option value="OWNER">OWNER</option>
                        <option value="ADMIN">ADMIN</option>
                        <option value="MEMBER">MEMBER</option>
                      </select>
                    </td>
                    <td style={styles.td}>
                      {new Date(m.joinedAt).toLocaleDateString()}
                    </td>
                    <td style={styles.td}>
                      <button
                        onClick={() => handleRemoveMember(m.id)}
                        disabled={memberActionLoading}
                        style={{
                          padding: '2px 8px',
                          fontSize: '0.8rem',
                          color: '#ef4444',
                          backgroundColor: '#fef2f2',
                          border: '1px solid #fee2e2',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

const styles = {
  page: {
    maxWidth: '900px',
    margin: '0 auto',
    padding: '2rem 1rem',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '700',
    marginBottom: '0.25rem',
  },
  subtitle: {
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  loading: {
    color: '#22c55e',
    marginBottom: '1rem',
  },
  error: {
    color: '#ef4444',
    marginBottom: '1rem',
    padding: '0.75rem',
    backgroundColor: '#fef2f2',
    borderRadius: '8px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
    marginBottom: '2rem',
  },
  card: {
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '1.25rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
    position: 'relative',
    backgroundColor: '#fff',
  },
  cardSelected: {
    borderColor: '#4f46e5',
    boxShadow: '0 0 0 2px rgba(79, 70, 229, 0.3)',
    backgroundColor: '#f5f3ff',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '600',
    marginBottom: '0.5rem',
  },
  cardDetail: {
    fontSize: '0.85rem',
    color: '#4b5563',
    margin: '0.2rem 0',
  },
  badge: {
    position: 'absolute',
    top: '12px',
    right: '12px',
    backgroundColor: '#4f46e5',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: '600',
    padding: '2px 8px',
    borderRadius: '9999px',
  },
  emptyState: {
    textAlign: 'center',
    padding: '3rem 1rem',
    color: '#6b7280',
  },
  membersSection: {
    marginTop: '1rem',
    borderTop: '1px solid #e5e7eb',
    paddingTop: '1.5rem',
  },
  noMembers: {
    color: '#9ca3af',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
  },
  tr: {
    borderBottom: '1px solid #f3f4f6',
  },
  td: {
    padding: '0.75rem',
    fontSize: '0.9rem',
    color: '#4b5563',
  },
};

export default Workspaces;
