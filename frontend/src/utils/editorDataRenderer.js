/**
 * editorDataRenderer.js
 *
 * Client-side mirror of the backend renderEditorData utility.
 * Used to power the live preview inside the Konva editor
 * without requiring a server round-trip.
 */

// ──────────────────────────────────────────────────────────────
// Variable injection
// ──────────────────────────────────────────────────────────────

/**
 * Replace all {{variable}} placeholders in a string with values from the map.
 */
export function injectVariables(template, variables = {}) {
  if (!template) return "";
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : `[${key}]`;
  });
}

// ──────────────────────────────────────────────────────────────
// Build inline style object from a canvas element
// (for use in React inline style props)
// ──────────────────────────────────────────────────────────────

export function elementBaseStyle(el) {
  return {
    position: "absolute",
    left: el.x,
    top: el.y,
    width: el.width,
    height: el.height,
    opacity: el.opacity ?? 1,
    transform: `rotate(${el.rotation ?? 0}deg)`,
    transformOrigin: "center center",
    boxSizing: "border-box",
  };
}

// ──────────────────────────────────────────────────────────────
// Default editorData for a new template
// ──────────────────────────────────────────────────────────────

export function createDefaultEditorData(orientation = "LANDSCAPE") {
  const isLandscape = orientation === "LANDSCAPE";
  const canvasWidth = isLandscape ? 1200 : 900;
  const canvasHeight = isLandscape ? 900 : 1200;

  return {
    version: 1,
    width: canvasWidth,
    height: canvasHeight,
    background: { type: "color", value: "#ffffff" },
    elements: [
      {
        id: generateElementId(),
        type: "shape",
        x: 40,
        y: 40,
        width: canvasWidth - 80,
        height: canvasHeight - 80,
        rotation: 0,
        opacity: 1,
        locked: true,
        zIndex: 1,
        properties: {
          shapeType: "rect",
          fill: "transparent",
          stroke: "#3b82f6",
          strokeWidth: 8,
          cornerRadius: 8,
        },
      },
      {
        id: generateElementId(),
        type: "text",
        x: 100,
        y: isLandscape ? 180 : 220,
        width: canvasWidth - 200,
        height: 60,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 2,
        properties: {
          text: "CERTIFICATE OF COMPLETION",
          fontFamily: "sans-serif",
          fontSize: isLandscape ? 40 : 32,
          fontStyle: "bold",
          fill: "#1e3a8a",
          align: "center",
          variable: null,
        },
      },
      {
        id: generateElementId(),
        type: "text",
        x: 100,
        y: isLandscape ? 260 : 300,
        width: canvasWidth - 200,
        height: 30,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 3,
        properties: {
          text: "This is proudly presented to",
          fontFamily: "serif",
          fontSize: 18,
          fontStyle: "italic",
          fill: "#4b5563",
          align: "center",
          variable: null,
        },
      },
      {
        id: generateElementId(),
        type: "text",
        x: 100,
        y: isLandscape ? 310 : 360,
        width: canvasWidth - 200,
        height: 60,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 4,
        properties: {
          text: "{{recipientName}}",
          fontFamily: "Georgia",
          fontSize: isLandscape ? 48 : 40,
          fontStyle: "bold",
          fill: "#3b82f6",
          align: "center",
          variable: "recipientName",
        },
      },
      {
        id: generateElementId(),
        type: "text",
        x: 100,
        y: isLandscape ? 400 : 460,
        width: canvasWidth - 200,
        height: 40,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 5,
        properties: {
          text: "for successfully completing the course requirements of",
          fontFamily: "sans-serif",
          fontSize: 16,
          fontStyle: "normal",
          fill: "#4b5563",
          align: "center",
          variable: null,
        },
      },
      {
        id: generateElementId(),
        type: "text",
        x: 100,
        y: isLandscape ? 450 : 520,
        width: canvasWidth - 200,
        height: 50,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 6,
        properties: {
          text: "{{courseTitle}}",
          fontFamily: "sans-serif",
          fontSize: isLandscape ? 32 : 26,
          fontStyle: "bold",
          fill: "#111827",
          align: "center",
          variable: "courseTitle",
        },
      },
      {
        id: generateElementId(),
        type: "text",
        x: isLandscape ? 150 : 100,
        y: isLandscape ? 630 : 810,
        width: 250,
        height: 30,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 8,
        properties: {
          text: "Issued: {{issuedAt}}",
          fontFamily: "sans-serif",
          fontSize: 14,
          fontStyle: "normal",
          fill: "#1f2937",
          align: "center",
          variable: "issuedAt",
        },
      },
      {
        id: generateElementId(),
        type: "text",
        x: isLandscape ? 150 : 100,
        y: isLandscape ? 670 : 850,
        width: 250,
        height: 30,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 7,
        properties: {
          text: "Date",
          fontFamily: "sans-serif",
          fontSize: 14,
          fontStyle: "bold",
          fill: "#9ca3af",
          align: "center",
          variable: null,
        },
      },
      {
        id: generateElementId(),
        type: "signature",
        x: isLandscape ? canvasWidth - 375 : canvasWidth - 325,
        y: isLandscape ? 580 : 760,
        width: 200,
        height: 80,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 10,
        properties: {
          src: "",
        },
      },
      {
        id: generateElementId(),
        type: "text",
        x: isLandscape ? canvasWidth - 400 : canvasWidth - 350,
        y: isLandscape ? 670 : 850,
        width: 250,
        height: 30,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 9,
        properties: {
          text: "Authorized Signature",
          fontFamily: "sans-serif",
          fontSize: 14,
          fontStyle: "bold",
          fill: "#9ca3af",
          align: "center",
          variable: null,
        },
      },
      {
        id: generateElementId(),
        type: "qrcode",
        x: isLandscape ? Math.round(canvasWidth / 2 - 50) : Math.round(canvasWidth / 2 - 50),
        y: isLandscape ? 600 : 700,
        width: 100,
        height: 100,
        rotation: 0,
        opacity: 1,
        locked: false,
        zIndex: 11,
        properties: {
          value: "{{verificationUrl}}",
          variable: "verificationUrl",
        },
      },
    ],
  };
}

