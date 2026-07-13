import { state } from './state.js';
import { scanLine, scanBtn, portionDisplay, insightsText } from './elements.js';
import { drawBoundingBoxes } from './canvas.js';
import { 
    logMealToHistory, 
    updateNutritionUI, 
    toggleChatInputState, 
    formatFoodNameList 
} from './ui.js';
import { addCoachMessage } from './chat.js';

export function setupScanListeners() {
    document.getElementById('toggle-yolo-mode').addEventListener('change', () => {
        drawBoundingBoxes();
    });
    
    scanBtn.addEventListener('click', async () => {
        if (!state.selectedFile) return;
        
        scanLine.style.display = 'block';
        scanBtn.setAttribute('disabled', 'true');
        scanBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Analyzing Meal...';
        
        const formData = new FormData();
        formData.append('file', state.selectedFile);
        
        try {
            const headers = {};
            if (state.apiKey) {
                headers['X-Gemini-Key'] = state.apiKey;
            }
            
            const response = await fetch(`${state.backendUrl}/api/detect`, {
                method: 'POST',
                body: formData,
                headers: headers
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const errMsg = errorData.detail || `Server returned error ${response.status}`;
                throw new Error(errMsg);
            }
            
            const data = await response.json();
            handleScanSuccess(data);
        } catch (err) {
            console.error(err);
            if (err.message.includes('Failed to fetch') || err.message.includes('fetch')) {
                alert('Scanning failed: Unable to connect to the backend. Please check if the FastAPI server is running.');
            } else {
                alert(`Scanning failed: ${err.message}`);
            }
        } finally {
            scanLine.style.display = 'none';
            scanBtn.removeAttribute('disabled');
            scanBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Scan Meal with YOLO & Gemini';
        }
    });
}

function handleScanSuccess(data) {
    state.scannedMeal = data;
    
    drawBoundingBoxes();
    
    const nut = data.nutrition;
    
    portionDisplay.textContent = `Portion: ${nut.portion_size}`;
    insightsText.textContent = nut.insights;
    
    state.dailyTotals.calories += nut.calories || 0;
    state.dailyTotals.protein += nut.protein || 0;
    state.dailyTotals.carbs += nut.carbs || 0;
    state.dailyTotals.fat += nut.fat || 0;
    
    const mealName = nut.detected_foods && nut.detected_foods.length > 0 
        ? formatFoodNameList(nut.detected_foods)
        : (data.detections.length > 0 ? formatFoodNameList(data.detections.map(d => d.label)) : 'Healthy Meal');
        
    logMealToHistory(mealName, nut.calories || 0, nut.portion_size);
    
    updateNutritionUI();
    toggleChatInputState();
    
    addCoachMessage(`I've analyzed your meal: ${mealName}. Total calories are around ${nut.calories || 0} kcal, with ${nut.protein || 0}g protein, ${nut.carbs || 0}g carbs, and ${nut.fat || 0}g fat. How can I help you customize this for your diet goals?`);
}
