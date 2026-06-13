/**
 * renderEditorData.js
 *
 * Converts a Konva-compatible editorData JSON structure into an HTML string
 * suitable for email delivery or server-side PDF rendering.
 *
 * Element types supported:
 *   text, image, signature, qrcode, shape, line
 */

// ──────────────────────────────────────────────────────────────
// Variable injection
// ──────────────────────────────────────────────────────────────

/**
 * Replace all {{variable}} placeholders in a string with values from the map.
 *
 * @param {string} template  - String possibly containing {{key}} placeholders
 * @param {Object} variables - Map of variable name → replacement value
 * @returns {string}
 */
export function injectVariables(template, variables = {}) {
  if (!template) return "";
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
    const value = variables[key];
    return value !== undefined && value !== null ? String(value) : match;
  });
}

// ──────────────────────────────────────────────────────────────
// Element renderers
// ──────────────────────────────────────────────────────────────

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
  // Signature is rendered identically to a static image
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

// ──────────────────────────────────────────────────────────────
// Main renderer
// ──────────────────────────────────────────────────────────────

/**
 * Convert a Konva editorData object into an HTML string.
 *
 * @param {Object} editorData - The stored canvas JSON
 * @param {Object} variables  - Variable substitution map (recipientName, etc.)
 * @returns {string}          - HTML string safe for email / PDF rendering
 */
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

  // Background style
  let backgroundCss = "";
  if (background.type === "image" && background.value) {
    backgroundCss = `background-image:url(${background.value});background-size:cover;background-position:center;`;
  } else {
    backgroundCss = `background-color:${background.value || "#ffffff"};`;
  }

  // Sort elements by zIndex ascending
  const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));

  // Render each element
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

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
