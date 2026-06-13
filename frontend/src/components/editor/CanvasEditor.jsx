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
      {isSelected && <Transformer ref={trRef} rotateEnabled enabledAnchors={["top-left","top-right","bottom-left","bottom-right","middle-left","middle-right","top-center","bottom-center"]} />}
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
        <Transformer
          ref={trRef}
          rotateEnabled
          enabledAnchors={["middle-left", "middle-right"]}
        />
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
      {isSelected && <Transformer ref={trRef} rotateEnabled />}
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
function PropertiesPanel({ element, onUpdate, onDelete }) {
  if (!element) {
    return (
      <div style={panelStyle}>
        <p style={{ color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 40 }}>
          Select an element to edit its properties
        </p>
      </div>
    );
  }

  const { type, properties: props = {} } = element;

  const updateProp = (key, value) => {
    onUpdate({ ...element, properties: { ...props, [key]: value } });
  };

  const updateEl = (key, value) => {
    onUpdate({ ...element, [key]: value });
  };

  return (
    <div style={panelStyle}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: "#f9fafb", textTransform: "capitalize" }}>
          {type} Properties
        </h3>
        <button onClick={onDelete} style={{ ...smallBtn, background: "#ef4444" }}>Delete</button>
      </div>

      {/* Position & Size */}
      <Section title="Transform">
        <Row label="X"><NumInput value={element.x} onChange={(v) => updateEl("x", v)} /></Row>
        <Row label="Y"><NumInput value={element.y} onChange={(v) => updateEl("y", v)} /></Row>
        <Row label="Width"><NumInput value={element.width} onChange={(v) => updateEl("width", v)} /></Row>
        {type !== "line" && (
          <Row label="Height"><NumInput value={element.height} onChange={(v) => updateEl("height", v)} /></Row>
        )}
        <Row label="Rotation"><NumInput value={element.rotation} onChange={(v) => updateEl("rotation", v)} /></Row>
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
        <Row label="Z-Index"><NumInput value={element.zIndex} onChange={(v) => updateEl("zIndex", v)} /></Row>
      </Section>

      {/* Type-specific */}
      {type === "text" && (
        <Section title="Text">
          <Row label="Content">
            <textarea
              value={props.text || ""}
              onChange={(e) => updateProp("text", e.target.value)}
              rows={3}
              style={{ width: "100%", fontFamily: "monospace", fontSize: 12, background: "#1f2937", color: "#f9fafb", border: "1px solid #374151", borderRadius: 4, padding: 6 }}
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
          <Row label="Font Family">
            <select value={props.fontFamily || "sans-serif"} onChange={(e) => updateProp("fontFamily", e.target.value)} style={selectStyle}>
              {["sans-serif","serif","Georgia","Arial","Courier New","Trebuchet MS","Times New Roman","Verdana","Impact"].map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </Row>
          <Row label="Font Size"><NumInput value={props.fontSize || 16} onChange={(v) => updateProp("fontSize", v)} /></Row>
          <Row label="Style">
            <select value={props.fontStyle || "normal"} onChange={(e) => updateProp("fontStyle", e.target.value)} style={selectStyle}>
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="italic">Italic</option>
              <option value="bold italic">Bold Italic</option>
            </select>
          </Row>
          <Row label="Color">
            <input type="color" value={props.fill || "#000000"} onChange={(e) => updateProp("fill", e.target.value)} style={{ width: 40, height: 28, border: "none", background: "none", cursor: "pointer" }} />
            <input value={props.fill || "#000000"} onChange={(e) => updateProp("fill", e.target.value)} style={{ ...inputStyle, width: 90, marginLeft: 8 }} />
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
        <Section title="Image Properties">
          <Row label="Upload Image">
            <div style={{ display: "flex", flexDirection: "column", gap: 6, width: "100%" }}>
              <input
                type="file"
                accept="image/*"
                id={`uploader-${element.id}`}
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;

                  // Show local preview instantly
                  const localUrl = URL.createObjectURL(file);
                  
                  onUpdate({
                    ...element,
                    _file: file,
                    properties: {
                      ...element.properties,
                      src: localUrl,
                    }
                  });
                }}
              />
              <label
                htmlFor={`uploader-${element.id}`}
                style={{
                  display: "block",
                  padding: "8px 12px",
                  background: "#3b82f6",
                  color: "#ffffff",
                  borderRadius: 6,
                  cursor: "pointer",
                  textAlign: "center",
                  fontSize: 12,
                  fontWeight: 600,
                  border: "1px solid #3b82f6",
                  boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)"
                }}
              >
                Choose File
              </label>
            </div>
          </Row>
          <Row label="Or URL">
            <input value={props.src || ""} onChange={(e) => updateProp("src", e.target.value)} style={inputStyle} placeholder="https://..." />
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
            <input type="color" value={props.fill === "transparent" ? "#ffffff" : (props.fill || "#ffffff")} onChange={(e) => updateProp("fill", e.target.value)} style={{ width: 40, height: 28, border: "none", background: "none", cursor: "pointer" }} />
            <button onClick={() => updateProp("fill", "transparent")} style={{ ...smallBtn, marginLeft: 8, fontSize: 10 }}>None</button>
          </Row>
          <Row label="Stroke">
            <input type="color" value={props.stroke || "#000000"} onChange={(e) => updateProp("stroke", e.target.value)} style={{ width: 40, height: 28, border: "none", background: "none", cursor: "pointer" }} />
            <input value={props.stroke || "#000000"} onChange={(e) => updateProp("stroke", e.target.value)} style={{ ...inputStyle, width: 80, marginLeft: 8 }} />
          </Row>
          <Row label="Stroke W"><NumInput value={props.strokeWidth || 0} onChange={(v) => updateProp("strokeWidth", v)} /></Row>
          {props.shapeType === "rect" && (
            <Row label="Radius"><NumInput value={props.cornerRadius || 0} onChange={(v) => updateProp("cornerRadius", v)} /></Row>
          )}
        </Section>
      )}

      {type === "line" && (
        <Section title="Line">
          <Row label="Color">
            <input type="color" value={props.stroke || "#000000"} onChange={(e) => updateProp("stroke", e.target.value)} style={{ width: 40, height: 28, border: "none", background: "none", cursor: "pointer" }} />
            <input value={props.stroke || "#000000"} onChange={(e) => updateProp("stroke", e.target.value)} style={{ ...inputStyle, width: 90, marginLeft: 8 }} />
          </Row>
          <Row label="Width (px)"><NumInput value={element.width} onChange={(v) => updateEl("width", v)} /></Row>
          <Row label="Thickness"><NumInput value={props.strokeWidth || 1} onChange={(v) => updateProp("strokeWidth", v)} /></Row>
        </Section>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Sub-components for properties panel
// ──────────────────────────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, marginBottom: 8 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>{children}</div>
    </div>
  );
}

