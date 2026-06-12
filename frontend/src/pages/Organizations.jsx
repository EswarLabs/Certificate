import React, { useEffect, useState } from 'react';
import useOrg from '../hooks/useOrg';

function Organizations() {
  const {
    org,
    selectedOrg,
    loading,
    error,
    selectOrganization,
    createOrganization,
    updateOrganization,
    deleteOrganization,
  } = useOrg();

  const [newOrgName, setNewOrgName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  // Edit organization state
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLogoUrl, setEditLogoUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createOrganization(newOrgName.trim());
      setNewOrgName('');
    } catch (err) {
      setCreateError(err.message || 'Failed to create organization');
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!selectedOrg || !editName.trim()) return;
    setUpdating(true);
    try {
      await updateOrganization(selectedOrg.id, editName.trim(), editLogoUrl.trim() || null);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || 'Failed to update organization');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedOrg) return;
    if (!confirm('Are you sure you want to delete this organization? All workspaces and data under it will be lost.')) return;
    try {
      await deleteOrganization(selectedOrg.id);
    } catch (err) {
      alert(err.message || 'Failed to delete organization');
    }
  };

  const handleSelect = (e) => {
    const orgId = e.target.value;
    const found = org.find((o) => o.id === orgId);
    if (found) selectOrganization(found);
  };

  // Populate edit fields when editing is toggled
  useEffect(() => {
    if (selectedOrg) {
      setEditName(selectedOrg.name || '');
      setEditLogoUrl(selectedOrg.logoUrl || '');
    }
  }, [selectedOrg, isEditing]);

  // Default to first organization if none selected
  useEffect(() => {
    if (!selectedOrg && org && org.length > 0) {
      selectOrganization(org[0]);
    }
  }, [org, selectedOrg]);

  if (error) {
    return <div style={{ color: 'red', padding: '16px' }}>Error: {error}</div>;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      {loading && <div style={{ color: 'green', marginBottom: '16px' }}>Processing organization operations...</div>}
      
      <h1>Organizations</h1>

      {/* Switch Organization Selector */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '8px', alignItems: 'center' }}>
        <label htmlFor="org-select" style={{ fontWeight: 'bold' }}>Active Organization:</label>
        <select
          id="org-select"
          onChange={handleSelect}
          value={selectedOrg?.id || ''}
          style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
        >
          <option value="" disabled>Select Organization</option>
          {org && org.map((o) => (
            <option key={o.id} value={o.id}>{o.name}</option>
          ))}
        </select>
      </div>

      {/* Create Organization Form */}
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '24px', backgroundColor: '#f9fafb' }}>
        <h2>Create Organization</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Organization Name"
            value={newOrgName}
            onChange={(e) => setNewOrgName(e.target.value)}
            disabled={creating}
            style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid #d1d5db' }}
            required
          />
          <button type="submit" disabled={creating}>
            {creating ? 'Creating...' : '+ Create'}
          </button>
        </form>
        {createError && <div style={{ color: 'red', marginTop: '8px' }}>{createError}</div>}
      </div>

      {/* Active Organization Card */}
      {selectedOrg && (
        <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '24px', backgroundColor: '#fff' }}>
          {!isEditing ? (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ margin: '0 0 12px 0' }}>{selectedOrg.name}</h2>
                  <p><strong>ID:</strong> {selectedOrg.id}</p>
                  <p><strong>Slug:</strong> {selectedOrg.slug}</p>
                  <p><strong>Credential Limit:</strong> {selectedOrg.credentialLimit}</p>
                  <p><strong>Credentials Used:</strong> {selectedOrg.credentialsUsed}</p>
                  <p><strong>Created At:</strong> {new Date(selectedOrg.createdAt).toLocaleString()}</p>
                </div>
                {selectedOrg.logoUrl && (
                  <img src={selectedOrg.logoUrl} alt="Logo" style={{ maxWidth: '120px', maxHeight: '120px', borderRadius: '8px' }} />
                )}
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button onClick={() => setIsEditing(true)}>Edit Details</button>
                <button onClick={handleDelete} style={{ color: 'red', backgroundColor: '#fef2f2', border: '1px solid #fee2e2' }}>
                  Delete Organization
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <h2>Edit Organization</h2>
              <label>
                Organization Name
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  disabled={updating}
                  style={{ display: 'block', width: '100%', padding: '8px', margin: '4px 0 12px 0' }}
                  required
                />
              </label>
              <label>
                Logo URL
                <input
                  type="url"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  disabled={updating}
                  style={{ display: 'block', width: '100%', padding: '8px', margin: '4px 0 12px 0' }}
                />
              </label>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="submit" disabled={updating}>
                  {updating ? 'Saving...' : 'Save Changes'}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} disabled={updating} style={{ backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db' }}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}

export default Organizations;