// ──────────────────────────────────────────────────────────────
// Generate a unique element ID
// ──────────────────────────────────────────────────────────────

export function generateElementId() {
  return "el-" + Math.random().toString(36).slice(2, 10);
}

// ──────────────────────────────────────────────────────────────
// Default element factories (center of canvas)
// ──────────────────────────────────────────────────────────────

export function makeTextElement(canvasWidth, canvasHeight, overrides = {}) {
  return {
    id: generateElementId(),
    type: "text",
    x: Math.round(canvasWidth / 2 - 150),
    y: Math.round(canvasHeight / 2 - 20),
    width: 300,
    height: 40,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    properties: {
      text: "Text",
      fontFamily: "sans-serif",
      fontSize: 24,
      fontStyle: "normal",
      fill: "#111827",
      align: "center",
      variable: null,
    },
    ...overrides,
  };
}

export function makeImageElement(src, canvasWidth, canvasHeight, overrides = {}) {
  return {
    id: generateElementId(),
    type: "image",
    x: Math.round(canvasWidth / 2 - 75),
    y: Math.round(canvasHeight / 2 - 50),
    width: 150,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    properties: { src: src || "", objectFit: "contain" },
    ...overrides,
  };
}

export function makeSignatureElement(canvasWidth, canvasHeight, overrides = {}) {
  return {
    id: generateElementId(),
    type: "signature",
    x: Math.round(canvasWidth / 2 - 100),
    y: Math.round(canvasHeight - 150),
    width: 200,
    height: 80,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    properties: { src: "" },
    ...overrides,
  };
}

export function makeQrCodeElement(canvasWidth, canvasHeight, overrides = {}) {
  return {
    id: generateElementId(),
    type: "qrcode",
    x: Math.round(canvasWidth - 130),
    y: Math.round(canvasHeight - 130),
    width: 100,
    height: 100,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    properties: {
      value: "{{verificationUrl}}",
      variable: "verificationUrl",
    },
    ...overrides,
  };
}

export function makeShapeElement(canvasWidth, canvasHeight, overrides = {}) {
  return {
    id: generateElementId(),
    type: "shape",
    x: Math.round(canvasWidth / 2 - 100),
    y: Math.round(canvasHeight / 2 - 60),
    width: 200,
    height: 120,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    properties: {
      shapeType: "rect",
      fill: "transparent",
      stroke: "#1e3a8a",
      strokeWidth: 2,
      cornerRadius: 0,
    },
    ...overrides,
  };
}

export function makeLineElement(canvasWidth, canvasHeight, overrides = {}) {
  return {
    id: generateElementId(),
    type: "line",
    x: 60,
    y: Math.round(canvasHeight / 2),
    width: canvasWidth - 120,
    height: 2,
    rotation: 0,
    opacity: 1,
    locked: false,
    zIndex: 0,
    properties: {
      stroke: "#d1d5db",
      strokeWidth: 2,
    },
    ...overrides,
  };
}

// ──────────────────────────────────────────────────────────────
// HTML rendering functions (for preview / exports)
// ──────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderText(el, variables) {
  const { x, y, width, height, rotation, opacity, properties = {} } = el;
  const text = injectVariables(properties.text || "", variables);
  const style = [
    `position:absolute`,
    `left:${x}px`,
    `top:${y}px`,
    `width:${width}px`,
    `min-height:${height}px`,
    `font-family:${properties.fontFamily || "sans-serif"}`,
    `font-size:${properties.fontSize || 16}px`,
    `font-weight:${(properties.fontStyle || "").includes("bold") ? "bold" : "normal"}`,
    `font-style:${(properties.fontStyle || "").includes("italic") ? "italic" : "normal"}`,
    `color:${properties.fill || "#000000"}`,
    `text-align:${properties.align || "left"}`,
    `opacity:${opacity !== undefined ? opacity : 1}`,
    `transform:rotate(${rotation || 0}deg)`,
    `transform-origin:center center`,
    `word-break:break-word`,
    `box-sizing:border-box`,
  ].join(";");
  return `<div style="${style}">${escapeHtml(text).replace(/\n/g, "<br>")}</div>`;
}

