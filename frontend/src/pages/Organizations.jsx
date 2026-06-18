import { useState, useEffect } from "react";
import useOrg from "../hooks/useOrg";
import { Building2, Plus, Check, Pencil } from "lucide-react";
import toast from "react-hot-toast";

export default function Organizations() {
  const { org: orgs, selectedOrg, createOrganization, selectOrganization, listOrganization, loading } = useOrg();
  const [creating, setCreating] = useState(false);
  const [form, setForm]       = useState({ name: "" });
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { listOrganization(1, 50); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setCreating(true);
    try {
      await createOrganization({ name: form.name });
      toast.success("Organization created!");
      setShowForm(false);
      setForm({ name: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Organizations</h1>
          <p className="page-subtitle">Manage your organizations and billing contexts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          <Plus size={14} /> New Organization
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 480 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>Create Organization</h3>
          <form onSubmit={handleCreate} style={{ display: "flex", gap: 10 }}>
            <input
              className="input"
              placeholder="Organization name"
              value={form.name}
              onChange={e => setForm({ name: e.target.value })}
              required
            />
            <button type="submit" disabled={creating} className="btn btn-primary">
              {creating ? "Creating…" : "Create"}
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
          </form>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: 48 }}><span className="spinner" /></div>
      ) : orgs.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <Building2 size={36} />
            <h3>No organizations yet</h3>
            <p>Create your first organization to get started.</p>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {orgs.map(org => (
            <div
              key={org.id}
              className="card"
              style={{
                cursor: "pointer",
                border: selectedOrg?.id === org.id ? "2px solid var(--brand-primary)" : "1px solid var(--border-color)",
                background: selectedOrg?.id === org.id ? "var(--brand-primary-light)" : "var(--bg-card)",
                position: "relative",
              }}
              onClick={() => selectOrganization(org)}
            >
              {selectedOrg?.id === org.id && (
                <div style={{ position: "absolute", top: 12, right: 12, background: "var(--brand-primary)", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={13} style={{ color: "#fff" }} />
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  {org.logoUrl ? (
                    <img src={org.logoUrl} alt="" style={{ width: 40, height: 40, borderRadius: 10, objectFit: "cover" }} />
                  ) : (
                    <Building2 size={18} style={{ color: "#fff" }} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>{org.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>/{org.slug}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-secondary)" }}>
                <span>{org.credentialsUsed || 0} / {org.credentialLimit || "∞"} creds</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}