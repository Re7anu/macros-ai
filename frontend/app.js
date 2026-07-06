// Global App State
const state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    backendUrl: 'http://localhost:8000',
    backendOnline: false,
    selectedFile: null,
    scannedMeal: null,
    dailyTotals: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0
    },
    dailyGoals: {
        calories: 2000,
        protein: 130,
        carbs: 220,
        fat: 65
    },
    mealHistory: [],
    chatHistory: [
        { role: 'coach', text: 'Hello! Ask me anything about this meal, or get diet recommendations.' }
    ]
};

// SVG Circle circumference for 50px radius is 2 * PI * 50 = 314.159
const CIRCUMFERENCE = 314.159;

// DOM Elements
const navHome = document.getElementById('nav-home');
const navDashboard = document.getElementById('nav-dashboard');
const heroSection = document.getElementById('hero-section');
const dashboardSection = document.getElementById('dashboard-section');
const ctaStart = document.getElementById('cta-start');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const geminiApiKeyInput = document.getElementById('gemini-api-key');
const toggleKeyVisibility = document.getElementById('toggle-key-visibility');

const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const uploadPrompt = document.getElementById('upload-prompt');
const canvasContainer = document.getElementById('canvas-container');
const canvas = document.getElementById('detection-canvas');
const resetUploadBtn = document.getElementById('reset-upload');
const scanBtn = document.getElementById('scan-btn');
const scanStatus = document.getElementById('scan-status');
const scanLine = document.getElementById('scan-line');

const calValueDisplay = document.getElementById('cal-value');
const calProgressCircle = document.getElementById('calories-progress');
const proteinValueDisplay = document.getElementById('protein-value');
const proteinProgressFill = document.getElementById('protein-progress');
const carbsValueDisplay = document.getElementById('carbs-value');
const carbsProgressFill = document.getElementById('carbs-progress');
const fatValueDisplay = document.getElementById('fat-value');
const fatProgressFill = document.getElementById('fat-progress');
const portionDisplay = document.getElementById('portion-display');
const insightsText = document.getElementById('insights-text');

const chatHistoryContainer = document.getElementById('chat-history');
const chatInput = document.getElementById('chat-input');
const sendChatBtn = document.getElementById('send-chat-btn');

const historyList = document.getElementById('history-list');
const emptyHistory = document.getElementById('empty-history');

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set API input field if key exists
    if (state.apiKey) {
        geminiApiKeyInput.value = state.apiKey;
    }
    
    // Check backend health
    checkBackendHealth();
    // Poll backend health every 10 seconds
    setInterval(checkBackendHealth, 10000);
    
    // Init Progress indicators
    updateNutritionUI();
    
    // Bind Event Listeners
    setupNavListeners();
    setupSettingsListeners();
    setupUploadListeners();
    setupScanListeners();
    setupChatListeners();
});

// --- Navigation ---
function setupNavListeners() {
    const showHome = (e) => {
        if(e) e.preventDefault();
        navHome.classList.add('active');
        navDashboard.classList.remove('active');
        heroSection.className = 'active-section';
        dashboardSection.className = 'inactive-section';
    };

    const showDashboard = (e) => {
        if(e) e.preventDefault();
        navDashboard.classList.add('active');
        navHome.classList.remove('active');
        dashboardSection.className = 'active-section';
        heroSection.className = 'inactive-section';
    };

    navHome.addEventListener('click', showHome);
    navDashboard.addEventListener('click', showDashboard);
    ctaStart.addEventListener('click', showDashboard);
}

// --- Settings/Modal ---
function setupSettingsListeners() {
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

    // Close when clicking outside modal contents
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
    });

    toggleKeyVisibility.addEventListener('click', () => {
        const type = geminiApiKeyInput.getAttribute('type') === 'password' ? 'text' : 'password';
        geminiApiKeyInput.setAttribute('type', type);
        const icon = toggleKeyVisibility.querySelector('i');
        icon.className = type === 'password' ? 'fa-solid fa-eye' : 'fa-solid fa-eye-slash';
    });

    saveSettingsBtn.addEventListener('click', () => {
        const key = geminiApiKeyInput.value.trim();
        state.apiKey = key;
        localStorage.setItem('gemini_api_key', key);
        settingsModal.style.display = 'none';
        
        // Enable/Disable chat input based on API Key presence
        toggleChatInputState();
        
        alert('API Configuration Saved Successfully.');
    });
}

// --- Check Backend Health ---
async function checkBackendHealth() {
    try {
        const response = await fetch(`${state.backendUrl}/api/health`);
        const data = await response.json();
        if (data.status === 'healthy') {
            setBackendOnline(true);
        } else {
            setBackendOnline(false);
        }
    } catch (err) {
        setBackendOnline(false);
    }
}

