import { createCanvas, loadImage } from 'canvas';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

function injectVariables(template, variables = {}) {
    if (!template) return "";
    return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key) => {
        const value = variables[key];
        return value !== undefined && value !== null ? String(value) : match;
    });
}

export async function generateCanvasFromEditorData(editorData, variables = {}) {
    let data = editorData;
    if (typeof data === "string") {
        data = JSON.parse(data);
    }
    const { width = 1200, height = 900, background = {}, elements = [] } = data;
    
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    
    // Draw background
    if (background.type === "image" && background.value) {
        try {
            const bgImg = await loadImage(background.value);
            ctx.drawImage(bgImg, 0, 0, width, height);
        } catch (e) { console.error('bg image load error', e); }
    } else {
        ctx.fillStyle = background.value || "#ffffff";
        ctx.fillRect(0, 0, width, height);
    }
    
    const sorted = [...elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    
    for (const el of sorted) {
        ctx.save();
        const { x, y, width: elW, height: elH, rotation = 0, opacity = 1, properties = {} } = el;
        
        ctx.globalAlpha = opacity;
        
        if (el.type === 'line') {
            ctx.translate(x, y + (properties.strokeWidth || 1) / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.translate(-x, -(y + (properties.strokeWidth || 1) / 2));
        } else {
            ctx.translate(x + elW / 2, y + elH / 2);
            ctx.rotate(rotation * Math.PI / 180);
            ctx.translate(-(x + elW / 2), -(y + elH / 2));
        }

        try {
            if (el.type === 'text') {
                const text = injectVariables(properties.text || "", variables);
                const fontSize = properties.fontSize || 16;
                const fontFamily = properties.fontFamily || "sans-serif";
                const isBold = (properties.fontStyle || "").includes("bold");
                const isItalic = (properties.fontStyle || "").includes("italic");
                ctx.font = `${isItalic ? 'italic ' : ''}${isBold ? 'bold ' : ''}${fontSize}px ${fontFamily}`;
                ctx.fillStyle = properties.fill || "#000000";
                ctx.textAlign = properties.align || "left";
                ctx.textBaseline = "top";
                
                let textX = x;
                if (ctx.textAlign === 'center') textX = x + elW / 2;
                if (ctx.textAlign === 'right') textX = x + elW;
                
                const lines = text.split('\n');
                let curY = y;
                for(let line of lines) {
                    ctx.fillText(line, textX, curY);
                    curY += fontSize * 1.2; // approx line height
                }
            } else if (el.type === 'image' || el.type === 'signature') {
                const src = properties.src || "";
                if (src) {
                    const img = await loadImage(src);
                    ctx.drawImage(img, x, y, elW, elH);
                }
            } else if (el.type === 'qrcode') {
                const rawValue = injectVariables(properties.value || "", variables);
                // Generate QR code locally — no external API call
                const qrDataUrl = await QRCode.toDataURL(rawValue, {
                    width: Math.round(elW),
                    margin: 0,
                    color: { dark: '#000000', light: '#ffffff' },
                });
                const img = await loadImage(qrDataUrl);
                ctx.drawImage(img, x, y, elW, elH);
            } else if (el.type === 'shape') {
                const shapeType = properties.shapeType || "rect";
                ctx.fillStyle = properties.fill || "transparent";
                ctx.lineWidth = properties.strokeWidth || 0;
                ctx.strokeStyle = properties.stroke || "transparent";
                
                ctx.beginPath();
                if (shapeType === 'rect') {
                    const r = properties.cornerRadius || 0;
                    if (r > 0) {
                        ctx.roundRect(x, y, elW, elH, r);
                    } else {
                        ctx.rect(x, y, elW, elH);
                    }
                } else if (shapeType === 'circle' || shapeType === 'ellipse') {
                    ctx.ellipse(x + elW / 2, y + elH / 2, elW / 2, elH / 2, 0, 0, 2 * Math.PI);
                }
                if (properties.fill !== "transparent") ctx.fill();
                if (properties.strokeWidth > 0 && properties.stroke !== "transparent") ctx.stroke();
            } else if (el.type === 'line') {
                ctx.strokeStyle = properties.stroke || "#000000";
                ctx.lineWidth = properties.strokeWidth || 1;
                ctx.beginPath();
                ctx.moveTo(x, y);
                ctx.lineTo(x + elW, y);
                ctx.stroke();
            }
        } catch (err) {
            console.error("Error drawing element", el.type, err);
        }
        ctx.restore();
    }
    return canvas;
}

export async function generateImageFromEditorData(editorData, variables = {}) {
    const canvas = await generateCanvasFromEditorData(editorData, variables);
    return canvas.toBuffer('image/png');
}

export async function generatePdfFromEditorData(editorData, variables = {}) {
    const canvas = await generateCanvasFromEditorData(editorData, variables);
    const imageBuffer = canvas.toBuffer('image/png');
    
    let data = editorData;
    if (typeof data === "string") {
        data = JSON.parse(data);
    }
    const { width = 1200, height = 900 } = data;
    
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ size: [width, height], margin: 0 });
            const chunks = [];
            doc.on('data', chunk => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            
            doc.image(imageBuffer, 0, 0, { width, height });
            doc.end();
        } catch(e) { reject(e); }
    });
}
