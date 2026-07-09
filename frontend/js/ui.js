import { state, CIRCUMFERENCE } from './state.js';
import { 
    navHome, navDashboard, heroSection, dashboardSection, ctaStart,
    settingsBtn, settingsModal, closeModalBtn, saveSettingsBtn, geminiApiKeyInput, toggleKeyVisibility,
    dropZone, fileInput, uploadPrompt, canvasContainer, canvas, resetUploadBtn, scanBtn, scanStatus,
    calValueDisplay, calProgressCircle, proteinValueDisplay, proteinProgressFill,
    carbsValueDisplay, carbsProgressFill, fatValueDisplay, fatProgressFill,
    portionDisplay, insightsText, emptyHistory, historyList, chatInput, sendChatBtn
} from './elements.js';
import { renderImageOnCanvas } from './canvas.js';

export function setupNavListeners() {
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

export function setupSettingsListeners(onApiKeySave) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.style.display = 'flex';
    });

    closeModalBtn.addEventListener('click', () => {
        settingsModal.style.display = 'none';
    });

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
        
        if (onApiKeySave) onApiKeySave();
        
        alert('API Configuration Saved Successfully.');
    });
}

export function setupUploadListeners() {
    dropZone.addEventListener('click', (e) => {
        if (e.target !== resetUploadBtn && !resetUploadBtn.contains(e.target)) {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFileSelection(e.target.files[0]);
        }
    });

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

export function resetImageUpload() {
    state.selectedFile = null;
    state.scannedMeal = null;
    state.currentImgInstance = null;
    fileInput.value = '';
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    canvasContainer.style.display = 'none';
    uploadPrompt.style.display = 'flex';
    scanBtn.setAttribute('disabled', 'true');
    
    portionDisplay.textContent = 'Portion: None';
    insightsText.textContent = 'Scan an image of your meal to generate nutritional insights, health recommendations, and fitness coach advice.';
}

export function setBackendOnline(isOnline) {
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

export function updateNutritionUI() {
    const totals = state.dailyTotals;
    const goals = state.dailyGoals;
    
    calValueDisplay.textContent = totals.calories;
    const calPercent = Math.min((totals.calories / goals.calories) * 100, 100);
    const strokeOffset = CIRCUMFERENCE - (calPercent / 100) * CIRCUMFERENCE;
    calProgressCircle.style.strokeDasharray = `${CIRCUMFERENCE} ${CIRCUMFERENCE}`;
    calProgressCircle.style.strokeDashoffset = strokeOffset;
    
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

export function logMealToHistory(name, calories, portion) {
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

export function toggleChatInputState() {
    if (state.apiKey && state.scannedMeal) {
        chatInput.removeAttribute('disabled');
        sendChatBtn.removeAttribute('disabled');
    } else {
        chatInput.setAttribute('disabled', 'true');
        sendChatBtn.setAttribute('disabled', 'true');
    }
}

export function formatFoodNameList(list) {
    const unique = [...new Set(list)].map(s => s.charAt(0).toUpperCase() + s.slice(1));
    if (unique.length === 0) return 'Meal Scan';
    if (unique.length === 1) return unique[0];
    if (unique.length === 2) return `${unique[0]} & ${unique[1]}`;
    return `${unique.slice(0, 2).join(', ')} & ${unique.length - 2} more`;
}
