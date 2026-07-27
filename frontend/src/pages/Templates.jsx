import { useState } from "react";
import useSWR from "swr";
import { Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listTemplates, deleteTemplate } from "../services/templateServices";
import SearchToolbar from "../components/ui/SearchToolbar";
import EmptyState from "../components/ui/EmptyState";
import { Plus, Trash2, FileText, Pencil, ExternalLink } from "lucide-react";
import toast from "react-hot-toast";

export default function Templates() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const limit = 12;

  const { data, isLoading, mutate } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id
      ? ['templates-list', selectedOrg.id, selectedWorkspace.id, page, searchQuery]
      : null,
    ([_, orgId, wsId, p, q]) => listTemplates(orgId, wsId, p, limit, q || undefined)
  );

  const templates = data?.templates || [];
  const total = data?.total || 0;
  const loading = isLoading && !data;

  const handleDelete = async (id, name) => {
    const confirmed = await new Promise(resolve => {
      toast(
        (t) => (
          <div>
            <div className="font-semibold mb-1">Delete "{name}"?</div>
            <div className="text-xs text-secondary mb-3">This will permanently remove the template and cannot be recovered.</div>
            <div className="flex gap-2">
              <button className="btn btn-danger btn-sm" onClick={() => { toast.dismiss(t.id); resolve(true); }}>Delete Permanently</button>
              <button className="btn btn-ghost btn-sm" onClick={() => { toast.dismiss(t.id); resolve(false); }}>Cancel</button>
            </div>
          </div>
        ),
        { duration: 8000 }
      );
    });
    if (!confirmed) return;
    try {
      await deleteTemplate(selectedOrg.id, selectedWorkspace.id, id);
      toast.success("Template deleted successfully");
      mutate();
    } catch (err) {
      toast.error(err.message || 'Template deletion failed');
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container">
        <EmptyState
          icon={FileText}
          title="No Active Workspace"
          description="Choose an active workspace to view certificate visual templates."
          actionLabel="Go to Organizations"
          actionPath="/organizations"
        />
      </div>
    );
  }

  return (
    <div className="page-container flex flex-col gap-6">
      <div className="page-header mb-0">
        <div>
          <h1 className="page-title">Certificate Design Templates</h1>
          <p className="page-subtitle">{total} design layouts across {selectedWorkspace.name}</p>
        </div>
        <Link to="/templates/create" className="btn btn-primary">
          <Plus size={14} /> Create Template
        </Link>
      </div>

      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Search templates by name..."
        totalCount={total}
      />

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="card flat-card p-4">
              <div className="skeleton-shimmer h-36 rounded mb-3" />
              <div className="skeleton-shimmer h-4 w-3/4 mb-2" />
              <div className="skeleton-shimmer h-3 w-1/2" />
            </div>
          ))}
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No Templates Yet"
          description={searchQuery ? "No templates match your search query." : "Create your first certificate layout template to define background designs and text positions."}
          actionLabel={!searchQuery ? "Create Template" : undefined}
          actionPath={!searchQuery ? "/templates/create" : undefined}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {templates.map(temp => (
            <div key={temp.id} className="card flat-card p-4 flex flex-col transition-all hover:border-brand relative group">
              <Link to={`/templates/${temp.id}`} className="block aspect-video bg-tertiary rounded flex items-center justify-center mb-3 relative overflow-hidden template-card-thumb">
                {temp.thumbnailUrl || temp.backgroundImageUrl ? (
                  <img src={temp.thumbnailUrl || temp.backgroundImageUrl} alt={temp.name} className="w-full h-full object-cover" />
                ) : (
                  <FileText size={32} className="text-tertiary" />
                )}
                <div className="template-card-overlay">
                  <span>Edit Layout</span>
                  <ExternalLink size={12} />
                </div>
              </Link>

              <div className="flex-1 min-w-0 mb-3">
                <Link to={`/templates/${temp.id}`} className="font-semibold text-primary hover:text-brand truncate block">
                  {temp.name}
                </Link>
                <p className="text-xs text-tertiary truncate mt-0.5">{temp.description || "Certificate layout"}</p>
              </div>

              <div className="flex items-center justify-between border-t pt-3 mt-auto">
                <span className="text-xs text-tertiary font-mono">{temp.width}×{temp.height}px</span>
                <div className="flex items-center gap-1">
                  <Link to={`/templates/${temp.id}`} className="btn-icon p-1 text-secondary hover:text-primary" title="Edit">
                    <Pencil size={14} />
                  </Link>
                  <button onClick={() => handleDelete(temp.id, temp.name)} className="btn-icon p-1 text-secondary hover:text-danger" title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
