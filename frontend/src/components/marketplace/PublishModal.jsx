import { useState, useEffect } from "react";
import useOrg from "../../hooks/useOrg";
import useWorkspace from "../../hooks/useWorkspace";
import { listTemplates } from "../../services/templateServices";
import { publishTemplate } from "../../services/marketplaceServices";
import { X, Globe, AlertTriangle, Check, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

export default function PublishModal({ isOpen, onClose, onSuccess }) {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const [workspaceTemplates, setWorkspaceTemplates] = useState([]);
  const [loadingTemps, setLoadingTemps] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [industry, setIndustry] = useState("General");
  const [difficulty, setDifficulty] = useState("BEGINNER");
  const [categoryInput, setCategoryInput] = useState("Education, Corporate");
  const [tagInput, setTagInput] = useState("certificate, award, modern");
  const [license, setLicense] = useState("CC-BY-4.0");
  
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && selectedOrg?.id && selectedWorkspace?.id) {
      setLoadingTemps(true);
      listTemplates(selectedOrg.id, selectedWorkspace.id, 1, 50)
        .then((res) => {
          if (res.templates) setWorkspaceTemplates(res.templates);
        })
        .finally(() => setLoadingTemps(false));
    }
  }, [isOpen, selectedOrg, selectedWorkspace]);

  const handleTemplateSelect = (id) => {
    setSelectedTemplateId(id);
    const temp = workspaceTemplates.find((t) => t.id === id);
    if (temp) {
      setTitle(temp.name);
      setDescription(temp.description || "A clean, professionally designed certificate layout.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplateId) {
      toast.error("Please select a template to publish");
      return;
    }
    if (title.length < 3) {
      toast.error("Title must be at least 3 characters");
      return;
    }
    if (description.length < 10) {
      toast.error("Description must be at least 10 characters");
      return;
    }

    setSubmitting(true);
    try {
      const categories = categoryInput.split(",").map((s) => s.trim()).filter(Boolean);
      const tags = tagInput.split(",").map((s) => s.trim()).filter(Boolean);

      const res = await publishTemplate({
        organizationId: selectedOrg.id,
        workspaceId: selectedWorkspace.id,
        templateId: selectedTemplateId,
        title,
        description,
        industry,
        difficulty,
        license,
        categories: categories.length ? categories : ["General"],
        tags: tags.length ? tags : ["certificate"],
      });

      if (res.success || res.template) {
        toast.success("Template published to Community Marketplace! 🎉");
        onSuccess?.();
        onClose();
      } else {
        toast.error(res.message || "Failed to publish template");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal-box card" style={{ maxWidth: 540, width: '100%', padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid var(--border-color)',
          background: 'var(--bg-secondary)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} style={{ color: 'var(--brand-primary)' }} />
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Publish to Community</h2>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ width: 32, height: 32 }}
            type="button"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '80vh', overflowY: 'auto' }}>
          <div style={{
            background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)',
            padding: '12px 14px', borderRadius: 'var(--radius-md)', display: 'flex', gap: 10,
            fontSize: 12, color: 'var(--warning)', lineHeight: 1.5
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Public Visibility Warning: </strong>
              Publishing makes this template layout and placeholder variables publicly accessible. Do not include proprietary secrets or real personal data.
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Select Workspace Template *</label>
            {loadingTemps ? (
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)', padding: '8px 0' }}>Loading templates...</div>
            ) : workspaceTemplates.length === 0 ? (
              <div style={{ fontSize: 13, color: 'var(--danger)', padding: '8px 0' }}>No templates found in active workspace.</div>
            ) : (
              <select
                value={selectedTemplateId}
                onChange={(e) => handleTemplateSelect(e.target.value)}
                className="input"
                required
              >
                <option value="">-- Choose a template --</option>
                {workspaceTemplates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Public Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Modern Hackathon Winner Certificate"
              className="input"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the aesthetic, suitable use cases, and typography..."
              className="input"
              style={{ minHeight: 80, resize: 'vertical' }}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="flex flex-col gap-1">
              <label className="label">Industry</label>
              <select
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="input"
              >
                <option value="General">General</option>
                <option value="Technology">Technology</option>
                <option value="Education">Education</option>
                <option value="Corporate">Corporate</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Finance">Finance</option>
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="label">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="input"
              >
                <option value="BEGINNER">Beginner</option>
                <option value="INTERMEDIATE">Intermediate</option>
                <option value="ADVANCED">Advanced</option>
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Categories (comma separated)</label>
            <input
              type="text"
              value={categoryInput}
              onChange={(e) => setCategoryInput(e.target.value)}
              placeholder="Education, Corporate, Hackathon"
              className="input"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="label">Tags (comma separated)</label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="certificate, modern, dark, elegant"
              className="input"
            />
          </div>

          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 16,
            borderTop: '1px solid var(--border-color)', marginTop: 8
          }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
            >
              {submitting ? "Publishing..." : "Publish Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
