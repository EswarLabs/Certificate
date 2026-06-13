import { useState, useEffect, useRef } from "react";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listFiles, deleteFile } from "../services/fileServices";
import { uploadFile, uploadImage } from "../services/uploadServices";
import { Upload, Trash2, FileText, Image as ImageIcon, ExternalLink, Activity } from "lucide-react";
import toast from "react-hot-toast";

export default function Files() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const [files, setFiles] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const limit = 10;

  const fetchFiles = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await listFiles(selectedOrg.id, selectedWorkspace.id, page, limit);
      if (res.success) {
        setFiles(res.files || []);
        setTotal(res.total || 0);
      } else {
        setError(res.message || "Failed to fetch files");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, [selectedOrg?.id, selectedWorkspace?.id, page]);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const isImage = file.type.startsWith("image/");
      const uploadFn = isImage ? uploadImage : uploadFile;
      const res = await uploadFn(file, selectedWorkspace.id);
      if (res.url || res.dbEntry) {
        toast.success("File uploaded successfully");
        fetchFiles();
      } else {
        const errMsg = res.message || "Upload failed";
        setError(errMsg);
        toast.error(errMsg);
      }
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await deleteFile(selectedOrg.id, selectedWorkspace.id, fileId);
      toast.success("File deleted");
      fetchFiles();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const FileIcon = ({ mimeType }) => {
    if (mimeType?.startsWith("image/")) {
      return <ImageIcon size={16} style={{ color: "var(--brand-primary)" }} />;
    }
    return <FileText size={16} style={{ color: "var(--text-secondary)" }} />;
  };

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--text-secondary)" }}>Please select an organization and workspace first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 className="page-title">Files</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "13px", marginTop: "4px" }}>Manage uploaded images, templates, and CSV datasets</p>
        </div>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: "none" }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading} className="btn btn-primary">
            {uploading ? "Uploading..." : <><Upload size={16} /> Upload File</>}
          </button>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {error && <div style={{ backgroundColor: "var(--danger-light)", color: "var(--danger)", padding: "12px 24px", fontSize: "13px", fontWeight: 500, borderBottom: "1px solid var(--border-color)" }}>{error}</div>}

        <div style={{ overflowX: "auto" }}>
          <table className="table">
            <thead>
              <tr>
                <th>File Name</th>
                <th>Type</th>
                <th>Size</th>
                <th>Uploaded By</th>
                <th>Created</th>
                <th style={{ width: "80px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((f) => (
                <tr key={f.id}>
                  <td style={{ fontWeight: 500 }}>
                    <a href={f.publicUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--brand-primary)", textDecoration: "none" }}>
                      <FileIcon mimeType={f.mimeType} />
                      <span style={{ maxWidth: "200px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.fileName}</span>
                      <ExternalLink size={12} style={{ color: "var(--text-tertiary)" }} />
                    </a>
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{f.mimeType}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px", fontFamily: "var(--font-mono)" }}>{formatSize(f.fileSize)}</td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                    {f.uploadedBy ? `${f.uploadedBy.firstName} ${f.uploadedBy.lastName}` : <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{f.uploadedById}</span>}
                  </td>
                  <td style={{ color: "var(--text-secondary)", fontSize: "13px" }}>{new Date(f.createdAt).toLocaleDateString()}</td>
                  <td style={{ textAlign: "right" }}>
                    <button onClick={() => handleDelete(f.id)} className="btn-icon danger">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {files.length === 0 && !loading && (
                <tr>
                  <td colSpan={6} style={{ padding: "48px 24px", textAlign: "center", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                      <Activity size={32} style={{ color: "var(--border-color)" }} />
                      <p>No files uploaded yet.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 24px", borderTop: "1px solid var(--border-color)" }}>
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, total)} of {total} files</span>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn btn-secondary" disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
