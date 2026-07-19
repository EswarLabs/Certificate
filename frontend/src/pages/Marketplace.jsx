import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { listPublicTemplates, toggleLikeTemplate } from "../services/marketplaceServices";
import PublishModal from "../components/marketplace/PublishModal";
import {
  Search, Sparkles, Heart, Eye, Download, Plus, Globe,
  Layers, ArrowRight, TrendingUp, Star, Clock, Copy
} from "lucide-react";
import toast from "react-hot-toast";

const INDUSTRIES = ["All", "Technology", "Education", "Corporate", "Healthcare", "Finance"];
const SORT_OPTIONS = [
  { id: "trending",  label: "Trending",  icon: TrendingUp },
  { id: "popular",   label: "Popular",   icon: Star },
  { id: "newest",    label: "Newest",    icon: Clock },
  { id: "copied",    label: "Most Used", icon: Copy },
];

export default function Marketplace() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("All");
  const [sortBy, setSortBy] = useState("trending");
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await listPublicTemplates({
        search: searchQuery || undefined,
        industry: selectedIndustry !== "All" ? selectedIndustry : undefined,
        sort: sortBy,
      });
      if (res.templates) setTemplates(res.templates);
    } catch (err) {
      console.error("Failed to load marketplace templates:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTemplates(); }, [selectedIndustry, sortBy]);

  const handleSearchSubmit = (e) => { e.preventDefault(); fetchTemplates(); };

  const handleLike = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await toggleLikeTemplate(id);
      if (res.success) {
        setTemplates(prev => prev.map(t => t.id === id ? { ...t, likesCount: res.likesCount, isLiked: res.isLiked } : t));
      }
    } catch {
      toast.error("Please login to like templates");
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "var(--bg-primary)", paddingBottom: 80 }}>
      {/* ── Hero ── */}
      <div className="mkt-hero">
        <div className="mkt-hero-inner">
          <div className="mkt-hero-badge">
            <Sparkles size={12} /> Community Marketplace
          </div>
          <h1 className="mkt-hero-title">
            Discover & Share Certificate Templates
          </h1>
          <p className="mkt-hero-desc">
            Copy any template into your workspace in one click and start issuing verified credentials instantly.
          </p>

          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="mkt-search-wrap">
            <Search size={16} className="mkt-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by title, style, or industry…"
              className="mkt-search-input"
            />
            <button type="submit" className="mkt-search-btn">Search</button>
          </form>

          {/* Publish CTA */}
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="btn"
              style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.25)", backdropFilter: "blur(4px)" }}
            >
              <Plus size={14} /> Publish Your Template
            </button>
          </div>
        </div>
      </div>

      {/* ── Sticky Filter Bar ── */}
      <div className="mkt-filter-bar">
        {/* Industry pills */}
        <div className="mkt-filter-pills">
          {INDUSTRIES.map(ind => (
            <button
              key={ind}
              onClick={() => setSelectedIndustry(ind)}
              className={`btn btn-sm ${selectedIndustry === ind ? "btn-primary" : "btn-secondary"}`}
              style={{ borderRadius: "var(--radius-full)", whiteSpace: "nowrap" }}
            >
              {ind}
            </button>
          ))}
        </div>

        {/* Sort tabs */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, background: "var(--bg-tertiary)", padding: 3, borderRadius: "var(--radius-lg)", flexShrink: 0 }}>
          {SORT_OPTIONS.map(opt => {
            const Icon = opt.icon;
            return (
              <button
                key={opt.id}
                onClick={() => setSortBy(opt.id)}
                className="btn btn-sm"
                style={{
                  borderRadius: "var(--radius-md)",
                  border: "none",
                  fontSize: 12,
                  background: sortBy === opt.id ? "var(--bg-card)" : "transparent",
                  color: sortBy === opt.id ? "var(--brand-primary)" : "var(--text-secondary)",
                  fontWeight: sortBy === opt.id ? 600 : 500,
                  boxShadow: sortBy === opt.id ? "var(--shadow-xs)" : "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Icon size={12} /> {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        {loading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="skeleton-card">
                <div className="skeleton" style={{ aspectRatio: "4/3", borderRadius: "var(--radius-lg)", marginBottom: 12 }} />
                <div className="skeleton skeleton-text" style={{ width: "70%", marginBottom: 6 }} />
                <div className="skeleton skeleton-text-sm" style={{ width: "40%" }} />
              </div>
            ))}
          </div>
        ) : templates.length === 0 ? (
          <div className="empty-state" style={{ padding: "80px 24px" }}>
            <div className="empty-state-icon"><Globe size={28} style={{ opacity: 0.4 }} /></div>
            <h3>No templates found</h3>
            <p>We couldn't find any public templates matching your criteria. Be the first to publish one!</p>
            <div className="empty-actions">
              <button onClick={() => setIsPublishModalOpen(true)} className="btn btn-primary">
                Publish a Template
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 20 }}>
            {templates.map(temp => (
              <Link key={temp.id} to={`/marketplace/${temp.id}`} className="mkt-card">
                {/* Thumbnail with hover overlay */}
                <div className="mkt-card-thumb">
                  {temp.thumbnailUrl ? (
                    <img src={temp.thumbnailUrl} alt={temp.title} loading="lazy" />
                  ) : (
                    <Layers size={36} style={{ color: "var(--text-tertiary)" }} />
                  )}

                  {/* Difficulty badge */}
                  {temp.difficulty && (
                    <div style={{
                      position: "absolute", top: 10, left: 10,
                      padding: "3px 8px", borderRadius: "var(--radius-sm)",
                      background: "rgba(15,23,42,0.65)", backdropFilter: "blur(4px)",
                      color: "#fff", fontSize: 10, fontWeight: 700,
                      textTransform: "uppercase", letterSpacing: "0.05em",
                    }}>
                      {temp.difficulty}
                    </div>
                  )}

                  {/* Hover Overlay — action buttons */}
                  <div className="mkt-card-overlay">
                    <button
                      className="btn btn-sm"
                      style={{ background: "#fff", color: "var(--text-primary)", fontWeight: 700, minWidth: 140 }}
                      onClick={e => { e.preventDefault(); navigate(`/marketplace/${temp.id}`); }}
                    >
                      <ArrowRight size={13} /> Use This Template
                    </button>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        className="btn btn-sm"
                        style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                        onClick={e => { e.preventDefault(); navigate(`/marketplace/${temp.id}`); }}
                      >
                        <Eye size={12} /> Preview
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: "rgba(255,255,255,0.15)", color: temp.isLiked ? "#f87171" : "#fff", border: "1px solid rgba(255,255,255,0.2)" }}
                        onClick={e => handleLike(e, temp.id)}
                      >
                        <Heart size={12} style={{ fill: temp.isLiked ? "currentColor" : "none" }} />
                        {temp.likesCount}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Card body */}
                <div className="mkt-card-body">
                  <div className="mkt-card-title">{temp.title}</div>
                  <div className="mkt-card-desc">{temp.description}</div>

                  <div className="mkt-card-footer">
                    <div className="mkt-card-author">
                      <div className="mkt-card-author-avatar">
                        {temp.creator?.user?.firstName?.[0] || "C"}
                      </div>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 90 }}>
                        {temp.creator?.user?.firstName || "Community"}
                      </span>
                    </div>
                    <div className="mkt-stats">
                      <span className="mkt-stat"><Eye size={11} /> {temp.viewsCount}</span>
                      <span className="mkt-stat"><Download size={11} /> {temp.copiesCount}</span>
                      <button
                        onClick={e => handleLike(e, temp.id)}
                        style={{ display: "inline-flex", alignItems: "center", gap: 3, background: "none", border: "none", cursor: "pointer", color: "var(--danger)", fontSize: 11, padding: 0 }}
                      >
                        <Heart size={11} style={{ fill: temp.isLiked ? "currentColor" : "none" }} />
                        {temp.likesCount}
                      </button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Count */}
        {!loading && templates.length > 0 && (
          <div style={{ textAlign: "center", marginTop: 40, fontSize: 13, color: "var(--text-tertiary)" }}>
            Showing {templates.length} templates
          </div>
        )}
      </div>

      <PublishModal
        isOpen={isPublishModalOpen}
        onClose={() => setIsPublishModalOpen(false)}
        onSuccess={fetchTemplates}
      />
    </div>
  );
}
