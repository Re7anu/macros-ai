import { state } from './js/state.js';
import { geminiApiKeyInput } from './js/elements.js';
import { checkBackendHealth } from './js/api.js';
import { setupChatListeners } from './js/chat.js';
import { setupScanListeners } from './js/scanner.js';
import { 
    setupNavListeners, 
    setupSettingsListeners, 
    setupUploadListeners, 
    updateNutritionUI,
    toggleChatInputState
} from './js/ui.js';

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
    setupSettingsListeners(() => {
        // Callback when API key is saved (toggles coach input accessibility)
        toggleChatInputState();
    });
    setupUploadListeners();
    setupScanListeners();
    setupChatListeners();
});

