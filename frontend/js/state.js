export const state = {
    apiKey: localStorage.getItem('gemini_api_key') || '',
    backendUrl: 'http://localhost:8000',
    backendOnline: false,
    selectedFile: null,
    scannedMeal: null,
    currentImgInstance: null,
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

export const CIRCUMFERENCE = 314.159;
