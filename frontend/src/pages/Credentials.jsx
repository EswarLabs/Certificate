import { useState, useEffect } from "react";
import useSWR from "swr";
import { Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listCredentials, bulkIssueCredentials } from "../services/credentialServices";
import DataTable from "../components/ui/DataTable";
import SearchToolbar from "../components/ui/SearchToolbar";
import EmptyState from "../components/ui/EmptyState";
import {
  Plus, Upload, Play, GraduationCap, ArrowRight,
  ExternalLink, Mail, CheckCircle, AlertTriangle, MoreHorizontal
} from "lucide-react";
import toast from "react-hot-toast";

export default function Credentials() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [issuing, setIssuing] = useState(false);
  const limit = 15;

  const { data, isLoading, mutate } = useSWR(
    selectedOrg?.id && selectedWorkspace?.id
      ? ['credentials-list', selectedOrg.id, selectedWorkspace.id, page, statusFilter, searchQuery]
      : null,
    ([_, orgId, wsId, p, status, query]) =>
      listCredentials(orgId, wsId, p, limit, status || undefined, query || undefined),
    {
      refreshInterval: (data) => {
        if (!data) return 0;
        const isProcessing = data.credentials?.some(c => c.status === "ISSUED" && !c.imageUrl);
        return isProcessing ? 3000 : 0;
      }
    }
  );

  const credentials = data?.credentials || [];
  const total = data?.total || 0;

  useEffect(() => { setSelectedKeys([]); }, [selectedOrg?.id, selectedWorkspace?.id, page, statusFilter, searchQuery]);

  const handleBulkIssue = async () => {
    if (!selectedKeys.length) return;

    if (!selectedWorkspace?.smtpEnabled && !selectedWorkspace?.smtpConfig?.host) {
      toast.error(
        (t) => (
          <div>
            <strong>SMTP Email Provider Missing</strong>
            <div className="text-xs text-secondary mt-1">Configure custom email branding before issuing verified certificates.</div>
            <Link
              to="/settings?tab=workspace"
              className="text-xs text-brand font-semibold inline-flex items-center gap-1 mt-2"
              onClick={() => toast.dismiss(t.id)}
            >
              Configure SMTP <ArrowRight size={11} />
            </Link>
          </div>
        ),
        { duration: 6000 }
      );
      return;
    }

    setIssuing(true);
    try {
      const res = await bulkIssueCredentials(selectedOrg.id, selectedWorkspace.id, selectedKeys);
      if (res.success || res.job) {
        toast.success(`Issuing ${selectedKeys.length} credentials. Processing asynchronously in queue.`);
        setSelectedKeys([]);
        setTimeout(() => mutate(), 1500);
      } else {
        toast.error(res.message || "Bulk issuing failed");
      }
    } catch (err) {
      toast.error(err.message || "Bulk issuing error");
    } finally {
      setIssuing(false);
    }
  };

  const statusBadge = (status) => {
    const map = {
      ISSUED: "badge badge-success",
      DRAFT:  "badge badge-warning",
      REVOKED: "badge badge-danger",
    };
    return <span className={map[status] || "badge badge-neutral"}>{status}</span>;
  };

  const columns = [
    {
      field: "recipientName",
      header: "Recipient / Entity",
      sortable: true,
      render: (row) => (
        <div>
          <Link to={`/credentials/${row.id}`} className="font-semibold text-primary hover:text-brand block">
            {row.recipientName}
          </Link>
          <div className="text-xs text-tertiary mt-0.5">{row.recipientEmail || row.id}</div>
        </div>
      )
    },
    {
      field: "template",
      header: "Design Template",
      render: (row) => <span className="text-secondary">{row.template?.name || "Standard Layout"}</span>
    },
    {
      field: "status",
      header: "Status",
      render: (row) => statusBadge(row.status)
    },
    {
      field: "createdAt",
      header: "Issued Date",
      sortable: true,
      render: (row) => <span className="text-xs text-tertiary font-mono">{new Date(row.createdAt).toLocaleDateString()}</span>
    }
  ];

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container">
        <EmptyState
          icon={GraduationCap}
          title="No Active Workspace"
          description="Choose an active workspace to manage certificate credentials."
          actionLabel="Go to Organizations"
          actionPath="/organizations"
        />
      </div>
    );
  }

  const draftKeysSelected = selectedKeys.filter(key => {
    const item = credentials.find(c => c.id === key);
    return item?.status === "DRAFT";
  });

  return (
    <div className="page-container flex flex-col gap-6">
      <div className="page-header mb-0">
        <div>
          <h1 className="page-title">Credentials Management</h1>
          <p className="page-subtitle">Issue, verify, and track digital certificates across {selectedWorkspace.name}.</p>
        </div>

        <div className="btn-group">
          <Link to="/credentials/batch" className="btn btn-secondary">
            <Upload size={14} />
            <span>Batch Import CSV</span>
          </Link>
          <Link to="/credentials/create" className="btn btn-primary">
            <Plus size={14} />
            <span>Issue Credential</span>
          </Link>
        </div>
      </div>

      {/* Reusable Search & Bulk Control Bar */}
      <SearchToolbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        placeholder="Filter recipients by name or email..."
        totalCount={total}
        selectedCount={selectedKeys.length}
        filterOptions={[
          { label: "Issued Active", value: "ISSUED" },
          { label: "Draft Pending", value: "DRAFT" },
          { label: "Revoked", value: "REVOKED" }
        ]}
        currentFilter={statusFilter}
        onFilterChange={setStatusFilter}
      >
        {draftKeysSelected.length > 0 && (
          <button className="btn btn-primary btn-sm" onClick={handleBulkIssue} disabled={issuing}>
            <Play size={13} />
            <span>Issue Selected Drafts ({draftKeysSelected.length})</span>
          </button>
        )}
      </SearchToolbar>

      {/* Enterprise Data Table */}
      <DataTable
        columns={columns}
        data={credentials}
        keyField="id"
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        isLoading={isLoading && !data}
        emptyState={
          <EmptyState
            icon={GraduationCap}
            title="No Credentials Found"
            description={searchQuery || statusFilter ? "No certificates match your search filters." : "Start by issuing single credentials or uploading a CSV batch spreadsheet."}
            actionLabel={!(searchQuery || statusFilter) ? "Issue First Credential" : undefined}
            actionPath={!(searchQuery || statusFilter) ? "/credentials/create" : undefined}
          />
        }
        rowActions={(row) => (
          <Link to={`/credentials/${row.id}`} className="btn btn-ghost btn-sm">
            <span>View</span>
            <ArrowRight size={12} />
          </Link>
        )}
      />
    </div>
  );
}
