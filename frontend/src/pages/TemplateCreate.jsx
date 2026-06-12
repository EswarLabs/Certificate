import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createTemplate } from "../services/templateServices";

export default function TemplateCreate() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    description: "",
    htmlTemplate: `<div style="text-align: center; border: 4px double #1f2937; padding: 40px; background: #fffcf4;">
  <h1 style="font-size: 2.5rem; color: #1e3a8a; font-family: serif;">Certificate of Achievement</h1>
  <p style="font-size: 1.1rem; color: #4b5563;">This is proudly presented to</p>
  <h2 style="font-size: 2rem; color: #111827; border-bottom: 2px solid #3b82f6; display: inline-block; padding-bottom: 8px;">{{recipientName}}</h2>
  <p style="font-size: 1.1rem; color: #4b5563;">for successfully completing the course</p>
  <h3 style="font-size: 1.5rem; color: #1e3a8a;">{{courseTitle}}</h3>
  <p style="font-size: 0.9rem; color: #6b7280; margin-top: 40px;">Issued on: {{issuedAt}}</p>
</div>`,
    cssStyles: `h1 { text-transform: uppercase; letter-spacing: 2px; }
h2 { font-style: italic; }`,
    orientation: "landscape",
  });

  const [schemaFields, setSchemaFields] = useState([
    { key: "courseTitle", label: "Course Title", type: "text", required: true }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Preview test values state
  const [testValues, setTestValues] = useState({
    recipientName: "Jane Doe",
    issuedAt: new Date().toLocaleDateString(),
    courseTitle: "Advanced Full-Stack Development",
  });

  // Keep testValues keys updated based on schemaFields changes
  useEffect(() => {
    setTestValues((prev) => {
      const next = { ...prev };
      schemaFields.forEach((field) => {
        if (field.key && next[field.key] === undefined) {
          next[field.key] = `[Preview ${field.label || field.key}]`;
        }
      });
      return next;
    });
  }, [schemaFields]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addSchemaField = () => {
    setSchemaFields([...schemaFields, { key: "", label: "", type: "text", required: false }]);
  };

  const updateSchemaField = (index, field, value) => {
    const updated = [...schemaFields];
    updated[index][field] = value;
    setSchemaFields(updated);
  };

  const removeSchemaField = (index) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
  };

  const handleTestValueChange = (key, val) => {
    setTestValues((prev) => ({ ...prev, [key]: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      const data = {
        ...form,
        schemaDefinition: schemaFields.filter((f) => f.key),
      };
      const res = await createTemplate(selectedOrg.id, selectedWorkspace.id, data);
      if (res.id) {
        navigate(`/templates/${res.id}`);
      } else {
        setError(res.message || "Failed to create template");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper to compile template html with test values for preview
  const compilePreview = () => {
    let compiled = form.htmlTemplate || "";
    
    // Replace standard placeholders
    compiled = compiled.replace(/\{\{recipientName\}\}/g, testValues.recipientName || "");
    compiled = compiled.replace(/\{\{issuedAt\}\}/g, testValues.issuedAt || "");

    // Replace custom schema placeholders
    schemaFields.forEach((field) => {
      if (field.key) {
        const val = testValues[field.key] !== undefined ? testValues[field.key] : `[${field.label || field.key}]`;
        const regex = new RegExp(`\\{\\{${field.key}\\}\\}`, "g");
        compiled = compiled.replace(regex, val || "");
      }
    });

    const isLandscape = form.orientation === "landscape";

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
            ${form.cssStyles || ""}
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

  if (!selectedOrg || !selectedWorkspace) {
    return <div><p>Please select an organization and workspace first.</p></div>;
  }

  return (
    <div style={{ padding: "20px" }}>
      <h1>Create Template</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <div style={{ display: "flex", gap: "24px", flexDirection: "row", flexWrap: "wrap" }}>
        
        {/* Left Form Column */}
        <div style={{ flex: "1 1 500px", minWidth: "320px" }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <label>
                <strong>Template Name *</strong>
                <input 
                  type="text" 
                  name="name" 
                  value={form.name} 
                  onChange={handleChange} 
                  required 
                  placeholder="e.g. Graduation Certificate"
                  style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }} 
                />
              </label>

              <label>
                <strong>Description</strong>
                <textarea 
                  name="description" 
                  value={form.description} 
                  onChange={handleChange} 
                  rows={2} 
                  placeholder="e.g. Issued to students who graduate from our course"
                  style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }} 
                />
              </label>

              <label>
                <strong>Orientation</strong>
                <select 
                  name="orientation" 
                  value={form.orientation} 
                  onChange={handleChange} 
                  style={{ display: "block", width: "100%", padding: "8px", marginTop: "4px" }}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </label>

              <label>
                <strong>HTML Template *</strong>
                <span style={{ fontSize: "0.8rem", color: "#6b7280", display: "block" }}>
                  Use <code>{"{{recipientName}}"}</code>, <code>{"{{issuedAt}}"}</code> and custom schema variables below.
                </span>
                <textarea 
                  name="htmlTemplate" 
                  value={form.htmlTemplate} 
                  onChange={handleChange} 
                  required 
                  rows={12} 
                  style={{ display: "block", width: "100%", fontFamily: "monospace", padding: "8px", marginTop: "4px", backgroundColor: "#f9fafb" }} 
                />
              </label>

              <label>
                <strong>CSS Styles</strong>
                <textarea 
                  name="cssStyles" 
                  value={form.cssStyles} 
                  onChange={handleChange} 
                  rows={8} 
                  placeholder="Add custom CSS rules here..."
                  style={{ display: "block", width: "100%", fontFamily: "monospace", padding: "8px", marginTop: "4px", backgroundColor: "#f9fafb" }} 
                />
              </label>

              {/* Schema Definition */}
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", padding: "16px", backgroundColor: "#fff" }}>
                <h3>Schema Definition (Custom Placeholders)</h3>
                <p style={{ fontSize: "0.85rem", color: "#6b7280", marginTop: "-8px", marginBottom: "16px" }}>
                  Define custom variables (e.g. <code>courseTitle</code>) that you can inject into the HTML as <code>{"{{courseTitle}}"}</code>.
                </p>
                {schemaFields.map((field, i) => (
                  <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "8px", alignItems: "center" }}>
                    <input
                      placeholder="Variable Key (e.g. course)"
                      value={field.key}
                      onChange={(e) => updateSchemaField(i, "key", e.target.value)}
                      style={{ flex: 1, padding: "6px" }}
                      required
                    />
                    <input
                      placeholder="Label (e.g. Course)"
                      value={field.label}
                      onChange={(e) => updateSchemaField(i, "label", e.target.value)}
                      style={{ flex: 1, padding: "6px" }}
                    />
                    <select 
                      value={field.type} 
                      onChange={(e) => updateSchemaField(i, "type", e.target.value)}
                      style={{ padding: "6px" }}
                    >
                      <option value="text">Text</option>
                      <option value="date">Date</option>
                      <option value="number">Number</option>
                    </select>
                    <label style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "4px" }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateSchemaField(i, "required", e.target.checked)}
                      /> Req
                    </label>
                    <button type="button" onClick={() => removeSchemaField(i)} style={{ color: "red", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>✕</button>
                  </div>
                ))}
                <button type="button" onClick={addSchemaField} style={{ padding: "6px 12px", fontSize: "0.85rem", marginTop: "8px" }}>
                  + Add Placeholder
                </button>
              </div>

              <button type="submit" disabled={loading} style={{ padding: "12px", fontWeight: "bold", cursor: "pointer" }}>
                {loading ? "Creating..." : "Create Template"}
              </button>
            </div>
          </form>
        </div>

        {/* Right Preview Column */}
        <div style={{ flex: "1 1 400px", minWidth: "320px", borderLeft: "1px solid #e5e7eb", paddingLeft: "24px" }}>
          <h2 style={{ marginTop: 0 }}>Live Preview</h2>
          <p style={{ fontSize: "0.85rem", color: "#6b7280" }}>
            The certificate below renders in real-time as you modify the HTML, CSS, or test values.
          </p>

          {/* Test values input fields */}
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
              {schemaFields.map((field) => {
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

          {/* Render Preview Frame */}
          <div style={{ border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden", backgroundColor: "#f3f4f6", padding: "10px" }}>
            <iframe
              title="Live Template Preview"
              srcDoc={compilePreview()}
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
    </div>
  );
}