function setBackendOnline(isOnline) {
    state.backendOnline = isOnline;
    if (isOnline) {
        scanStatus.textContent = 'FastAPI Online';
        scanStatus.className = 'status-badge online';
        if (state.selectedFile) {
            scanBtn.removeAttribute('disabled');
        }
    } else {
        scanStatus.textContent = 'FastAPI Offline';
        scanStatus.className = 'status-badge offline';
        scanBtn.setAttribute('disabled', 'true');
    }
}

// --- File Upload & Preview ---
function setupUploadListeners() {
    // Clicking dragzone triggers input selection
    dropZone.addEventListener('click', (e) => {
        // Prevent trigger loop when clicking canvas control buttons
        if (e.target !== resetUploadBtn && !resetUploadBtn.contains(e.target)) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

    // Drag and Drop behaviors
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFileSelection(e.dataTransfer.files[0]);
        }
    });

    resetUploadBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        resetImageUpload();
    });
}

function handleFileSelection(file) {
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
    }
    state.selectedFile = file;
    
    // Read and render image on canvas
    const reader = new FileReader();
    reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
            renderImageOnCanvas(img);
            uploadPrompt.style.display = 'none';
            canvasContainer.style.display = 'flex';
            if (state.backendOnline) {
                scanBtn.removeAttribute('disabled');
            }
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

function renderImageOnCanvas(img) {
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

function resetImageUpload() {
    state.selectedFile = null;
    state.scannedMeal = null;
    state.currentImgInstance = null;
    fileInput.value = '';
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    canvasContainer.style.display = 'none';
    uploadPrompt.style.display = 'flex';
    scanBtn.setAttribute('disabled', 'true');
    
    // Clear display
    portionDisplay.textContent = 'Portion: None';
    insightsText.textContent = 'Scan an image of your meal to generate nutritional insights, health recommendations, and fitness coach advice.';
}

// --- YOLO & Gemini Processing ---
function setupScanListeners() {
    scanBtn.addEventListener('click', async () => {
        if (!state.selectedFile) return;
        
        // Show scan loading animation and disable button
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
                throw new Error(`Server returned error ${response.status}`);
            }
            
            const data = await response.json();
            handleScanSuccess(data);
        } catch (err) {
            console.error(err);
            alert(`Scanning failed: ${err.message}. Please check if the FastAPI backend is running.`);
        } finally {
            // Reset scan line animation and buttons
            scanLine.style.display = 'none';
            scanBtn.removeAttribute('disabled');
            scanBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> Scan Meal with YOLO & Gemini';
        }
    });
}

function handleScanSuccess(data) {
    state.scannedMeal = data;
    
    // Redraw image and draw YOLO Bounding Boxes
    const img = state.currentImgInstance;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Draw Bounding Boxes
    data.detections.forEach(det => {
        const [xMinRel, yMinRel, xMaxRel, yMaxRel] = det.box;
        const x = xMinRel * canvas.width;
        const y = yMinRel * canvas.height;
        const w = (xMaxRel - xMinRel) * canvas.width;
        const h = (yMaxRel - yMinRel) * canvas.height;
        
        // Box outline
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        // Semi-transparent box fill
        ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
        ctx.fillRect(x, y, w, h);
        
        // Text tag label
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 11px var(--font-body)';
        const labelText = `${det.label} (${Math.round(det.confidence * 100)}%)`;
        const textWidth = ctx.measureText(labelText).width;
        
        ctx.fillStyle = 'rgba(9, 9, 11, 0.85)';
        ctx.fillRect(x, y - 18, textWidth + 10, 18);
        
        ctx.fillStyle = '#10b981';
        ctx.fillText(labelText, x + 5, y - 5);
    });
    
    // Log meal data
    const nut = data.nutrition;
    
    // Update dashboard states
    portionDisplay.textContent = `Portion: ${nut.portion_size}`;
    insightsText.textContent = nut.insights;
    
    // Add to daily totals
    state.dailyTotals.calories += nut.calories || 0;
    state.dailyTotals.protein += nut.protein || 0;
    state.dailyTotals.carbs += nut.carbs || 0;
    state.dailyTotals.fat += nut.fat || 0;
    
    // Add to History Log list
    const mealName = nut.detected_foods && nut.detected_foods.length > 0 
        ? formatFoodNameList(nut.detected_foods)
        : (data.detections.length > 0 ? formatFoodNameList(data.detections.map(d => d.label)) : 'Healthy Meal');
        
    logMealToHistory(mealName, nut.calories || 0, nut.portion_size);
    
    // Update charts & progress rings
    updateNutritionUI();
    
    // Configure chat input
    toggleChatInputState();
    
    // Auto-update first message of chat
    addCoachMessage(`I've analyzed your meal: ${mealName}. Total calories are around ${nut.calories || 0} kcal, with ${nut.protein || 0}g protein, ${nut.carbs || 0}g carbs, and ${nut.fat || 0}g fat. How can I help you customize this for your diet goals?`);
}

