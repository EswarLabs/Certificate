import { useState, useRef, useCallback, useEffect } from "react";
import {
  Stage,
  Layer,
  Rect,
  Text,
  Image as KonvaImage,
  Line,
  Circle,
  Ellipse,
  Transformer,
} from "react-konva";
import useImage from "use-image";
import {
  generateElementId,
  makeTextElement,
  makeImageElement,
  makeSignatureElement,
  makeQrCodeElement,
  makeShapeElement,
  makeLineElement,
  injectVariables,
} from "../../utils/editorDataRenderer.js";

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

/**
 * Ensure every element has all required base fields so the backend Zod
 * schema never sees undefined where a .default() was expected.
 * This mirrors the schema defaults exactly.
 */
function normaliseElement(el) {
  return {
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    ...el,
  };
}

// ──────────────────────────────────────────────────────────────
// Konva image element (handles remote URLs)
// ──────────────────────────────────────────────────────────────
function KonvaUrlImage({ el, isSelected, onSelect, onChange }) {
  const [image] = useImage(el.properties.src, "anonymous");
  const imageRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={image}
        x={el.x}
        y={el.y}
        width={el.width}
        height={el.height}
        rotation={el.rotation}
        opacity={el.opacity}
        draggable={!el.locked}
        onClick={() => onSelect(el.id)}
        onTap={() => onSelect(el.id)}
        onDragEnd={(e) => onChange({ ...el, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={(e) => {
          const node = imageRef.current;
          onChange({
            ...el,
            x: node.x(),
            y: node.y(),
            width: Math.max(10, node.width() * node.scaleX()),
            height: Math.max(10, node.height() * node.scaleY()),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled
          anchorSize={18}
          anchorCornerRadius={4}
          enabledAnchors={["top-left", "top-right", "bottom-left", "bottom-right", "middle-left", "middle-right", "top-center", "bottom-center"]}
        />
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// QR code image element (uses qrserver CDN)
// ──────────────────────────────────────────────────────────────
function QrCodeElement({ el, variables, isSelected, onSelect, onChange }) {
  const rawValue = injectVariables(el.properties.value || "", variables);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${Math.round(el.width)}x${Math.round(el.height)}&data=${encodeURIComponent(rawValue || "https://example.com")}`;
  return (
    <KonvaUrlImage
      el={{ ...el, properties: { src: qrSrc } }}
      isSelected={isSelected}
      onSelect={onSelect}
      onChange={onChange}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// Text element
// ──────────────────────────────────────────────────────────────
function TextElement({ el, variables, isSelected, onSelect, onChange }) {
  const textRef = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const displayText = injectVariables(el.properties.text || "", variables);
  const props = el.properties;
  const fontStyle = [
    (props.fontStyle || "").includes("bold") ? "bold" : "",
    (props.fontStyle || "").includes("italic") ? "italic" : "",
  ].filter(Boolean).join(" ") || "normal";

  return (
    <>
      <Text
        ref={textRef}
        x={el.x}
        y={el.y}
        width={el.width}
        text={displayText}
        fontFamily={props.fontFamily || "sans-serif"}
        fontSize={props.fontSize || 16}
        fontStyle={fontStyle}
        fill={props.fill || "#000000"}
        align={props.align || "left"}
        rotation={el.rotation}
        opacity={el.opacity}
        draggable={!el.locked}
        onClick={() => onSelect(el.id)}
        onTap={() => onSelect(el.id)}
        onDragEnd={(e) => onChange({ ...el, x: e.target.x(), y: e.target.y() })}
        onTransformEnd={() => {
          const node = textRef.current;
          onChange({
            ...el,
            x: node.x(),
            y: node.y(),
            width: Math.max(50, node.width() * node.scaleX()),
            rotation: node.rotation(),
          });
          node.scaleX(1);
          node.scaleY(1);
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} rotateEnabled anchorSize={18} anchorCornerRadius={4} enabledAnchors={["middle-left", "middle-right"]} />
      )}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Shape element
// ──────────────────────────────────────────────────────────────
function ShapeElement({ el, isSelected, onSelect, onChange }) {
  const ref = useRef();
  const trRef = useRef();

  useEffect(() => {
    if (isSelected && trRef.current && ref.current) {
      trRef.current.nodes([ref.current]);
      trRef.current.getLayer().batchDraw();
    }
  }, [isSelected]);

  const props = el.properties;
  const commonProps = {
    ref,
    x: el.x,
    y: el.y,
    fill: props.fill || "transparent",
    stroke: props.stroke || "transparent",
    strokeWidth: props.strokeWidth || 0,
    rotation: el.rotation,
    opacity: el.opacity,
    draggable: !el.locked,
    onClick: () => onSelect(el.id),
    onTap: () => onSelect(el.id),
    onDragEnd: (e) => onChange({ ...el, x: e.target.x(), y: e.target.y() }),
    onTransformEnd: () => {
      const node = ref.current;
      onChange({
        ...el,
        x: node.x(),
        y: node.y(),
        width: Math.max(10, node.width() * node.scaleX()),
        height: Math.max(10, node.height() * node.scaleY()),
        rotation: node.rotation(),
      });
      node.scaleX(1);
      node.scaleY(1);
    },
  };

  const shape =
    props.shapeType === "circle" ? (
      <Circle {...commonProps} radius={Math.min(el.width, el.height) / 2} />
    ) : props.shapeType === "ellipse" ? (
      <Ellipse {...commonProps} radiusX={el.width / 2} radiusY={el.height / 2} />
    ) : (
      <Rect {...commonProps} width={el.width} height={el.height} cornerRadius={props.cornerRadius || 0} />
    );

  return (
    <>
      {shape}
      {isSelected && <Transformer ref={trRef} rotateEnabled anchorSize={18} anchorCornerRadius={4} />}
    </>
  );
}

// ──────────────────────────────────────────────────────────────
// Line element
// ──────────────────────────────────────────────────────────────
function LineElement({ el, isSelected, onSelect, onChange }) {
  const props = el.properties;
  return (
    <Line
      x={el.x}
      y={el.y}
      points={[0, 0, el.width, 0]}
      stroke={props.stroke || "#000"}
      strokeWidth={props.strokeWidth || 1}
      rotation={el.rotation}
      opacity={el.opacity}
      draggable={!el.locked}
      onClick={() => onSelect(el.id)}
      onTap={() => onSelect(el.id)}
      onDragEnd={(e) => onChange({ ...el, x: e.target.x(), y: e.target.y() })}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// Properties panel
// ──────────────────────────────────────────────────────────────
function PropertiesPanel({ element, onUpdate, onDelete, onClose, fullWidth }) {
  const containerStyle = fullWidth ? { ...panelStyle, width: "100%", borderLeft: "none", padding: "4px 8px" } : panelStyle;

  if (!element) {
    return (
      <div style={containerStyle}>
        <p style={{ color: "var(--text-tertiary)", fontSize: 13, textAlign: "center", marginTop: 40 }}>
          Select an element to edit
        </p>
      </div>
    );
  }

  const { type, properties: props = {} } = element;

  const updateProp = (key, value) =>
    onUpdate({ ...element, properties: { ...props, [key]: value } });

  const updateEl = (key, value) =>
    onUpdate({ ...element, [key]: value });

  return (
    <div style={containerStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textTransform: "capitalize" }}>
          {type}
        </h3>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={onDelete} style={{ ...smallBtn, background: "var(--danger)", color: "#fff" }}>Delete</button>
          {onClose && (
            <button onClick={onClose} style={{ ...smallBtn, background: "var(--bg-hover)" }}>✕</button>
          )}
        </div>
      </div>

      {/* Transform */}
      <Section title="Transform">
        <Row label="X"><NumInput value={element.x} onChange={(v) => updateEl("x", v)} /></Row>
        <Row label="Y"><NumInput value={element.y} onChange={(v) => updateEl("y", v)} /></Row>
        <Row label="W"><NumInput value={element.width} onChange={(v) => updateEl("width", v)} /></Row>
        {type !== "line" && (
          <Row label="H"><NumInput value={element.height} onChange={(v) => updateEl("height", v)} /></Row>
        )}
        <Row label="Rot"><NumInput value={element.rotation} onChange={(v) => updateEl("rotation", v)} /></Row>
        <Row label="Opacity">
          <input
            type="range" min={0} max={1} step={0.05}
            value={element.opacity ?? 1}
            onChange={(e) => updateEl("opacity", parseFloat(e.target.value))}
            style={{ width: "100%" }}
          />
        </Row>
        <Row label="Locked">
          <input type="checkbox" checked={element.locked} onChange={(e) => updateEl("locked", e.target.checked)} />
        </Row>
        <Row label="Z"><NumInput value={element.zIndex} onChange={(v) => updateEl("zIndex", v)} /></Row>
      </Section>

      {type === "text" && (
        <Section title="Text">
          <Row label="Content">
            <textarea
              value={props.text || ""}
              onChange={(e) => updateProp("text", e.target.value)}
              rows={3}
              style={textareaStyle}
            />
          </Row>
          <Row label="Variable">
            <input
              value={props.variable || ""}
              onChange={(e) => updateProp("variable", e.target.value || null)}
              placeholder="e.g. recipientName"
              style={inputStyle}
            />
          </Row>
          <Row label="Font">
            <select value={props.fontFamily || "sans-serif"} onChange={(e) => updateProp("fontFamily", e.target.value)} style={selectStyle}>
              {["sans-serif", "serif", "Georgia", "Arial", "Courier New", "Trebuchet MS", "Times New Roman", "Verdana", "Impact"].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Row>
          <Row label="Size"><NumInput value={props.fontSize || 16} onChange={(v) => updateProp("fontSize", v)} /></Row>
          <Row label="Style">
            <select value={props.fontStyle || "normal"} onChange={(e) => updateProp("fontStyle", e.target.value)} style={selectStyle}>
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="italic">Italic</option>
              <option value="bold italic">Bold Italic</option>
            </select>
          </Row>
          <Row label="Color">
            <input type="color" value={props.fill || "#000000"} onChange={(e) => updateProp("fill", e.target.value)} style={colorInputStyle} />
            <input value={props.fill || "#000000"} onChange={(e) => updateProp("fill", e.target.value)} style={{ ...inputStyle, width: 80, marginLeft: 6 }} />
          </Row>
          <Row label="Align">
            <select value={props.align || "left"} onChange={(e) => updateProp("align", e.target.value)} style={selectStyle}>
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </Row>
        </Section>
      )}

      {(type === "image" || type === "signature") && (
        <Section title="Image">
          <Row label="Upload">
            <div style={{ width: "100%" }}>
              <input
                type="file"
                accept="image/*"
                id={`uploader-${element.id}`}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  const localUrl = URL.createObjectURL(file);
                  onUpdate({ ...element, _file: file, properties: { ...element.properties, src: localUrl } });
                }}
              />
              <label
                htmlFor={`uploader-${element.id}`}
                style={uploadLabelStyle}
              >
                Choose File
              </label>
            </div>
          </Row>
          <Row label="URL">
            <input value={props.src || ""} onChange={(e) => updateProp("src", e.target.value)} style={inputStyle} placeholder="https://…" />
          </Row>
          {type === "image" && (
            <Row label="Fit">
              <select value={props.objectFit || "contain"} onChange={(e) => updateProp("objectFit", e.target.value)} style={selectStyle}>
                <option value="contain">Contain</option>
                <option value="cover">Cover</option>
                <option value="fill">Fill</option>
              </select>
            </Row>
          )}
        </Section>
      )}

      {type === "qrcode" && (
        <Section title="QR Code">
          <Row label="Value">
            <input value={props.value || ""} onChange={(e) => updateProp("value", e.target.value)} style={inputStyle} placeholder="{{verificationUrl}}" />
          </Row>
          <Row label="Variable">
            <input value={props.variable || ""} onChange={(e) => updateProp("variable", e.target.value || null)} style={inputStyle} placeholder="verificationUrl" />
          </Row>
        </Section>
      )}

      {type === "shape" && (
        <Section title="Shape">
          <Row label="Type">
            <select value={props.shapeType || "rect"} onChange={(e) => updateProp("shapeType", e.target.value)} style={selectStyle}>
              <option value="rect">Rectangle</option>
              <option value="circle">Circle</option>
              <option value="ellipse">Ellipse</option>
            </select>
          </Row>
          <Row label="Fill">
            <input type="color" value={props.fill === "transparent" ? "#ffffff" : (props.fill || "#ffffff")} onChange={(e) => updateProp("fill", e.target.value)} style={colorInputStyle} />
            <button onClick={() => updateProp("fill", "transparent")} style={{ ...smallBtn, marginLeft: 6, fontSize: 10 }}>None</button>
          </Row>
          <Row label="Stroke">
            <input type="color" value={props.stroke || "#000000"} onChange={(e) => updateProp("stroke", e.target.value)} style={colorInputStyle} />
            <input value={props.stroke || "#000000"} onChange={(e) => updateProp("stroke", e.target.value)} style={{ ...inputStyle, width: 72, marginLeft: 6 }} />
          </Row>
          <Row label="S.Width"><NumInput value={props.strokeWidth || 0} onChange={(v) => updateProp("strokeWidth", v)} /></Row>
          {props.shapeType === "rect" && (
            <Row label="Radius"><NumInput value={props.cornerRadius || 0} onChange={(v) => updateProp("cornerRadius", v)} /></Row>
          )}
        </Section>
      )}

      {type === "line" && (
        <Section title="Line">
          <Row label="Color">
            <input type="color" value={props.stroke || "#000000"} onChange={(e) => updateProp("stroke", e.target.value)} style={colorInputStyle} />
            <input value={props.stroke || "#000000"} onChange={(e) => updateProp("stroke", e.target.value)} style={{ ...inputStyle, width: 72, marginLeft: 6 }} />
          </Row>
          <Row label="Length"><NumInput value={element.width} onChange={(v) => updateEl("width", v)} /></Row>
          <Row label="Thickness"><NumInput value={props.strokeWidth || 1} onChange={(v) => updateProp("strokeWidth", v)} /></Row>
        </Section>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components
// ──────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--text-tertiary)", width: 56, flexShrink: 0 }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", flex: 1 }}>{children}</div>
    </div>
  );
}

function NumInput({ value, onChange }) {
  return (
    <input
      type="number"
      value={value ?? 0}
      onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
      style={{ ...inputStyle, width: "100%" }}
    />
  );
}

// ──────────────────────────────────────────────────────────────
// Styles — uses CSS variables to match the app theme
// ──────────────────────────────────────────────────────────────
const inputStyle = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border-color)",
  borderRadius: 4,
  color: "var(--text-primary)",
  padding: "3px 6px",
  fontSize: 12,
  width: "100%",
};

const textareaStyle = {
  ...inputStyle,
  fontFamily: "var(--font-mono, monospace)",
  resize: "vertical",
};

const selectStyle = {
  ...inputStyle,
  cursor: "pointer",
};

const colorInputStyle = {
  width: 28,
  height: 28,
  border: "none",
  background: "none",
  cursor: "pointer",
  padding: 0,
};

const smallBtn = {
  background: "var(--bg-hover)",
  border: "1px solid var(--border-color)",
  borderRadius: 4,
  color: "var(--text-primary)",
  fontSize: 11,
  padding: "3px 8px",
  cursor: "pointer",
};

const uploadLabelStyle = {
  display: "block",
  padding: "7px 12px",
  background: "var(--brand-primary)",
  color: "#ffffff",
  borderRadius: 6,
  cursor: "pointer",
  textAlign: "center",
  fontSize: 12,
  fontWeight: 600,
};

const panelStyle = {
  width: 196,
  background: "var(--bg-secondary)",
  borderLeft: "1px solid var(--border-color)",
  padding: "12px 10px",
  overflowY: "auto",
  flexShrink: 0,
};

// ──────────────────────────────────────────────────────────────
// Toolbar
// ──────────────────────────────────────────────────────────────
const ELEMENT_BUTTONS = [
  { type: "text", label: "T", title: "Text" },
  { type: "image", label: "🖼", title: "Image" },
  { type: "signature", label: "✍", title: "Signature" },
  { type: "qrcode", label: "⬛", title: "QR Code" },
  { type: "shape", label: "⬜", title: "Shape" },
  { type: "line", label: "─", title: "Line" },
];

function Toolbar({ onAdd, onBgColor, bgColor, isMobile, zoomLevel = 1, onZoomIn, onZoomOut, onResetZoom }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: isMobile ? 6 : 12,
      background: "var(--bg-secondary)",
      borderBottom: "1px solid var(--border-color)",
      padding: isMobile ? "8px 10px" : "8px 16px",
      flexShrink: 0,
      flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 4 : 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 700, letterSpacing: 1 }}>ADD</span>
        {ELEMENT_BUTTONS.map(({ type, label, title }) => (
          <button
            key={type}
            title={title}
            onClick={() => onAdd(type)}
            style={{
              background: "var(--bg-hover)",
              border: "1px solid var(--border-color)",
              borderRadius: 6,
              color: "var(--text-primary)",
              fontSize: isMobile ? 15 : 15,
              width: isMobile ? 36 : 34,
              height: isMobile ? 36 : 34,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {label}
          </button>
        ))}
        <div style={{ marginLeft: isMobile ? 4 : 8, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 700 }}>BG</span>
          <input
            type="color"
            value={bgColor || "#ffffff"}
            onChange={(e) => onBgColor(e.target.value)}
            style={{ width: isMobile ? 32 : 26, height: isMobile ? 32 : 26, border: "none", background: "none", cursor: "pointer" }}
          />
        </div>
      </div>

      {/* Zoom controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
        <span style={{ fontSize: 10, color: "var(--text-tertiary)", fontWeight: 700, marginRight: 2 }}>ZOOM</span>
        <button
          onClick={onZoomOut}
          disabled={zoomLevel <= 0.5}
          className="btn btn-secondary"
          style={{ padding: "4px 8px", fontSize: 13, height: isMobile ? 32 : 28 }}
          title="Zoom Out"
        >
          −
        </button>
        <button
          onClick={onResetZoom}
          className="btn btn-secondary"
          style={{ padding: "4px 8px", fontSize: 11, fontWeight: 600, height: isMobile ? 32 : 28, minWidth: 46 }}
          title="Reset Zoom"
        >
          {Math.round(zoomLevel * 100)}%
        </button>
        <button
          onClick={onZoomIn}
          disabled={zoomLevel >= 3}
          className="btn btn-secondary"
          style={{ padding: "4px 8px", fontSize: 13, height: isMobile ? 32 : 28 }}
          title="Zoom In"
        >
          +
        </button>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Layers panel
// ──────────────────────────────────────────────────────────────
function LayersPanel({ elements, selectedId, onSelect, onToggleLock, isMobile }) {
  if (isMobile) return null; // hidden on mobile — access via layer list in bottom sheet

  const sorted = [...elements].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  return (
    <div style={{
      width: 110,
      background: "var(--bg-primary)",
      borderRight: "1px solid var(--border-color)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: 1, padding: "10px 10px 6px" }}>
        Layers
      </div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {sorted.map((el) => (
          <div
            key={el.id}
            onClick={() => onSelect(el.id)}
            style={{
              padding: "5px 10px",
              display: "flex",
              alignItems: "center",
              gap: 6,
              cursor: "pointer",
              background: selectedId === el.id ? "var(--bg-hover)" : "transparent",
              borderLeft: selectedId === el.id ? "2px solid var(--brand-primary)" : "2px solid transparent",
            }}
          >
            <span style={{ fontSize: 12, color: "var(--text-secondary)", width: 16, flexShrink: 0 }}>
              {ELEMENT_BUTTONS.find(b => b.type === el.type)?.label || "•"}
            </span>
            <span style={{ fontSize: 11, color: "var(--text-primary)", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {el.type === "text"
                ? (el.properties?.text || "Text").slice(0, 14)
                : `${el.type.slice(0, 3)} ${el.id.slice(-4)}`}
            </span>
            <button
              title={el.locked ? "Unlock" : "Lock"}
              onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }}
              style={{ background: "none", border: "none", color: el.locked ? "var(--danger)" : "var(--text-tertiary)", cursor: "pointer", fontSize: 11, padding: 0, flexShrink: 0 }}
            >
              {el.locked ? "🔒" : "🔓"}
            </button>
          </div>
        ))}
        {elements.length === 0 && (
          <p style={{ fontSize: 11, color: "var(--text-tertiary)", padding: "8px 10px", margin: 0 }}>No elements yet</p>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Mobile bottom sheet for element list + properties
// ──────────────────────────────────────────────────────────────
function MobileBottomSheet({ elements, selectedId, onSelect, onToggleLock, selectedElement, onUpdate, onDelete }) {
  const [tab, setTab] = useState("layers"); // "layers" | "props"
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (selectedId) {
      setTab("props");
      setIsExpanded(true);
    }
  }, [selectedId]);

  const sorted = [...elements].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));

  return (
    <div style={{
      background: "var(--bg-secondary)",
      borderTop: "1px solid var(--border-color)",
      flexShrink: 0,
      height: isExpanded ? 340 : 200,
      maxHeight: "55vh",
      display: "flex",
      flexDirection: "column",
      transition: "height 0.2s ease",
      boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
    }}>
      {/* Tab bar */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border-color)", flexShrink: 0 }}>
        {["layers", "props"].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              background: tab === t ? "var(--bg-hover)" : "transparent",
              border: "none",
              borderBottom: tab === t ? "2px solid var(--brand-primary)" : "2px solid transparent",
              color: tab === t ? "var(--text-primary)" : "var(--text-tertiary)",
              fontSize: 12,
              fontWeight: 600,
              padding: "10px 0",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {t === "layers" ? `Layers (${elements.length})` : "Properties"}
          </button>
        ))}
        <button
          onClick={() => setIsExpanded(v => !v)}
          style={{
            background: "transparent",
            border: "none",
            borderLeft: "1px solid var(--border-color)",
            color: "var(--text-secondary)",
            padding: "8px 16px",
            fontSize: 12,
            cursor: "pointer",
            fontWeight: 600,
          }}
          title={isExpanded ? "Collapse" : "Expand"}
        >
          {isExpanded ? "▼ Minimize" : "▲ Expand"}
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {tab === "layers" ? (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {sorted.map(el => (
              <div
                key={el.id}
                onClick={() => { onSelect(el.id); setTab("props"); }}
                style={{
                  padding: "10px 16px",
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  background: selectedId === el.id ? "var(--bg-hover)" : "transparent",
                  borderLeft: selectedId === el.id ? "3px solid var(--brand-primary)" : "3px solid transparent",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <span style={{ fontSize: 16 }}>{ELEMENT_BUTTONS.find(b => b.type === el.type)?.label || "•"}</span>
                <span style={{ fontSize: 13, color: "var(--text-primary)", flex: 1, fontWeight: 500 }}>
                  {el.type === "text" ? (el.properties?.text || "Text").slice(0, 24) : `${el.type} ${el.id.slice(-4)}`}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 15, padding: 4, color: el.locked ? "var(--danger)" : "var(--text-tertiary)" }}
                >
                  {el.locked ? "🔒" : "🔓"}
                </button>
              </div>
            ))}
            {elements.length === 0 && (
              <p style={{ fontSize: 13, color: "var(--text-tertiary)", padding: "16px", margin: 0, textAlign: "center" }}>Add an element from the toolbar above</p>
            )}
          </div>
        ) : (
          <div style={{ padding: "8px" }}>
            {selectedElement && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8, paddingBottom: 8, borderBottom: "1px dashed var(--border-color)" }}>
                <button
                  onClick={() => onSelect(null)}
                  className="btn btn-secondary"
                  style={{ fontSize: 11, padding: "4px 10px" }}
                >
                  ✕ Deselect Element
                </button>
              </div>
            )}
            <PropertiesPanel element={selectedElement} onUpdate={onUpdate} onDelete={onDelete} fullWidth />
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Main CanvasEditor component
// ──────────────────────────────────────────────────────────────

/**
 * @param {Object}   props.initialData  - editorData JSON (null for new template)
 * @param {string}   props.orientation  - "LANDSCAPE" | "PORTRAIT"
 * @param {Function} props.onChange     - Called with updated editorData on every change
 * @param {Object}   props.variables    - Preview variable substitution map
 */
export default function CanvasEditor({ initialData, orientation = "LANDSCAPE", onChange, variables = {}, stageRef }) {
  const isLandscape = orientation === "LANDSCAPE";
  const canvasWidth = isLandscape ? 1200 : 900;
  const canvasHeight = isLandscape ? 900 : 1200;

  const [editorData, setEditorData] = useState(() => {
    if (initialData) return initialData;
    return {
      version: 1,
      width: canvasWidth,
      height: canvasHeight,
      background: { type: "color", value: "#ffffff" },
      elements: [],
    };
  });

  // Update canvas dimensions when orientation changes
  useEffect(() => {
    setEditorData(prev => ({ ...prev, width: canvasWidth, height: canvasHeight }));
  }, [orientation, canvasWidth, canvasHeight]);

  // Sync state when parent updates initialData (e.g. adding/deleting schema fields)
  useEffect(() => {
    if (initialData && initialData !== editorData) {
      setEditorData(initialData);
    }
  }, [initialData]);

  const [selectedId, setSelectedId] = useState(null);

  // ── Responsive: measure editor container width ──
  const editorContainerRef = useRef(null);
  const [editorWidth, setEditorWidth] = useState(800);

  useEffect(() => {
    const el = editorContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        setEditorWidth(entry.contentRect.width);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const isMobile = editorWidth < 640;

  // ── Dynamic scale for the canvas stage ──
  const canvasContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setContainerSize({ width, height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const PAD = 16;
  const availW = Math.max(containerSize.width - PAD, 80);
  const availH = Math.max(containerSize.height - PAD, 80);
  const baseScale = Math.min(availW / canvasWidth, availH / canvasHeight);

  const [zoomLevel, setZoomLevel] = useState(1);
  const handleZoomIn = useCallback(() => setZoomLevel(z => Math.min(z + 0.25, 3)), []);
  const handleZoomOut = useCallback(() => setZoomLevel(z => Math.max(z - 0.25, 0.5)), []);
  const handleResetZoom = useCallback(() => setZoomLevel(1), []);

  const displayScale = baseScale * zoomLevel;
  const stageWidth = Math.round(canvasWidth * displayScale);
  const stageHeight = Math.round(canvasHeight * displayScale);
  const isOverflowing = stageWidth > (containerSize.width - 10) || stageHeight > (containerSize.height - 10);

  // ── Emit normalised editorData to parent ──
  const emit = useCallback((data) => {
    // Normalise every element to ensure required base fields are present,
    // so the backend Zod schema never sees missing-default fields.
    const normalised = {
      ...data,
      elements: data.elements.map(normaliseElement),
    };
    setEditorData(normalised);
    onChange?.(normalised);
  }, [onChange]);

  const updateElement = useCallback((updated) => {
    emit({
      ...editorData,
      elements: editorData.elements.map(el => el.id === updated.id ? updated : el),
    });
  }, [editorData, emit]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    emit({
      ...editorData,
      elements: editorData.elements.filter(el => el.id !== selectedId),
    });
    setSelectedId(null);
  }, [selectedId, editorData, emit]);

  const addElement = useCallback((type) => {
    const w = editorData.width || canvasWidth;
    const h = editorData.height || canvasHeight;
    const nextZ = editorData.elements.length;
    let newEl;
    switch (type) {
      case "text": newEl = makeTextElement(w, h, { zIndex: nextZ }); break;
      case "image": newEl = makeImageElement("", w, h, { zIndex: nextZ }); break;
      case "signature": newEl = makeSignatureElement(w, h, { zIndex: nextZ }); break;
      case "qrcode": newEl = makeQrCodeElement(w, h, { zIndex: nextZ }); break;
      case "shape": newEl = makeShapeElement(w, h, { zIndex: nextZ }); break;
      case "line": newEl = makeLineElement(w, h, { zIndex: nextZ }); break;
      default: return;
    }
    // normalise immediately so defaults are always present
    const normalisedEl = normaliseElement(newEl);
    emit({ ...editorData, elements: [...editorData.elements, normalisedEl] });
    setSelectedId(normalisedEl.id);
  }, [editorData, canvasWidth, canvasHeight, emit]);

  const setBgColor = useCallback((color) => {
    emit({ ...editorData, background: { type: "color", value: color } });
  }, [editorData, emit]);

  const toggleLock = useCallback((id) => {
    emit({
      ...editorData,
      elements: editorData.elements.map(el => el.id === id ? { ...el, locked: !el.locked } : el),
    });
  }, [editorData, emit]);

  const selectedElement = editorData.elements.find(el => el.id === selectedId) ?? null;
  const sorted = [...editorData.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
  const bgColor = editorData.background?.value || "#ffffff";

  return (
    <div
      ref={editorContainerRef}
      style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-primary)", minHeight: 0 }}
    >
      <Toolbar
        onAdd={addElement}
        onBgColor={setBgColor}
        bgColor={bgColor}
        isMobile={isMobile}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {/* Middle row: layers + canvas + properties (desktop) */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        <LayersPanel
          elements={editorData.elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleLock={toggleLock}
          isMobile={isMobile}
        />

        {/* Canvas */}
        <div
          ref={canvasContainerRef}
          style={{
            flex: 1,
            overflow: "auto",
            WebkitOverflowScrolling: "touch",
            display: "flex",
            alignItems: isOverflowing ? "flex-start" : "center",
            justifyContent: isOverflowing ? "flex-start" : "center",
            padding: 16,
            background: "var(--bg-primary)",
            minWidth: 0,
            minHeight: 0,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          <div style={{
            boxShadow: "0 8px 32px rgba(0,0,0,0.32)",
            borderRadius: 3,
            overflow: "hidden",
            flexShrink: 0,
            width: stageWidth,
            height: stageHeight,
          }}>
            <Stage
              ref={stageRef}
              width={stageWidth}
              height={stageHeight}
              scaleX={displayScale}
              scaleY={displayScale}
              onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
              onTouchStart={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
            >
              <Layer>
                <Rect
                  x={0} y={0}
                  width={editorData.width || canvasWidth}
                  height={editorData.height || canvasHeight}
                  fill={bgColor}
                />
                {sorted.map((el) => {
                  const isSelected = el.id === selectedId;
                  const cp = { el, isSelected, onSelect: setSelectedId, onChange: updateElement };
                  switch (el.type) {
                    case "text": return <TextElement key={el.id} {...cp} variables={variables} />;
                    case "image": return <KonvaUrlImage key={el.id} {...cp} />;
                    case "signature": return <KonvaUrlImage key={el.id} {...cp} />;
                    case "qrcode": return <QrCodeElement key={el.id} {...cp} variables={variables} />;
                    case "shape": return <ShapeElement key={el.id} {...cp} />;
                    case "line": return <LineElement key={el.id} {...cp} />;
                    default: return null;
                  }
                })}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Desktop properties panel */}
        {!isMobile && (
          <PropertiesPanel
            element={selectedElement}
            onUpdate={updateElement}
            onDelete={deleteSelected}
          />
        )}
      </div>

      {/* Mobile bottom sheet */}
      {isMobile && (
        <MobileBottomSheet
          elements={editorData.elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleLock={toggleLock}
          selectedElement={selectedElement}
          onUpdate={updateElement}
          onDelete={deleteSelected}
        />
      )}
    </div>
  );
}