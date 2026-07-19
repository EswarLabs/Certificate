import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createTemplate, publishTemplate } from "../services/templateServices";
import { uploadImage } from "../services/uploadServices";
import CanvasEditor from "../components/editor/CanvasEditor";
import { createDefaultEditorData, makeTextElement } from "../utils/editorDataRenderer";
import { ArrowLeft, Plus, X, ChevronDown, ChevronUp } from "lucide-react";

export default function TemplateCreate() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [orientation, setOrientation] = useState("LANDSCAPE");
  const stageRef = useRef(null);
  const [schemaFields, setSchemaFields] = useState([
    { key: "courseTitle", label: "Course Title", type: "text", required: true },
  ]);
  const [editorData, setEditorData] = useState(() => createDefaultEditorData("LANDSCAPE"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Left sidebar collapse on mobile
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobileWindow, setIsMobileWindow] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobileWindow(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [testValues, setTestValues] = useState({
    recipientName: "Jane Doe",
    issuedAt: new Date().toLocaleDateString(),
    courseTitle: "Advanced Full-Stack Development",
    verificationUrl: "https://example.com/verify/CERT-XXXX",
  });


  // Sync testValues when schema fields change
  useEffect(() => {
    setTestValues((prev) => {
      const next = { ...prev };
      schemaFields.forEach((f) => {
        if (f.key && next[f.key] === undefined) {
          next[f.key] = `[${f.label || f.key}]`;
        }
      });
      return next;
    });
  }, [schemaFields]);

  // ── Orientation switch: update canvas dimensions WITHOUT wiping elements ──
  // The CanvasEditor already updates its internal width/height via a useEffect
  // when orientation changes, so we only need to pass the new orientation prop.
  // We do NOT call createDefaultEditorData() here — that would erase all work.
  const handleOrientationChange = (o) => {
    if (o === orientation) return;
    const oldW = orientation === "LANDSCAPE" ? 1200 : 900;
    const oldH = orientation === "LANDSCAPE" ? 900 : 1200;
    const newW = o === "LANDSCAPE" ? 1200 : 900;
    const newH = o === "LANDSCAPE" ? 900 : 1200;

    setOrientation(o);
    setEditorData(prev => {
      if (!prev || !prev.elements) return prev;
      const xScale = newW / oldW;
      const yScale = newH / oldH;

      // Check if it's the default set of elements (unmodified texts and length)
      const defaultPrev = createDefaultEditorData(orientation);
      const isDefault = prev.elements.length === defaultPrev.elements.length &&
        prev.elements.every((el, idx) => {
          const def = defaultPrev.elements[idx];
          return el.type === def.type && (el.properties?.text === def.properties?.text);
        });

      if (isDefault) {
        const nextDefault = createDefaultEditorData(o);
        return {
          ...prev,
          width: newW,
          height: newH,
          elements: nextDefault.elements,
        };
      }

      const updatedElements = prev.elements.map(el => {
        if (el.type === "shape" && el.x <= 60 && el.y <= 60 && el.width >= oldW - 120 && el.height >= oldH - 120) {
          return { ...el, x: 40, y: 40, width: newW - 80, height: newH - 80 };
        }
        return {
          ...el,
          x: Math.round(el.x * xScale),
          y: Math.round(el.y * yScale),
          width: Math.round(el.width * xScale),
          height: el.type === "line" ? el.height : Math.round(el.height * yScale),
        };
      });

      return {
        ...prev,
        width: newW,
        height: newH,
        elements: updatedElements,
      };
    });
  };

  const addSchemaField = () => {
    let num = 1;
    while (schemaFields.some(f => f.key === `customField_${num}`)) {
      num++;
    }
    const newKey = `customField_${num}`;
    const newLabel = `Custom Field ${num}`;
    setSchemaFields([...schemaFields, { key: newKey, label: newLabel, type: "text", required: false }]);

    setEditorData(prev => {
      if (!prev) return prev;
      const w = prev.width || 1200;
      const h = prev.height || 900;
      const nextZ = (prev.elements || []).length;
      const yPos = Math.min(350 + num * 60, h - 80);
      const newEl = makeTextElement(w, h, {
        x: Math.round(w / 2 - 200),
        y: yPos,
        width: 400,
        height: 50,
        zIndex: nextZ,
        properties: {
          text: `{{${newKey}}}`,
          fontFamily: "sans-serif",
          fontSize: 26,
          fontStyle: "bold",
          fill: "#1f2937",
          align: "center",
          variable: newKey,
        },
      });
      return { ...prev, elements: [...(prev.elements || []), newEl] };
    });
  };

  const updateSchemaField = (i, field, value) => {
    const oldKey = schemaFields[i].key;
    const updated = [...schemaFields];
    updated[i] = { ...updated[i], [field]: value };
    setSchemaFields(updated);

    if (field === "key" && oldKey && value && oldKey !== value) {
      setEditorData(prev => {
        if (!prev || !prev.elements) return prev;
        return {
          ...prev,
          elements: prev.elements.map(el => {
            if (el.properties && el.properties.variable === oldKey) {
              return {
                ...el,
                properties: {
                  ...el.properties,
                  variable: value,
                  text: `{{${value}}}`,
                },
              };
            }
            return el;
          }),
        };
      });
    }
  };

  const removeSchemaField = (i) => {
    const removedKey = schemaFields[i]?.key;
    setSchemaFields(schemaFields.filter((_, idx) => idx !== i));

    if (removedKey) {
      setEditorData(prev => {
        if (!prev || !prev.elements) return prev;
        return {
          ...prev,
          elements: prev.elements.filter(el => !(el.properties && el.properties.variable === removedKey)),
        };
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrg?.id || !selectedWorkspace?.id) return;
    setLoading(true);
    setError(null);
    try {
      let finalEditorData = editorData;

      // Upload any locally-attached files
      if (editorData?.elements) {
        const uploadPromises = editorData.elements.map(async (el) => {
          if (el._file) {
            const res = await uploadImage(el._file, selectedWorkspace.id);
            const url = res.secure_url || res.url;
            if (!url) throw new Error(`Upload failed for ${el.type} element.`);
            const { _file, ...rest } = el;
            return { ...rest, properties: { ...rest.properties, src: url } };
          }
          return el;
        });
        const updatedElements = await Promise.all(uploadPromises);
        finalEditorData = { ...editorData, elements: updatedElements };
      }

      // Automatically generate thumbnail from canvas stage
      let thumbUrl = null;
      if (stageRef.current) {
        try {
          const transformers = stageRef.current.find("Transformer") || [];
          transformers.forEach((t) => t.hide());
          const dataUrl = stageRef.current.toDataURL({ pixelRatio: 0.5 });
          transformers.forEach((t) => t.show());

          const blob = await fetch(dataUrl).then((r) => r.blob());
          const file = new File([blob], "thumbnail.png", { type: "image/png" });
          const uploadRes = await uploadImage(file, selectedWorkspace.id);
          thumbUrl = uploadRes.secure_url || uploadRes.url || null;
        } catch (thumbErr) {
          console.warn("Could not generate thumbnail:", thumbErr);
        }
      }

      const data = {
        name,
        description,
        orientation,
        editorData: finalEditorData,
        schemaDefinition: schemaFields.filter((f) => f.key),
        thumbnailUrl: thumbUrl,
      };

      const res = await createTemplate(selectedOrg.id, selectedWorkspace.id, data);
      if (res.id) {
        try {
          await publishTemplate(selectedOrg.id, selectedWorkspace.id, res.id);
        } catch (publishErr) {
          console.error("Auto-publish failed", publishErr);
        }
        navigate(`/templates/${res.id}`);
      } else {
        setError(res.message || JSON.stringify(res) || "Failed to create template");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
        Please select an organization and workspace first.
      </div>
    );
  }

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      height: "calc(100vh - 64px)",
      backgroundColor: "var(--bg-primary)",
      color: "var(--text-primary)",
      overflow: "hidden",
    }}>

      {/* ── Top bar ── */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 16px",
        borderBottom: "1px solid var(--border-color)",
        backgroundColor: "var(--bg-secondary)",
        flexShrink: 0,
        gap: 12,
        flexWrap: "wrap",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
          <button onClick={() => navigate("/templates")} className="btn-icon">
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: "10px", color: "var(--text-tertiary)", marginBottom: "2px", fontWeight: 700, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              NEW TEMPLATE
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Template name…"
              required
              style={{
                background: "transparent",
                border: "none",
                borderBottom: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                fontSize: "15px",
                fontWeight: 600,
                outline: "none",
                width: "100%",
                maxWidth: 280,
                padding: "3px 0",
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          {/* Orientation toggle */}
          <div style={{
            display: "flex",
            backgroundColor: "var(--bg-primary)",
            border: "1px solid var(--border-color)",
            borderRadius: "6px",
            padding: "3px",
          }}>
            {["LANDSCAPE", "PORTRAIT"].map((o) => (
              <button
                key={o}
                onClick={() => handleOrientationChange(o)}
                style={{
                  backgroundColor: orientation === o ? "var(--bg-hover)" : "transparent",
                  border: "none",
                  color: orientation === o ? "var(--text-primary)" : "var(--text-secondary)",
                  borderRadius: "4px",
                  fontSize: "11px",
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "background 0.15s",
                }}
              >
                {o[0] + o.slice(1).toLowerCase()}
              </button>
            ))}
          </div>

          {/* Mobile sidebar toggle */}
          <button
            onClick={() => setSidebarOpen(v => !v)}
            className="btn btn-secondary"
            style={{ display: isMobileWindow ? "flex" : "none", alignItems: "center", gap: 4, fontSize: "11px", padding: "6px 10px" }}
            data-mobile-sidebar-toggle
          >
            ⚙ Settings
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !name || !editorData}
            className="btn btn-primary"
          >
            {loading ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          backgroundColor: "var(--danger-light, #fee2e2)",
          color: "var(--danger, #dc2626)",
          padding: "10px 16px",
          fontSize: "13px",
          fontWeight: 500,
          flexShrink: 0,
          borderBottom: "1px solid var(--border-color)",
        }}>
          ⚠ {error}
        </div>
      )}

      {/* ── Body: sidebar + canvas ── */}
      <div style={{ display: "flex", flex: 1, minHeight: 0, position: "relative" }}>

        {/* Backdrop overlay for mobile drawer */}
        {isMobileWindow && sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.5)",
              zIndex: 99,
            }}
          />
        )}

        {/* Left sidebar */}
        <div style={{
          width: isMobileWindow ? "85%" : 300,
          maxWidth: isMobileWindow ? 340 : 300,
          backgroundColor: "var(--bg-secondary)",
          borderRight: "1px solid var(--border-color)",
          overflowY: "auto",
          flexShrink: 0,
          display: isMobileWindow ? (sidebarOpen ? "flex" : "none") : "flex",
          flexDirection: "column",
          position: isMobileWindow ? "fixed" : "relative",
          top: isMobileWindow ? 64 : "auto",
          left: isMobileWindow ? 0 : "auto",
          bottom: isMobileWindow ? 0 : "auto",
          zIndex: 100,
          boxShadow: isMobileWindow && sidebarOpen ? "4px 0 24px rgba(0,0,0,0.4)" : "none",
        }}>
          {isMobileWindow && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>
              <span style={{ fontWeight: 700, fontSize: 13, color: "var(--text-primary)" }}>Template Settings</span>
              <button onClick={() => setSidebarOpen(false)} className="btn-icon" style={{ padding: 4 }}>
                <X size={18} />
              </button>
            </div>
          )}


          {/* Description */}
          <div style={{ padding: "14px 16px 0" }}>
            <label style={sidebarLabel}>Description</label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Template description…"
              style={{ width: "100%", resize: "vertical", marginTop: 6, fontSize: 12 }}
            />
          </div>

          {/* Schema fields */}
          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
              <span style={sidebarLabel}>Schema Fields</span>
              <button onClick={addSchemaField} className="btn btn-secondary" style={{ padding: "3px 8px", fontSize: "11px", height: "auto", display: "flex", alignItems: "center", gap: 4 }}>
                <Plus size={11} /> Add
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "var(--text-tertiary)", margin: "0 0 12px", lineHeight: 1.5 }}>
              Define variables injected into text elements as{" "}
              <code style={{ color: "var(--brand-primary)", fontFamily: "var(--font-mono)" }}>{"{{key}}"}</code>
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {schemaFields.map((field, i) => (
                <div key={i} className="card" style={{ padding: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", alignItems: "center" }}>
                    <span style={{ fontSize: "10px", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Field {i + 1}
                    </span>
                    <button onClick={() => removeSchemaField(i)} className="btn-icon" style={{ color: "var(--danger)", padding: 2 }}>
                      <X size={13} />
                    </button>
                  </div>
                  <input
                    className="input"
                    placeholder="key (e.g. courseTitle)"
                    value={field.key}
                    onChange={(e) => updateSchemaField(i, "key", e.target.value)}
                    style={{ marginBottom: "6px", fontSize: 12 }}
                    required
                  />
                  <input
                    className="input"
                    placeholder="Label (e.g. Course Title)"
                    value={field.label}
                    onChange={(e) => updateSchemaField(i, "label", e.target.value)}
                    style={{ marginBottom: "6px", fontSize: 12 }}
                  />
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    <select
                      className="input"
                      value={field.type}
                      onChange={(e) => updateSchemaField(i, "type", e.target.value)}
                      style={{ flex: 1, padding: "5px 6px", fontSize: 12 }}
                    >
                      <option value="text">Text</option>
                      <option value="date">Date</option>
                      <option value="number">Number</option>
                      <option value="email">Email</option>
                      <option value="url">URL</option>
                    </select>
                    <label style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "11px", color: "var(--text-secondary)", cursor: "pointer", whiteSpace: "nowrap" }}>
                      <input
                        type="checkbox"
                        checked={field.required}
                        onChange={(e) => updateSchemaField(i, "required", e.target.checked)}
                        style={{ cursor: "pointer" }}
                      />
                      Required
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview test values */}
          <div style={{ padding: "0 16px 20px" }}>
            <span style={sidebarLabel}>Preview Values</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 10 }}>
              {[
                { key: "recipientName", label: "Recipient Name" },
                { key: "issuedAt", label: "Issued At" },
                { key: "verificationUrl", label: "Verification URL" },
                ...schemaFields.filter(f => f.key),
              ].map(({ key, label }) => (
                <label key={key} style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--brand-primary)", fontFamily: "var(--font-mono)", fontSize: 11 }}>
                    {`{{${key}}}`}
                  </span>
                  <input
                    className="input"
                    value={testValues[key] || ""}
                    onChange={(e) => setTestValues(prev => ({ ...prev, [key]: e.target.value }))}
                    style={{ fontSize: 12 }}
                  />
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Canvas editor */}
        <div style={{ flex: 1, minWidth: 0, minHeight: 0, display: "flex", flexDirection: "column" }}>
          {editorData ? (
            <CanvasEditor
              key={orientation}
              stageRef={stageRef}
              initialData={editorData}
              orientation={orientation}
              variables={testValues}
              onChange={setEditorData}
            />
          ) : (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "var(--text-secondary)" }}>
              Initializing canvas…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Shared sidebar label style ──
const sidebarLabel = {
  fontSize: "11px",
  fontWeight: 700,
  color: "var(--text-tertiary)",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
  display: "block",
};