function formatFoodNameList(list) {
    // Capitalize and remove duplicates
    const unique = [...new Set(list)].map(s => s.charAt(0).toUpperCase() + s.slice(1));
    if (unique.length === 0) return 'Meal Scan';
    if (unique.length === 1) return unique[0];
    if (unique.length === 2) return `${unique[0]} & ${unique[1]}`;
    return `${unique.slice(0, 2).join(', ')} & ${unique.length - 2} more`;
}

// --- Update UI Counters ---
function updateNutritionUI() {
    const totals = state.dailyTotals;
    const goals = state.dailyGoals;
    
    // 1. Calories Ring
    calValueDisplay.textContent = totals.calories;
    const calPercent = Math.min((totals.calories / goals.calories) * 100, 100);
    const strokeOffset = CIRCUMFERENCE - (calPercent / 100) * CIRCUMFERENCE;
    calProgressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    calProgressCircle.style.strokeDashoffset = strokeOffset;
    
    // 2. Macro bars
    proteinValueDisplay.textContent = `${totals.protein}g / ${goals.protein}g`;
    const protPercent = Math.min((totals.protein / goals.protein) * 100, 100);
    proteinProgressFill.style.width = `${protPercent}%`;
    
    carbsValueDisplay.textContent = `${totals.carbs}g / ${goals.carbs}g`;
    const carbsPercent = Math.min((totals.carbs / goals.carbs) * 100, 100);
    carbsProgressFill.style.width = `${carbsPercent}%`;
    
    fatValueDisplay.textContent = `${totals.fat}g / ${goals.fat}g`;
    const fatPercent = Math.min((totals.fat / goals.fat) * 100, 100);
    fatProgressFill.style.width = `${fatPercent}%`;
}

// --- History Logger ---
function logMealToHistory(name, calories, portion) {
    state.mealHistory.push({ name, calories, portion, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    
    // Render list
    emptyHistory.style.display = 'none';
    
    const div = document.createElement('div');
    div.className = 'history-item';
    div.innerHTML = `
        <div class="hist-meta">
            <h4>${name}</h4>
            <p>${portion} • ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div class="hist-cal">+${calories} kcal</div>
    `;
    
    historyList.appendChild(div);
}

// --- AI Chat Coach ---
function setupChatListeners() {
    sendChatBtn.addEventListener('click', handleChatSubmit);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSubmit();
    });
}

function toggleChatInputState() {
    // If Gemini key is set and a meal has been scanned, enable chatbot
    if (state.apiKey && state.scannedMeal) {
        chatInput.removeAttribute('disabled');
        sendChatBtn.removeAttribute('disabled');
    } else {
        chatInput.setAttribute('disabled', 'true');
        sendChatBtn.setAttribute('disabled', 'true');
    }
}

async function handleChatSubmit() {
    const text = chatInput.value.trim();
    if (!text || !state.apiKey) return;
    
    // Add user message
    addUserMessage(text);
    chatInput.value = '';
    
    // Show typing state
    const typingDiv = document.createElement('div');
    typingDiv.className = 'chat-message coach-msg';
    typingDiv.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Coach typing...';
    chatHistoryContainer.appendChild(typingDiv);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
    
    try {
        const nut = state.scannedMeal ? state.scannedMeal.nutrition : null;
        const mealContext = nut 
            ? `The user scanned a meal of ${formatFoodNameList(nut.detected_foods || [])} containing ${nut.calories || 0} calories, ${nut.protein || 0}g protein, ${nut.carbs || 0}g carbs, and ${nut.fat || 0}g fat.`
            : 'No meal has been scanned yet.';
            
        const prompt = `
            You are the Macros AI fitness and nutrition coach. 
            Context: ${mealContext}
            Current user daily totals: ${state.dailyTotals.calories} kcal consumed against goal of ${state.dailyGoals.calories} kcal.
            
            Answer the user's question with actionable, encouraging advice in 2-3 sentences.
            User: "${text}"
            Coach:
        `;
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${state.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });
        
        if (!response.ok) {
            throw new Error(`Gemini API returned error code ${response.status}`);
        }
        
        const data = await response.json();
        const responseText = data.candidates[0].content.parts[0].text;
        
        // Remove typing and add coach message
        chatHistoryContainer.removeChild(typingDiv);
        addCoachMessage(responseText.trim());
    } catch (err) {
        console.error(err);
        chatHistoryContainer.removeChild(typingDiv);
        addCoachMessage(`Failed to contact AI Coach: ${err.message}. Please check your API Key settings.`);
    }
}

function addUserMessage(text) {
    state.chatHistory.push({ role: 'user', text });
    
    const div = document.createElement('div');
    div.className = 'chat-message user-msg';
    div.textContent = text;
    chatHistoryContainer.appendChild(div);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
}

function addCoachMessage(text) {
    state.chatHistory.push({ role: 'coach', text });
    
    const div = document.createElement('div');
    div.className = 'chat-message coach-msg';
    div.textContent = text;
    chatHistoryContainer.appendChild(div);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
}
