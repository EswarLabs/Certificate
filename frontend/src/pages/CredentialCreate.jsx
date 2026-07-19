import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import useOrg from "../hooks/useOrg";
import useWorkspace from "../hooks/useWorkspace";
import { createCredential } from "../services/credentialServices";
import { listTemplates } from "../services/templateServices";
import TemplatePicker from "../components/ui/TemplatePicker";
import {
  ArrowLeft, Plus, Trash2, FileText, ChevronRight, Check,
  GraduationCap, Loader2, Upload, Download, AlertTriangle, Sparkles
} from "lucide-react";
import toast from "react-hot-toast";

/* ── Helpers ── */
const REQUIRED_COLS = [
  { key: "recipientName", label: "Recipient Name", type: "text", required: true },
  { key: "recipientEmail", label: "Email", type: "email", required: true },
  { key: "expiresAt", label: "Expiry (optional)", type: "datetime-local", required: false },
];

function makeEmptyRow(schemaFields = []) {
  const base = { recipientName: "", recipientEmail: "", expiresAt: "" };
  schemaFields.forEach(f => { base[f.key] = ""; });
  return base;
}

function parseCsv(text, schemaFields = []) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map(h => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return lines.slice(1).map(line => {
    const cols = line.split(",").map(c => c.trim().replace(/^"|"$/g, ""));
    const row = makeEmptyRow(schemaFields);
    header.forEach((h, i) => {
      if (h in row) row[h] = cols[i] || "";
      // also try to match schema keys
      const sField = schemaFields.find(f => f.key.toLowerCase() === h || f.label?.toLowerCase() === h);
      if (sField) row[sField.key] = cols[i] || "";
    });
    return row;
  });
}

/* ── Steps ── */
const STEPS = [
  { id: "template", label: "Template" },
  { id: "recipients", label: "Recipients" },
  { id: "review", label: "Review & Issue" },
];