function renderImage(el, _variables) {
  const { x, y, width, height, rotation, opacity, properties = {} } = el;
  const objectFit = properties.objectFit || "contain";
  const style = [
    `position:absolute`,
    `left:${x}px`,
    `top:${y}px`,
    `width:${width}px`,
    `height:${height}px`,
    `object-fit:${objectFit}`,
    `opacity:${opacity !== undefined ? opacity : 1}`,
    `transform:rotate(${rotation || 0}deg)`,
    `transform-origin:center center`,
  ].join(";");
  return `<img src="${properties.src || ""}" style="${style}" alt="" />`;
}

function renderSignature(el, _variables) {
  return renderImage(el, _variables);
}

function renderQrCode(el, variables) {
  const { x, y, width, height, rotation, opacity, properties = {} } = el;
  const rawValue = injectVariables(properties.value || "", variables);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=${Math.round(width)}x${Math.round(height)}&data=${encodeURIComponent(rawValue)}`;
  const style = [
    `position:absolute`,
    `left:${x}px`,
    `top:${y}px`,
    `width:${width}px`,
    `height:${height}px`,
    `opacity:${opacity !== undefined ? opacity : 1}`,
    `transform:rotate(${rotation || 0}deg)`,
    `transform-origin:center center`,
  ].join(";");
  return `<img src="${qrSrc}" style="${style}" alt="QR Code" />`;
}

function renderShape(el, _variables) {
  const { x, y, width, height, rotation, opacity, properties = {} } = el;
  const shapeType = properties.shapeType || "rect";
  const fill = properties.fill || "transparent";
  const stroke = properties.stroke || "transparent";
  const strokeWidth = properties.strokeWidth || 0;
  const cornerRadius = properties.cornerRadius || 0;

  const baseStyle = [
    `position:absolute`,
    `left:${x}px`,
    `top:${y}px`,
    `width:${width}px`,
    `height:${height}px`,
    `background-color:${fill}`,
    `border:${strokeWidth}px solid ${stroke}`,
    `opacity:${opacity !== undefined ? opacity : 1}`,
    `transform:rotate(${rotation || 0}deg)`,
    `transform-origin:center center`,
    `box-sizing:border-box`,
  ];

  if (shapeType === "rect") {
    baseStyle.push(`border-radius:${cornerRadius}px`);
  } else if (shapeType === "circle" || shapeType === "ellipse") {
    baseStyle.push(`border-radius:50%`);
  }

  return `<div style="${baseStyle.join(";")}"></div>`;
}

function renderLine(el, _variables) {
  const { x, y, width, rotation, opacity, properties = {} } = el;
  const stroke = properties.stroke || "#000000";
  const strokeWidth = properties.strokeWidth || 1;
  const style = [
    `position:absolute`,
    `left:${x}px`,
    `top:${y}px`,
    `width:${width}px`,
    `height:${strokeWidth}px`,
    `background-color:${stroke}`,
    `border:none`,
    `opacity:${opacity !== undefined ? opacity : 1}`,
    `transform:rotate(${rotation || 0}deg)`,
    `transform-origin:left center`,
  ].join(";");
  return `<div style="${style}"></div>`;
}

export function renderEditorDataToHtml(editorData, variables = {}) {
  if (!editorData) return "<p>(No template content)</p>";

  let data = editorData;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (err) {
      console.error("renderEditorDataToHtml: failed to parse editorData string", err);
      return `<p>(Invalid template content: ${escapeHtml(err.message)})</p>`;
    }
  }

  const { width = 1200, height = 900, background = {}, elements = [] } = data;

  let backgroundCss = "";
  if (background.type === "image" && background.value) {
    backgroundCss = `background-image:url(${background.value});background-size:cover;background-position:center;`;
  } else {
    backgroundCss = `background-color:${background.value || "#ffffff"};`;
  }

  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  const renderedElements = sorted.map((el) => {
    try {
      switch (el.type) {
        case "text":      return renderText(el, variables);
        case "image":     return renderImage(el, variables);
        case "signature": return renderSignature(el, variables);
        case "qrcode":    return renderQrCode(el, variables);
        case "shape":     return renderShape(el, variables);
        case "line":      return renderLine(el, variables);
        default:          return "";
      }
    } catch (err) {
      console.warn(`renderEditorData: failed to render element ${el.id} (${el.type}):`, err.message);
      return "";
    }
  }).join("\n");

  return `
<div style="position:relative;width:${width}px;height:${height}px;${backgroundCss}overflow:hidden;box-sizing:border-box;">
${renderedElements}
</div>`.trim();
}
