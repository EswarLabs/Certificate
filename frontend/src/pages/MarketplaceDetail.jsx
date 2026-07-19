import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  getPublicTemplateById, copyPublicTemplate, toggleLikeTemplate, reportPublicTemplate
} from "../services/marketplaceServices";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import CanvasEditor from "../components/editor/CanvasEditor";
import {
  ArrowLeft, Heart, Download, Eye, Flag, Check, Copy, Layers,
  AlertCircle, Loader2, ChevronRight, Building2, Folder, Star,
  Calendar, Shield
} from "lucide-react";
import toast from "react-hot-toast";

export default function MarketplaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedOrg, org: organizations } = useOrg();
  const { selectedWorkspace, workspaces } = useWorkspace();

  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copying, setCopying] = useState(false);
  const [copied, setCopied] = useState(false);

  // Copy destination — pre-fill from current context
  const [targetOrgId, setTargetOrgId] = useState("");
  const [targetWsId, setTargetWsId] = useState("");

  // Report
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reporting, setReporting] = useState(false);

  useEffect(() => {
    if (selectedOrg?.id) setTargetOrgId(selectedOrg.id);
    if (selectedWorkspace?.id) setTargetWsId(selectedWorkspace.id);
  }, [selectedOrg, selectedWorkspace]);

  useEffect(() => {
    setLoading(true);
    getPublicTemplateById(id)
      .then(res => {
        if (res.success && res.template) setTemplate(res.template);
        else { toast.error("Template not found"); navigate("/marketplace"); }
      })
      .catch(() => toast.error("Failed to load template details"))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleLike = async () => {
    try {
      const res = await toggleLikeTemplate(id);
      if (res.success) setTemplate(prev => ({ ...prev, likesCount: res.likesCount, isLiked: res.isLiked }));
    } catch { toast.error("Please login to like templates"); }
  };

  const handleCopy = async () => {
    if (!targetOrgId || !targetWsId) {
      toast.error("Select an organization and workspace");
      return;
    }
    setCopying(true);
    try {
      const res = await copyPublicTemplate(id, targetOrgId, targetWsId);
      if (res.success && res.copiedTemplate) {
        setCopied(true);
        toast.success("Template copied! Opening editor…");
        setTimeout(() => navigate(`/templates/${res.copiedTemplate.id}`), 1200);
      } else {
        toast.error(res.message || "Failed to copy template");
      }
    } catch (err) {
      toast.error(err.message || "An error occurred");
    } finally {
      setCopying(false);
    }
  };

  const handleReport = async (e) => {
    e.preventDefault();
    setReporting(true);
    try {
      const res = await reportPublicTemplate(id, reportReason, reportDetails);
      if (res.success) {
        toast.success("Report submitted");
        setShowReportModal(false);
      } else {
        toast.error("Failed to submit report");
      }
    } catch { toast.error("Failed to submit report"); }
    finally { setReporting(false); }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
        <Loader2 size={32} style={{ animation: "spin 0.7s linear infinite", color: "var(--brand-primary)" }} />
      </div>
    );
  }

  if (!template) return null;

  const canCopy = targetOrgId && targetWsId && !copied;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)" }}>
      {/* ── Top bar ── */}
      <div style={{
        borderBottom: "1px solid var(--border-color)",
        background: "var(--bg-card)",
        position: "sticky",
        top: 0,
        zIndex: 30,
        padding: "0 16px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        height: 52,
        gap: 12,
      }}>
        <Link
          to="/marketplace"
          style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 600, color: "var(--text-primary)", textDecoration: "none", flexShrink: 0 }}
        >
          <ArrowLeft size={16} /> Marketplace
        </Link>

        <div style={{ overflow: "hidden", flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
            {template.title}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <button
            onClick={handleLike}
            className="btn btn-secondary btn-sm"
            style={{
              background: template.isLiked ? "rgba(239,68,68,0.08)" : undefined,
              borderColor: template.isLiked ? "rgba(239,68,68,0.25)" : undefined,
              color: template.isLiked ? "var(--danger)" : undefined,
            }}
          >
            <Heart size={14} style={{ fill: template.isLiked ? "currentColor" : "none" }} />
            {template.likesCount}
          </button>
          <button onClick={() => setShowReportModal(true)} className="btn-icon" title="Report" style={{ color: "var(--text-tertiary)", width: 32, height: 32 }}>
            <Flag size={14} />
          </button>
        </div>
      </div>

      {/* ── Split pane layout ── */}
      <div className="mkt-detail-layout">
        {/* Left: Preview */}
        <div className="mkt-detail-preview">
          <div style={{
            width: "100%", maxWidth: 700, background: "var(--bg-card)",
            borderRadius: "var(--radius-xl)", overflow: "hidden",
            boxShadow: "var(--shadow-xl)", border: "1px solid var(--border-color)"
          }}>
            {template.editorData ? (
              <div style={{ pointerEvents: "none", overflow: "hidden" }}>
                <CanvasEditor
                  initialData={template.editorData}
                  orientation={template.editorData.orientation || "LANDSCAPE"}
                  variables={{ recipientName: "Johnathan Doe", courseTitle: "Advanced Masterclass", issuedAt: "2026-06-28" }}
                  onChange={() => {}}
                />
              </div>
            ) : template.thumbnailUrl ? (
              <img src={template.thumbnailUrl} alt={template.title} style={{ width: "100%", display: "block" }} />
            ) : (
              <div style={{ aspectRatio: "16/9", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-tertiary)" }}>
                <Layers size={48} style={{ color: "var(--text-tertiary)" }} />
              </div>
            )}
          </div>

          {/* Preview caption */}
          <div style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", background: "var(--bg-overlay)", backdropFilter: "blur(8px)", borderRadius: "var(--radius-full)", padding: "5px 14px", fontSize: 11, color: "#fff", whiteSpace: "nowrap" }}>
            Sample data — your certificate will use real recipient info
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="mkt-detail-sidebar">
          {/* Title & stats */}
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--text-primary)", margin: "0 0 8px", lineHeight: 1.25 }}>
              {template.title}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 12, color: "var(--text-tertiary)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Eye size={12} /> {template.viewsCount} views</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Download size={12} /> {template.copiesCount} copies</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Heart size={12} /> {template.likesCount} likes</span>
            </div>
          </div>

          {/* Creator */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "var(--bg-secondary)", borderRadius: "var(--radius-lg)", border: "1px solid var(--border-color)" }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: "linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
              {template.creator?.user?.firstName?.[0] || "C"}
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}>
                {template.creator?.user?.firstName} {template.creator?.user?.lastName}
                {template.creator?.isVerified && <Shield size={12} color="var(--brand-primary)" />}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{template.creator?.organization || "Community Publisher"}</div>
            </div>
          </div>

          {/* Attributes */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {[
              { label: "Industry", value: template.industry, icon: Building2 },
              { label: "Difficulty", value: template.difficulty, icon: Star },
              { label: "License", value: template.license, icon: Shield },
              { label: "Version", value: `v${template.version}`, icon: Calendar },
            ].map(item => {
              const Icon = item.icon;
              return (
                <div key={item.label} style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", padding: "10px 12px", border: "1px solid var(--border-color)" }}>
                  <div style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 4, display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon size={10} /> {item.label}
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)" }}>{item.value}</div>
                </div>
              );
            })}
          </div>

          {/* Description */}
          {template.description && (
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>About this template</div>
              <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0 }}>{template.description}</p>
            </div>
          )}

          {/* ── Copy to workspace inline flow ── */}
          <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginBottom: 12 }}>
              Copy to your workspace
            </div>

            {copied ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 14px", background: "var(--success-light)", borderRadius: "var(--radius-lg)", border: "1px solid var(--success)", color: "var(--success-text)" }}>
                <Check size={16} />
                <span style={{ fontSize: 13, fontWeight: 600 }}>Copied! Opening editor…</span>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Org selector */}
                <div>
                  <label className="label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <Building2 size={11} /> Organization
                  </label>
                  <select
                    className="input"
                    value={targetOrgId}
                    onChange={e => setTargetOrgId(e.target.value)}
                  >
                    <option value="">Select organization…</option>
                    {(organizations || []).map(o => (
                      <option key={o.id} value={o.id}>{o.name}</option>
                    ))}
                  </select>
                </div>

                {/* Workspace selector */}
                <div>
                  <label className="label" style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <Folder size={11} /> Workspace
                  </label>
                  <select
                    className="input"
                    value={targetWsId}
                    onChange={e => setTargetWsId(e.target.value)}
                  >
                    <option value="">Select workspace…</option>
                    {(workspaces || []).map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleCopy}
                  disabled={!canCopy || copying}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", fontSize: 14, fontWeight: 700, padding: "12px" }}
                >
                  {copying
                    ? <><Loader2 size={15} style={{ animation: "spin 0.7s linear infinite" }} /> Copying…</>
                    : <><Copy size={15} /> Use This Template <ChevronRight size={14} /></>
                  }
                </button>

                <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, textAlign: "center" }}>
                  An editable clone will be added to your workspace.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Report Modal ── */}
      {showReportModal && (
        <div className="modal-backdrop">
          <div className="modal-box card" style={{ maxWidth: 460, width: "100%", padding: 24 }}>
            <form onSubmit={handleReport} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--danger)", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertCircle size={18} /> Report Template
              </h3>
              <div className="form-group">
                <label className="label">Reason</label>
                <select value={reportReason} onChange={e => setReportReason(e.target.value)} className="input">
                  <option value="SPAM">Spam or Misleading</option>
                  <option value="COPYRIGHT">Copyright Violation</option>
                  <option value="INAPPROPRIATE">Inappropriate Content</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Details</label>
                <textarea
                  value={reportDetails}
                  onChange={e => setReportDetails(e.target.value)}
                  rows={3}
                  placeholder="Provide context for the moderation team…"
                  className="input"
                  style={{ minHeight: 80, resize: "vertical" }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
                <button type="button" onClick={() => setShowReportModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={reporting} className="btn btn-danger">
                  {reporting ? "Submitting…" : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
