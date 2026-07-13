import { state } from './state.js';
import { chatHistoryContainer, chatInput, sendChatBtn } from './elements.js';
import { formatFoodNameList } from './ui.js';

export function setupChatListeners() {
    sendChatBtn.addEventListener('click', handleChatSubmit);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleChatSubmit();
    });
}

export async function handleChatSubmit() {
    const text = chatInput.value.trim();
    if (!text || !state.apiKey) return;
    
    addUserMessage(text);
    chatInput.value = '';
    
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
        
        chatHistoryContainer.removeChild(typingDiv);
        addCoachMessage(responseText.trim());
    } catch (err) {
        console.error(err);
        chatHistoryContainer.removeChild(typingDiv);
        addCoachMessage(`Failed to contact AI Coach: ${err.message}. Please check your API Key settings.`);
    }
}

export function addUserMessage(text) {
    state.chatHistory.push({ role: 'user', text });
    
    const div = document.createElement('div');
    div.className = 'chat-message user-msg';
    div.textContent = text;
    chatHistoryContainer.appendChild(div);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
}

export function addCoachMessage(text) {
    state.chatHistory.push({ role: 'coach', text });
    
    const div = document.createElement('div');
    div.className = 'chat-message coach-msg';
    div.textContent = text;
    chatHistoryContainer.appendChild(div);
    chatHistoryContainer.scrollTop = chatHistoryContainer.scrollHeight;
}
