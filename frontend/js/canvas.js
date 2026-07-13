import { state } from './state.js';
import { canvas } from './elements.js';

export function renderImageOnCanvas(img) {
    const ctx = canvas.getContext('2d');
    
    // Scale aspect ratio to fit preview boundaries
    const maxWidth = 500;
    const maxHeight = 400;
    let width = img.width;
    let height = img.height;
    
    if (width > maxWidth) {
        height = (maxWidth / width) * height;
        width = maxWidth;
    }
    if (height > maxHeight) {
        width = (maxHeight / height) * width;
        height = maxHeight;
    }
    
    canvas.width = width;
    canvas.height = height;
    
    // Save image instance to state for redrawing boxes later
    state.currentImgInstance = img;
    
    ctx.drawImage(img, 0, 0, width, height);
}

export function drawBoundingBoxes() {
    if (!state.scannedMeal || !state.currentImgInstance) return;
    
    const showRawYolo = document.getElementById('toggle-yolo-mode').checked;
    const data = state.scannedMeal;
    const img = state.currentImgInstance;
    const ctx = canvas.getContext('2d');
    
    // Clear and redraw image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Select which list to draw
    const listToDraw = showRawYolo ? (data.raw_detections || []) : (data.detections || []);
    const boxColor = showRawYolo ? '#ef4444' : '#10b981'; // Red/Coral vs Emerald Green
    const fillColor = showRawYolo ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)';
    
    listToDraw.forEach(det => {
        const [xMinRel, yMinRel, xMaxRel, yMaxRel] = det.box;
        const x = xMinRel * canvas.width;
        const y = yMinRel * canvas.height;
        const w = (xMaxRel - xMinRel) * canvas.width;
        const h = (yMaxRel - yMinRel) * canvas.height;
        
        // Draw segment outline/fill if polygon points are available
        if (det.segments && det.segments.length > 0) {
            ctx.beginPath();
            const startX = det.segments[0][0] * canvas.width;
            const startY = det.segments[0][1] * canvas.height;
            ctx.moveTo(startX, startY);
            
            for (let j = 1; j < det.segments.length; j++) {
                const px = det.segments[j][0] * canvas.width;
                const py = det.segments[j][1] * canvas.height;
                ctx.lineTo(px, py);
            }
            ctx.closePath();
            
            // Draw segment outline
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.stroke();
            
            // Draw semi-transparent segment fill
            ctx.fillStyle = fillColor;
            ctx.fill();
        } else {
            // Fallback: draw normal bounding box outline and fill
            ctx.strokeStyle = boxColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(x, y, w, h);
            
            ctx.fillStyle = fillColor;
            ctx.fillRect(x, y, w, h);
        }
        
        // Draw text tag label at the top-left of the object boundary
        ctx.fillStyle = boxColor;
        ctx.font = 'bold 11px var(--font-body)';
        const labelText = `${det.label} (${Math.round(det.confidence * 100)}%)`;
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.fillRect(x, y - 18, textWidth + 10, 18);
        
        ctx.fillStyle = boxColor;
        ctx.fillText(labelText, x + 5, y - 5);
    });
}
