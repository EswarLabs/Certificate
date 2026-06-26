import { useState, useEffect } from "react";
import useOrg from "../hooks/useOrg";
import EmptyState from "../components/ui/EmptyState";
import { Building2, Plus, Check, Trash2, ShieldCheck, AlertTriangle, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDeleteModal from "../components/ui/ConfirmDeleteModal";

export default function Organizations() {
  const {
    org: orgs,
    selectedOrg,
    createOrganization,
    selectOrganization,
    listOrganization,
    deleteOrganization,
    loading,
  } = useOrg();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "" });
  const [creating, setCreating] = useState(false);
  const [deleteModal, setDeleteModal] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { listOrganization(1, 50); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await createOrganization({ name: form.name.trim() });
      toast.success(`Organization "${form.name.trim()}" created successfully`);
      setShowForm(false);
      setForm({ name: "" });
    } catch (err) {
      toast.error(err.message || "Failed to create organization");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal) return;
    setDeleting(true);
    try {
      await deleteOrganization(deleteModal.id);
      toast.success(`Organization "${deleteModal.name}" deleted`);
      setDeleteModal(null);
    } catch (err) {
      toast.error(err.message || "Failed to delete organization");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="page-container flex flex-col gap-8">
      {/* Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteModal}
        onClose={() => setDeleteModal(null)}
        onConfirm={handleDelete}
        title="Delete Organization"
        resourceName={deleteModal?.name}
        description="This permanently removes the organization hierarchy along with all workspaces, templates, and issued credentials."
        impacts={[
          "All workspaces within this organization",
          "All certificate templates",
          "All issued credentials and audit records",
          "All operator access permissions"
        ]}
        loading={deleting}
      />

      <div className="page-header mb-0">
        <div>
          <h1 className="page-title">Company Organizations</h1>
          <p className="page-subtitle">Manage company entities and billing boundaries across CertManager.</p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} />
          <span>New Organization</span>
        </button>
      </div>

      {/* Inline Create Card */}
      {showForm && (
        <form onSubmit={handleCreate} className="card flat-card p-4 bg-secondary flex items-center gap-3 flex-wrap">
          <Building2 size={18} className="text-brand" />
          <input
            type="text"
            className="st-select h-9 flex-1 min-w-48 text-sm"
            placeholder="Company or Institution name (e.g. Acme Corp)"
            value={form.name}
            onChange={e => setForm({ name: e.target.value })}
            required
            autoFocus
          />
          <div className="flex gap-2">
            <button type="submit" className="btn btn-primary btn-sm" disabled={creating}>
              {creating ? "Creating..." : "Create Organization"}
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {/* Organizations Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <div key={i} className="card flat-card h-32 skeleton-shimmer" />)}
        </div>
      ) : orgs.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Organizations Found"
          description="Create your first organization entity to establish workspace structures."
          actionLabel="Create Organization"
          onAction={() => setShowForm(true)}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {orgs.map(org => {
            const isSelected = selectedOrg?.id === org.id;
            return (
              <div
                key={org.id}
                onClick={() => selectOrganization(org)}
                className={`card flat-card p-4 cursor-pointer transition-all flex flex-col relative ${isSelected ? 'border-brand bg-hover shadow-sm' : 'hover:border-strong'}`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 text-brand" title="Active Organization">
                    <Check size={16} />
                  </span>
                )}

                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                    {org.logoUrl ? (
                      <img src={org.logoUrl} alt="" className="w-full h-full rounded-lg object-cover" />
                    ) : (
                      org.name?.charAt(0) || "O"
                    )}
                  </div>
                  <div className="min-w-0 pr-6">
                    <h4 className="font-bold text-primary truncate text-sm">{org.name}</h4>
                    <span className="text-xs text-tertiary font-mono">/{org.slug || org.id.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-secondary mb-4 mt-auto">
                  <span>{org.credentialsUsed || 0} / {org.credentialLimit || "∞"} certificates</span>
                  <span className={`flex items-center gap-1 ${org.isVerified ? 'text-success font-semibold' : 'text-warning'}`}>
                    {org.isVerified ? <ShieldCheck size={13} /> : <AlertTriangle size={13} />}
                    <span>{org.isVerified ? "Verified" : "Unverified"}</span>
                  </span>
                </div>

                {isSelected && (
                  <div className="border-t pt-3 mt-auto" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-danger btn-sm w-full justify-center" onClick={() => setDeleteModal(org)}>
                      <Trash2 size={13} />
                      <span>Delete Organization</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}