function Row({ label, children }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#9ca3af", width: 72, flexShrink: 0 }}>{label}</span>
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
// Shared inline styles
// ──────────────────────────────────────────────────────────────
const inputStyle = {
  background: "#1f2937",
  border: "1px solid #374151",
  borderRadius: 4,
  color: "#f9fafb",
  padding: "3px 6px",
  fontSize: 12,
  width: "100%",
};

const selectStyle = {
  ...inputStyle,
  width: "100%",
  cursor: "pointer",
};

const smallBtn = {
  background: "#374151",
  border: "none",
  borderRadius: 4,
  color: "#f9fafb",
  fontSize: 11,
  padding: "3px 8px",
  cursor: "pointer",
};

const panelStyle = {
  width: 200,
  background: "#111827",
  borderLeft: "1px solid #1f2937",
  padding: 12,
  overflowY: "auto",
  flexShrink: 0,
};

// ──────────────────────────────────────────────────────────────
// Toolbar
// ──────────────────────────────────────────────────────────────
const ELEMENT_BUTTONS = [
  { type: "text",      label: "T",    title: "Text" },
  { type: "image",     label: "🖼",   title: "Image" },
  { type: "signature", label: "✍",   title: "Signature" },
  { type: "qrcode",    label: "⬛",   title: "QR Code" },
  { type: "shape",     label: "⬜",   title: "Shape" },
  { type: "line",      label: "─",    title: "Line" },
];

function Toolbar({ onAdd, onBgColor, bgColor }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      background: "#1f2937",
      borderBottom: "1px solid #374151",
      padding: "8px 16px",
      flexShrink: 0,
    }}>
      <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, letterSpacing: 1 }}>ADD ELEMENT</span>
      {ELEMENT_BUTTONS.map(({ type, label, title }) => (
        <button
          key={type}
          title={title}
          onClick={() => onAdd(type)}
          style={{
            background: "#374151",
            border: "none",
            borderRadius: 6,
            color: "#f9fafb",
            fontSize: 15,
            width: 36,
            height: 36,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: 700,
          }}
        >
          {label}
        </button>
      ))}
      <div style={{ marginLeft: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 11, color: "#6b7280" }}>BG</span>
        <input
          type="color"
          value={bgColor || "#ffffff"}
          onChange={(e) => onBgColor(e.target.value)}
          style={{ width: 28, height: 28, border: "none", background: "none", cursor: "pointer" }}
        />
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// Layers panel
// ──────────────────────────────────────────────────────────────
function LayersPanel({ elements, selectedId, onSelect, onReorder, onToggleLock }) {
  const sorted = [...elements].sort((a, b) => (b.zIndex ?? 0) - (a.zIndex ?? 0));
  return (
    <div style={{ width: 120, background: "#0f172a", borderRight: "1px solid #1f2937", display: "flex", flexDirection: "column", flexShrink: 0 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#6b7280", textTransform: "uppercase", letterSpacing: 1, padding: "12px 12px 8px" }}>Layers</div>
      <div style={{ overflowY: "auto", flex: 1 }}>
        {sorted.map((el) => (
          <div
            key={el.id}
            onClick={() => onSelect(el.id)}
            style={{
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              background: selectedId === el.id ? "#1e3a5f" : "transparent",
              borderLeft: selectedId === el.id ? "2px solid #3b82f6" : "2px solid transparent",
            }}
          >
            <span style={{ fontSize: 13, color: "#9ca3af", width: 18, flexShrink: 0 }}>
              {ELEMENT_BUTTONS.find(b => b.type === el.type)?.label || "•"}
            </span>
            <span style={{ fontSize: 12, color: "#d1d5db", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {el.type === "text"
                ? (el.properties?.text || "Text").slice(0, 20)
                : `${el.type} ${el.id.slice(-4)}`}
            </span>
            <button
              title={el.locked ? "Unlock" : "Lock"}
              onClick={(e) => { e.stopPropagation(); onToggleLock(el.id); }}
              style={{ background: "none", border: "none", color: el.locked ? "#ef4444" : "#6b7280", cursor: "pointer", fontSize: 12, padding: 0 }}
            >
              {el.locked ? "🔒" : "🔓"}
            </button>
          </div>
        ))}
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
export default function CanvasEditor({ initialData, orientation = "LANDSCAPE", onChange, variables = {} }) {
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

  // Update dimensions when orientation changes
  useEffect(() => {
    setEditorData(prev => ({
      ...prev,
      width: canvasWidth,
      height: canvasHeight,
    }));
  }, [orientation, canvasWidth, canvasHeight]);

  const [selectedId, setSelectedId] = useState(null);

  // ── Dynamic scale: measure the canvas container and compute scale ──
  const canvasContainerRef = useRef(null);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const el = canvasContainerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Compute scale so the full canvas fits inside the container, preserving aspect ratio
  const PAD = 24; // 12px padding on each side
  const availW = Math.max(containerSize.width - PAD, 100);
  const availH = Math.max(containerSize.height - PAD, 100);
  const scale = Math.min(availW / canvasWidth, availH / canvasHeight);

  const stageWidth = Math.round(canvasWidth * scale);
  const stageHeight = Math.round(canvasHeight * scale);

  // Emit changes to parent
  const emit = useCallback((data) => {
    setEditorData(data);
    onChange?.(data);
  }, [onChange]);

  const updateElement = useCallback((updated) => {
    emit({
      ...editorData,
      elements: editorData.elements.map((el) => el.id === updated.id ? updated : el),
    });
  }, [editorData, emit]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    emit({
      ...editorData,
      elements: editorData.elements.filter((el) => el.id !== selectedId),
    });
    setSelectedId(null);
  }, [selectedId, editorData, emit]);

  const addElement = useCallback((type) => {
    let newEl;
    const w = editorData.width || canvasWidth;
    const h = editorData.height || canvasHeight;
    const nextZ = editorData.elements.length;
    switch (type) {
      case "text":      newEl = makeTextElement(w, h, { zIndex: nextZ }); break;
      case "image":     newEl = makeImageElement("", w, h, { zIndex: nextZ }); break;
      case "signature": newEl = makeSignatureElement(w, h, { zIndex: nextZ }); break;
      case "qrcode":    newEl = makeQrCodeElement(w, h, { zIndex: nextZ }); break;
      case "shape":     newEl = makeShapeElement(w, h, { zIndex: nextZ }); break;
      case "line":      newEl = makeLineElement(w, h, { zIndex: nextZ }); break;
      default: return;
    }
    const updated = { ...editorData, elements: [...editorData.elements, newEl] };
    emit(updated);
    setSelectedId(newEl.id);
  }, [editorData, canvasWidth, canvasHeight, emit]);

  const setBgColor = useCallback((color) => {
    emit({ ...editorData, background: { type: "color", value: color } });
  }, [editorData, emit]);

  const toggleLock = useCallback((id) => {
    emit({
      ...editorData,
      elements: editorData.elements.map((el) =>
        el.id === id ? { ...el, locked: !el.locked } : el
      ),
    });
  }, [editorData, emit]);

  const selectedElement = editorData.elements.find((el) => el.id === selectedId) ?? null;

  const sorted = [...editorData.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  const bgColor = editorData.background?.value || "#ffffff";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "#111827", minHeight: 0 }}>
      <Toolbar onAdd={addElement} onBgColor={setBgColor} bgColor={bgColor} />

      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Layers panel */}
        <LayersPanel
          elements={editorData.elements}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onToggleLock={toggleLock}
        />

        {/* Canvas area — measured by ResizeObserver for dynamic scaling */}
        <div
          ref={canvasContainerRef}
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 12,
            background: "#1f2937",
            minWidth: 0,
            minHeight: 0,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setSelectedId(null); }}
        >
          <div style={{
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            borderRadius: 4,
            overflow: "hidden",
            flexShrink: 0,
            width: stageWidth,
            height: stageHeight,
          }}>
            <Stage
              width={stageWidth}
              height={stageHeight}
              scaleX={scale}
              scaleY={scale}
              onMouseDown={(e) => { if (e.target === e.target.getStage()) setSelectedId(null); }}
            >
              <Layer>
                {/* Background rect */}
                <Rect
                  x={0} y={0}
                  width={editorData.width || canvasWidth}
                  height={editorData.height || canvasHeight}
                  fill={bgColor}
                />
                {/* Elements */}
                {sorted.map((el) => {
                  const isSelected = el.id === selectedId;
                  const commonProps = { key: el.id, el, isSelected, onSelect: setSelectedId, onChange: updateElement };

                  switch (el.type) {
                    case "text":      return <TextElement {...commonProps} variables={variables} />;
                    case "image":     return <KonvaUrlImage {...commonProps} />;
                    case "signature": return <KonvaUrlImage {...commonProps} />;
                    case "qrcode":    return <QrCodeElement {...commonProps} variables={variables} />;
                    case "shape":     return <ShapeElement {...commonProps} />;
                    case "line":      return <LineElement {...commonProps} />;
                    default: return null;
                  }
                })}
              </Layer>
            </Stage>
          </div>
        </div>

        {/* Properties panel */}
        <PropertiesPanel
          element={selectedElement}
          onUpdate={updateElement}
          onDelete={deleteSelected}
        />
      </div>
    </div>
  );
}
