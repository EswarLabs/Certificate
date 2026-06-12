import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { getTemplate, updateTemplate, deleteTemplate } from "../services/templateServices";

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();

  const [template, setTemplate] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    htmlTemplate: "",
    cssStyles: "",
    orientation: "landscape",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Preview test values state
  const [testValues, setTestValues] = useState({
    recipientName: "Jane Doe",
    issuedAt: new Date().toLocaleDateString(),
  });

  const fetchTemplate = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    try {
      const res = await getTemplate(selectedOrg.id, selectedWorkspace.id, id);
      if (res.id) {
        setTemplate(res);
        setForm({
          name: res.name,
          description: res.description || "",
          htmlTemplate: res.htmlTemplate || "",
          cssStyles: res.cssStyles || "",
          orientation: res.orientation || "landscape",
        });

        // Initialize custom schema preview fields
        const schema = res.schemaDefinition || [];
        setTestValues((prev) => {
          const next = { ...prev };
          schema.forEach((field) => {
            if (field.key && next[field.key] === undefined) {
              next[field.key] = `[Preview ${field.label || field.key}]`;
            }
          });
          return next;
        });
      } else {
        setError(res.message || "Template not found");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplate();
  }, [selectedOrg?.id, selectedWorkspace?.id, id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await updateTemplate(selectedOrg.id, selectedWorkspace.id, id, form);
      if (res.id) {
        setTemplate(res);
        setEditing(false);
      } else {
        setError(res.message || "Update failed");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete this template?")) return;
    try {
      await deleteTemplate(selectedOrg.id, selectedWorkspace.id, id);
      navigate("/templates");
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTestValueChange = (key, val) => {
    setTestValues((prev) => ({ ...prev, [key]: val }));
  };

  // Compile template HTML with test values for preview
  const compilePreview = (html, css, orientation, schema) => {
    let compiled = html || "";
    
    // Replace standard placeholders
    compiled = compiled.replace(/\{\{recipientName\}\}/g, testValues.recipientName || "");
    compiled = compiled.replace(/\{\{issuedAt\}\}/g, testValues.issuedAt || "");

    // Replace custom schema placeholders
    const schemaDef = schema || [];
    schemaDef.forEach((field) => {
      if (field.key) {
        const val = testValues[field.key] !== undefined ? testValues[field.key] : `[${field.label || field.key}]`;
        const regex = new RegExp(`\\{\\{${field.key}\\}\\}`, "g");
        compiled = compiled.replace(regex, val || "");
      }
    });

    const isLandscape = orientation === "landscape";

    return `
      <html>
        <head>
          <style>
            body { 
              margin: 0; 
              padding: 10px; 
              font-family: sans-serif; 
              display: flex; 
              justify-content: center; 
              align-items: center; 
              min-height: 100vh; 
              background-color: #f3f4f6; 
            }
            .certificate-container { 
              background: white; 
              padding: 30px; 
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); 
              border-radius: 8px; 
              box-sizing: border-box;
              width: 100%;
              max-width: ${isLandscape ? "800px" : "550px"};
              aspect-ratio: ${isLandscape ? "1.414" : "0.707"};
            }
            ${css || ""}
          </style>
        </head>
        <body>
          <div class="certificate-container">
            ${compiled}
          </div>
        </body>
      </html>
    `;
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (!template) return <p>Template not found</p>;

  const schemaDefinition = template.schemaDefinition || [];

  return (
    <div style={{ padding: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <h1>{template.name}</h1>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => setEditing(!editing)}>{editing ? "Cancel Edit" : "Edit Template"}</button>
          <button onClick={handleDelete} style={{ color: "red" }}>Delete</button>
        </div>
      </div>

      {editing ? (
        /* Edit Mode split view */
        <div style={{ display: "flex", gap: "24px", flexDirection: "row", flexWrap: "wrap" }}>
          
          {/* Left Edit Form */}
          <div style={{ flex: "1 1 500px", minWidth: "320px" }}>
            <form onSubmit={handleUpdate}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <label>
                  <strong>Template Name</strong>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                    required
                  />
                </label>
                <label>
                  <strong>Description</strong>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                  />
                </label>
                <label>
                  <strong>Orientation</strong>
                  <select
                    value={form.orientation}
                    onChange={(e) => setForm({ ...form, orientation: e.target.value })}
                    style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                  >
                    <option value="landscape">Landscape</option>
                    <option value="portrait">Portrait</option>
                  </select>
                </label>
                <label>
                  <strong>HTML Template</strong>
                  <textarea
                    value={form.htmlTemplate}
                    onChange={(e) => setForm({ ...form, htmlTemplate: e.target.value })}
                    rows={12}
                    style={{ display: "block", width: "100%", fontFamily: "monospace", padding: "8px", marginTop: "4px", backgroundColor: "#f9fafb" }}
                    required
                  />
                </label>
                <label>
                  <strong>CSS Styles</strong>
                  <textarea
                    value={form.cssStyles}
                    onChange={(e) => setForm({ ...form, cssStyles: e.target.value })}
                    rows={8}
                    style={{ display: "block", width: "100%", fontFamily: "monospace", padding: "8px", marginTop: "4px", backgroundColor: "#f9fafb" }}
                  />
                </label>
                <button type="submit" style={{ padding: "12px", fontWeight: "bold" }}>Save Changes</button>
              </div>
            </form>
          </div>

          {/* Right Live Edit Preview */}
          <div style={{ flex: "1 1 400px", minWidth: "320px", borderLeft: "1px solid #e5e7eb", paddingLeft: "24px" }}>
            <h2 style={{ marginTop: 0 }}>Live Preview</h2>
            
            {/* Test value inputs */}
            <div style={{ 
              backgroundColor: "#f9fafb", 
              border: "1px solid #e5e7eb", 
              borderRadius: "8px", 
              padding: "16px", 
              marginBottom: "20px" 
            }}>
              <h4 style={{ margin: "0 0 12px 0" }}>Update Preview Field Values</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem" }}>
                  recipientName
                  <input 
                    type="text" 
                    value={testValues.recipientName} 
                    onChange={(e) => handleTestValueChange("recipientName", e.target.value)} 
                    style={{ padding: "4px", fontSize: "0.9rem" }}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem" }}>
                  issuedAt
                  <input 
                    type="text" 
                    value={testValues.issuedAt} 
                    onChange={(e) => handleTestValueChange("issuedAt", e.target.value)} 
                    style={{ padding: "4px", fontSize: "0.9rem" }}
                  />
                </label>
                {schemaDefinition.map((field) => {
                  if (!field.key) return null;
                  return (
                    <label key={field.key} style={{ display: "flex", flexDirection: "column", fontSize: "0.85rem" }}>
                      {field.key} ({field.label || field.key})
                      <input 
                        type="text" 
                        value={testValues[field.key] || ""} 
                        onChange={(e) => handleTestValueChange(field.key, e.target.value)} 
                        style={{ padding: "4px", fontSize: "0.9rem" }}
                      />
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Preview Frame */}
            <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f3f4f6", padding: "10px" }}>
              <iframe
                title="Live Template Preview"
                srcDoc={compilePreview(form.htmlTemplate, form.cssStyles, form.orientation, schemaDefinition)}
                style={{
                  width: "100%",
                  height: "450px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                }}
              />
            </div>
          </div>

        </div>
      ) : (
        /* Read Only Mode view */
        <div>
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
            <tbody>
              <tr><td style={{ padding: "6px", fontWeight: "bold", width: "150px" }}>ID</td><td style={{ padding: "6px" }}>{template.id}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Description</td><td style={{ padding: "6px" }}>{template.description || "—"}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Orientation</td><td style={{ padding: "6px" }}>{template.orientation}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Workspace</td><td style={{ padding: "6px" }}>{template.workspaceId}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Created</td><td style={{ padding: "6px" }}>{new Date(template.createdAt).toLocaleString()}</td></tr>
              <tr><td style={{ padding: "6px", fontWeight: "bold" }}>Updated</td><td style={{ padding: "6px" }}>{new Date(template.updatedAt).toLocaleString()}</td></tr>
            </tbody>
          </table>

          {/* Schema Definition */}
          {schemaDefinition.length > 0 && (
            <div style={{ marginTop: "24px" }}>
              <h3>Schema Definition (Custom Placeholders)</h3>
              <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e5e7eb" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Key</th>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Label</th>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Type</th>
                    <th style={{ textAlign: "left", padding: "8px", borderBottom: "1px solid #e5e7eb" }}>Required</th>
                  </tr>
                </thead>
                <tbody>
                  {schemaDefinition.map((s, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px" }}><code>{s.key}</code></td>
                      <td style={{ padding: "8px" }}>{s.label}</td>
                      <td style={{ padding: "8px" }}>{s.type}</td>
                      <td style={{ padding: "8px" }}>{s.required ? "Yes" : "No"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Real-time Rendered Preview */}
          <div style={{ marginTop: "24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <h3>Template Render View</h3>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span style={{ fontSize: "0.85rem", color: "#6b7280" }}>Verify placeholders:</span>
                {schemaDefinition.map((field) => (
                  <input
                    key={field.key}
                    placeholder={field.label || field.key}
                    value={testValues[field.key] || ""}
                    onChange={(e) => handleTestValueChange(field.key, e.target.value)}
                    style={{ padding: "4px 8px", fontSize: "0.85rem", width: "120px" }}
                  />
                ))}
              </div>
            </div>
            
            <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", padding: "12px", backgroundColor: "#f3f4f6" }}>
              <iframe
                title="Template Preview"
                srcDoc={compilePreview(template.htmlTemplate, template.cssStyles, template.orientation, schemaDefinition)}
                style={{
                  width: "100%",
                  height: "450px",
                  border: "none",
                  borderRadius: "4px",
                  backgroundColor: "#fff",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
