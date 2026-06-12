import { useState, useEffect, useRef } from "react";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { listFiles, deleteFile } from "../services/fileServices";
import { uploadFile, uploadImage } from "../services/uploadServices";

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
        fetchFiles();
      } else {
        setError(res.message || "Upload failed");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (fileId) => {
    if (!confirm("Delete this file?")) return;
    try {
      await deleteFile(selectedOrg.id, selectedWorkspace.id, fileId);
      fetchFiles();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!selectedOrg || !selectedWorkspace) {
    return <div><p>Please select an organization and workspace first.</p></div>;
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Files</h1>
        <div>
          <input type="file" ref={fileInputRef} onChange={handleUpload} style={{ display: "none" }} />
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            {uploading ? "Uploading..." : "+ Upload File"}
          </button>
        </div>
      </div>

      {loading && <p>Loading...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>File Name</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Type</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Size</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Uploaded By</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Created</th>
            <th style={{ textAlign: "left", padding: "8px", borderBottom: "2px solid #e5e7eb" }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {files.map((f) => (
            <tr key={f.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
              <td style={{ padding: "8px" }}>
                <a href={f.publicUrl} target="_blank" rel="noopener noreferrer">{f.fileName}</a>
              </td>
              <td style={{ padding: "8px" }}>{f.mimeType}</td>
              <td style={{ padding: "8px" }}>{formatSize(f.fileSize)}</td>
              <td style={{ padding: "8px" }}>
                {f.uploadedBy ? `${f.uploadedBy.firstName} ${f.uploadedBy.lastName}` : f.uploadedById}
              </td>
              <td style={{ padding: "8px" }}>{new Date(f.createdAt).toLocaleDateString()}</td>
              <td style={{ padding: "8px" }}>
                <button onClick={() => handleDelete(f.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {files.length === 0 && !loading && (
            <tr>
              <td colSpan={6} style={{ padding: "24px", textAlign: "center", color: "#9ca3af" }}>
                No files uploaded yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {total > limit && (
        <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button>
          <span>Page {page} of {Math.ceil(total / limit)}</span>
          <button disabled={page * limit >= total} onClick={() => setPage(page + 1)}>Next</button>
        </div>
      )}
    </div>
  );
}