export default function CredentialCreate() {
  const { selectedOrg } = useOrg();
  const { selectedWorkspace } = useWorkspace();
  const navigate = useNavigate();

  const [step, setStep] = useState(0); // 0 = template, 1 = recipients, 2 = review
  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [rows, setRows] = useState([makeEmptyRow()]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // Build column definitions
  const schemaFields = selectedTemplate?.schemaDefinition || [];
  const columns = [...REQUIRED_COLS, ...schemaFields.map(f => ({
    key: f.key, label: f.label || f.key, type: f.type || "text", required: !!f.required,
  }))];

  useEffect(() => {
    const fetch = async () => {
      if (!selectedOrg?.id || !selectedWorkspace?.id) return;
      setLoadingTemplates(true);
      try {
        const res = await listTemplates(selectedOrg.id, selectedWorkspace.id, 1, 100);
        if (res.success) setTemplates(res.templates || []);
      } catch {}
      setLoadingTemplates(false);
    };
    fetch();
  }, [selectedOrg?.id, selectedWorkspace?.id]);

  const handleTemplateSelect = (tmpl) => {
    setSelectedTemplate(tmpl);
    // Reset rows when template changes
    setRows([makeEmptyRow(tmpl.schemaDefinition || [])]);
    setSelectedRows([]);
  };

  /* ── Row operations ── */
  const addRow = () => setRows(r => [...r, makeEmptyRow(schemaFields)]);

  const removeRow = (idx) => setRows(r => r.filter((_, i) => i !== idx));

  const updateCell = useCallback((rowIdx, key, value) => {
    setRows(r => r.map((row, i) => i === rowIdx ? { ...row, [key]: value } : row));
  }, []);

  const handleKeyDown = (e, rowIdx, colIdx) => {
    // Enter/Tab on last column of last row → add new row
    if ((e.key === "Enter" || (e.key === "Tab" && !e.shiftKey)) && rowIdx === rows.length - 1 && colIdx === columns.length - 1) {
      e.preventDefault();
      addRow();
      // Focus first cell of new row (via setTimeout to let React render)
      setTimeout(() => {
        document.querySelector(`[data-row="${rowIdx + 1}"][data-col="0"]`)?.focus();
      }, 30);
    }
  };

  const toggleRowSelect = (idx) => {
    setSelectedRows(s => s.includes(idx) ? s.filter(i => i !== idx) : [...s, idx]);
  };

  const toggleSelectAll = () => {
    setSelectedRows(s => s.length === rows.length ? [] : rows.map((_, i) => i));
  };

  const deleteSelected = () => {
    setRows(r => r.filter((_, i) => !selectedRows.includes(i)));
    setSelectedRows([]);
  };

  /* ── CSV Import ── */
  const handleCsvImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCsv(ev.target.result, schemaFields);
      if (parsed.length > 0) {
        setRows(prev => {
          // if the only row is empty, replace it
          const isEmpty = prev.length === 1 && Object.values(prev[0]).every(v => !v);
          return isEmpty ? parsed : [...prev, ...parsed];
        });
        toast.success(`Imported ${parsed.length} rows from CSV`);
      } else {
        toast.error("Could not parse CSV. Make sure it has a header row.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  /* ── CSV Export template ── */
  const downloadCsvTemplate = () => {
    const header = columns.map(c => c.label).join(",");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(header + "\n");
    a.download = `${selectedTemplate?.name || "credentials"}_template.csv`;
    a.click();
  };

  /* ── Validation ── */
  const validRows = rows.filter(r =>
    r.recipientName?.trim() && r.recipientEmail?.trim() && r.recipientEmail.includes("@")
  );
  const invalidCount = rows.length - validRows.length;

  /* ── Submit ── */
  const handleSubmit = async () => {
    if (!selectedOrg?.id || !selectedWorkspace?.id || !selectedTemplate) return;
    if (validRows.length === 0) { toast.error("Add at least one valid recipient"); return; }

    setSubmitting(true);
    try {
      // The /batch endpoint expects a CSV file upload — use per-row createCredential instead.
      const results = await Promise.allSettled(
        validRows.map(r =>
          createCredential(selectedOrg.id, selectedWorkspace.id, {
            templateId: selectedTemplate.id,
            recipientName: r.recipientName.trim(),
            recipientEmail: r.recipientEmail.trim(),
            expiresAt: r.expiresAt || null,
            credentialData: Object.fromEntries(
              schemaFields.map(f => [f.key, r[f.key] ?? ""])
            ),
          })
        )
      );

      const succeeded = results.filter(r => r.status === "fulfilled" && (r.value?.id || r.value?.success)).length;
      const failed    = results.length - succeeded;

      if (succeeded > 0) {
        toast.success(
          `${succeeded} credential${succeeded !== 1 ? "s" : ""} created` +
          (failed > 0 ? ` (${failed} failed — check each row for missing required fields)` : "")
        );
        navigate("/credentials");
      } else {
        // Surface the first error message from the backend
        const firstErr = results.find(r => r.status === "rejected" || r.value?.message);
        const msg = firstErr?.reason?.message || firstErr?.value?.message || "All rows failed validation";
        toast.error(msg);
      }
    } catch (err) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Guards ── */
  if (!selectedOrg || !selectedWorkspace) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon"><GraduationCap size={28} color="var(--text-tertiary)" /></div>
            <h3>No workspace selected</h3>
            <p>Select an organization and workspace to issue credentials.</p>
            <div className="empty-actions">
              <Link to="/organizations" className="btn btn-primary btn-sm">Set Up Organization</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Hidden CSV input */}
      <input ref={fileInputRef} type="file" accept=".csv" style={{ display: "none" }} onChange={handleCsvImport} />

      {/* Template Picker Modal */}
      {showPicker && (
        <TemplatePicker
          templates={templates}
          selectedId={selectedTemplate?.id || ""}
          onSelect={handleTemplateSelect}
          onClose={() => setShowPicker(false)}
        />
      )}

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <Link to="/credentials">
            <button className="btn-icon"><ArrowLeft size={18} /></button>
          </Link>
          <div>
            <h1 className="page-title">Issue Credentials</h1>
            <p className="page-subtitle">
              {selectedTemplate ? selectedTemplate.name : "Select a template to start"}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {step >= 1 && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
                <Upload size={13} /> Import CSV
              </button>
              {selectedTemplate && (
                <button className="btn btn-ghost btn-sm" onClick={downloadCsvTemplate}>
                  <Download size={13} /> CSV Template
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Step Indicator */}
      <div className="issue-steps">
        {STEPS.map((s, i) => (
          <div key={s.id} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? "auto" : "none" }}>
            <div
              className={`issue-step${step === i ? " active" : step > i ? " done" : ""}`}
              style={{ cursor: step > i ? "pointer" : "default" }}
              onClick={() => { if (step > i) setStep(i); }}
            >
              <div className="issue-step-num">
                {step > i ? <Check size={13} /> : i + 1}
              </div>
              {s.label}
            </div>
            {i < STEPS.length - 1 && <div className="issue-step-divider" />}
          </div>
        ))}
      </div>

      {/* ── STEP 0: Template Selection ── */}
      {step === 0 && (
        <div style={{ maxWidth: 700 }}>
          {loadingTemplates ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 14 }}>
              {[1,2,3,4].map(i => <div key={i} className="skeleton-card"><div className="skeleton" style={{ aspectRatio: "4/3", borderRadius: 8 }} /></div>)}
            </div>
          ) : templates.length === 0 ? (
            <div className="card">
              <div className="empty-state">
                <div className="empty-state-icon"><FileText size={28} color="var(--text-tertiary)" /></div>
                <h3>No templates yet</h3>
                <p>Create a certificate template before issuing credentials.</p>
                <div className="empty-actions">
                  <Link to="/templates/create" className="btn btn-primary btn-sm"><Plus size={13} /> Create Template</Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Quick preview grid — shows up to 6 */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 14, marginBottom: 16 }}>
                {templates.slice(0, 6).map(t => {
                  const isSelected = selectedTemplate?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleTemplateSelect(t)}
                      className={`template-picker-card${isSelected ? " selected" : ""}`}
                      style={{ border: "none", padding: 0, textAlign: "left", width: "100%", cursor: "pointer" }}
                    >
                      <div className="template-picker-thumb">
                        {t.thumbnailUrl
                          ? <img src={t.thumbnailUrl} alt={t.name} loading="lazy" />
                          : <FileText size={24} color="var(--text-tertiary)" />}
                        {isSelected && (
                          <div style={{ position: "absolute", top: 8, right: 8, background: "var(--brand-primary)", borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={13} color="#fff" />
                          </div>
                        )}
                      </div>
                      <div className="template-picker-card-body">
                        <div className="template-picker-card-name">{t.name}</div>
                        <div className="template-picker-card-meta">
                          <span>{t.schemaDefinition?.length || 0} fields</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {templates.length > 6 && (
                <button className="btn btn-secondary btn-sm" onClick={() => setShowPicker(true)} style={{ marginBottom: 20 }}>
                  <Sparkles size={13} /> Browse all {templates.length} templates
                </button>
              )}

              <button
                className="btn btn-primary"
                disabled={!selectedTemplate}
                onClick={() => { if (selectedTemplate) setStep(1); }}
                style={{ marginTop: 8 }}
              >
                Continue with "{selectedTemplate?.name || "..."}" <ChevronRight size={14} />
              </button>
            </>
          )}
        </div>
      )}

      {/* ── STEP 1: Recipients Spreadsheet ── */}
      {step === 1 && (
        <div>
          {/* Summary bar */}
          <div className="issue-summary-bar">
            <div className="issue-summary-stat">
              <GraduationCap size={16} color="var(--brand-primary)" />
              <span><strong>{rows.length}</strong> row{rows.length !== 1 ? "s" : ""}</span>
            </div>
            <div className="issue-summary-stat">
              <Check size={14} color="var(--success)" />
              <span><strong>{validRows.length}</strong> valid</span>
            </div>
            {invalidCount > 0 && (
              <div className="issue-summary-stat" style={{ color: "var(--warning)" }}>
                <AlertTriangle size={14} />
                <span><strong>{invalidCount}</strong> incomplete</span>
              </div>
            )}
            {selectedRows.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={deleteSelected} style={{ marginLeft: "auto" }}>
                <Trash2 size={12} /> Delete {selectedRows.length} selected
              </button>
            )}
          </div>

          {/* Spreadsheet */}
          <div className="spreadsheet-wrap" style={{ marginBottom: 16 }}>
            <table className="spreadsheet">
              <thead>
                <tr>
                  <th style={{ width: 40, padding: "10px 14px" }}>
                    <input
                      type="checkbox"
                      checked={selectedRows.length === rows.length && rows.length > 0}
                      onChange={toggleSelectAll}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th style={{ width: 40, color: "var(--text-muted)", textAlign: "center" }}>#</th>
                  {columns.map(col => (
                    <th key={col.key}>
                      {col.label}
                      {col.required && <span className="cell-badge-required" />}
                    </th>
                  ))}
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, rowIdx) => (
                  <tr key={rowIdx} className={selectedRows.includes(rowIdx) ? "row-selected" : ""}>
                    {/* Checkbox */}
                    <td style={{ padding: "0 14px", width: 40 }}>
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(rowIdx)}
                        onChange={() => toggleRowSelect(rowIdx)}
                        style={{ cursor: "pointer" }}
                      />
                    </td>
                    {/* Row number */}
                    <td className="spreadsheet-row-num">{rowIdx + 1}</td>
                    {/* Data cells */}
                    {columns.map((col, colIdx) => (
                      <td key={col.key}>
                        <input
                          className="spreadsheet-cell-input"
                          type={col.type === "datetime-local" ? "datetime-local" : col.type === "date" ? "date" : col.type === "number" ? "number" : col.type === "email" ? "email" : "text"}
                          value={row[col.key] || ""}
                          placeholder={col.required ? col.label + " *" : col.label}
                          onChange={e => updateCell(rowIdx, col.key, e.target.value)}
                          onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                          data-row={rowIdx}
                          data-col={colIdx}
                        />
                      </td>
                    ))}
                    {/* Delete row */}
                    <td style={{ padding: "0 8px", width: 44, textAlign: "center" }}>
                      <button
                        onClick={() => removeRow(rowIdx)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4, borderRadius: "var(--radius-sm)", display: "flex", alignItems: "center" }}
                        title="Remove row"
                        tabIndex={-1}
                      >
                        <Trash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* Add row button */}
            <button className="spreadsheet-add-row" onClick={addRow}>
              <Plus size={14} /> Add Row
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => setStep(0)}>
              <ArrowLeft size={14} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={() => setStep(2)}
              disabled={validRows.length === 0}
            >
              Review {validRows.length} Credential{validRows.length !== 1 ? "s" : ""} <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* ── STEP 2: Review & Issue ── */}
      {step === 2 && (
        <div style={{ maxWidth: 680 }}>
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Template</div>
                <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>{selectedTemplate?.name}</div>
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 4 }}>Recipients</div>
                <div style={{ fontWeight: 700, fontSize: 22, color: "var(--brand-primary)" }}>{validRows.length}</div>
              </div>
              {invalidCount > 0 && (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--warning)", marginBottom: 4 }}>Skipped (incomplete)</div>
                  <div style={{ fontWeight: 700, color: "var(--warning)" }}>{invalidCount}</div>
                </div>
              )}
            </div>

            {/* Info note */}
            <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: 16, marginBottom: 4 }}>
              <div style={{ display: "flex", gap: 10, padding: "12px 14px", background: "var(--info-light)", borderRadius: "var(--radius-lg)", border: "1px solid rgba(59,130,246,0.2)" }}>
                <GraduationCap size={16} style={{ color: "var(--info)", flexShrink: 0, marginTop: 1 }} />
                <div style={{ fontSize: 13, color: "var(--info-text)" }}>
                  <strong>Credentials will be saved as Drafts.</strong> After creation, go to the{" "}
                  <Link to="/credentials" style={{ color: "var(--info)" }}>Credentials list</Link>{" "}
                  to review and bulk-issue them — this triggers certificate generation and email delivery.
                </div>
              </div>
            </div>
          </div>

          {/* Preview of first 5 */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
            <div className="card-header">
              <span className="card-title">Preview ({Math.min(validRows.length, 5)} of {validRows.length})</span>
            </div>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    {schemaFields.slice(0, 3).map(f => <th key={f.key}>{f.label || f.key}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {validRows.slice(0, 5).map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{row.recipientName}</td>
                      <td style={{ color: "var(--text-secondary)" }}>{row.recipientEmail}</td>
                      {schemaFields.slice(0, 3).map(f => <td key={f.key} style={{ color: "var(--text-secondary)" }}>{row[f.key] || "—"}</td>)}
                    </tr>
                  ))}
                  {validRows.length > 5 && (
                    <tr>
                      <td colSpan={3 + Math.min(schemaFields.length, 3)} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "10px", fontSize: 12 }}>
                        …and {validRows.length - 5} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => setStep(1)}>
              <ArrowLeft size={14} /> Back
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={submitting || validRows.length === 0}
              style={{ minWidth: 180 }}
            >
              {submitting
                ? <><Loader2 size={14} style={{ animation: "spin 0.7s linear infinite" }} /> Creating…</>
                : <><GraduationCap size={14} /> Create {validRows.length} Credential{validRows.length !== 1 ? "s" : ""}</>
              }
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
