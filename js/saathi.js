// ===========================
// SAATHI CHATBOT - Personal Health Guide
// ===========================

let chatHistory = [];
let isWaitingForResponse = false;

// ===========================
// INITIALIZATION
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Saathi chatbot loaded');
    loadChatHistory();
    focusChatInput();
    updateApiModeStatus();
});

// ===========================
// MESSAGE HANDLING
// ===========================

/**
 * Send user message to Saathi
 */
function sendMessage() {
    const input = document.getElementById('chatInput');
    if (!input) {
        console.warn('chatInput not found');
        return;
    }
    const message = input.value.trim();

    if (!message || isWaitingForResponse) {
        return;
    }

    // Add user message to chat
    addUserMessage(message);
    input.value = '';
    input.focus();

    // Show typing indicator
    showTypingIndicator(true);
    isWaitingForResponse = true;

    // Send to Gemini API (replace with actual implementation)
    sendToGeminiAPI(message);
}

/**
 * Send predefined message
 */
function sendPredefined(message) {
    const input = document.getElementById('chatInput');
    input.value = message;
    sendMessage();
}

/**
 * Handle Enter key press
 */
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

/**
 * Add user message to chat
 */
function addUserMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    
    const timestamp = getTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <p>${escapeHTML(text)}</p>
            <span class="message-time">${timestamp}</span>
        </div>
        <div class="message-avatar">👤</div>
    `;
    
    chatMessages.appendChild(messageDiv);
    saveChatMessage('user', text);
    scrollToBottom();
}

/**
 * Add bot message to chat
 */
function addBotMessage(text) {
    const chatMessages = document.getElementById('chatMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    
    const timestamp = getTimeString();
    
    messageDiv.innerHTML = `
        <div class="message-avatar">🤖</div>
        <div class="message-content">
            <p>${escapeHTML(text)}</p>
            <span class="message-time">${timestamp}</span>
        </div>
    `;
    
    chatMessages.appendChild(messageDiv);
    saveChatMessage('bot', text);
    scrollToBottom();
}

/**
 * Show/hide typing indicator
 */
function showTypingIndicator(show) {
    const indicator = document.getElementById('typingIndicator');
    if (!indicator) return;
    if (show) {
        indicator.classList.remove('hidden');
        scrollToBottom();
    } else {
        indicator.classList.add('hidden');
    }
}

// ===========================
// BACKEND HEALTH CHECK
// ===========================
function updateApiModeStatus() {
    const statusEl = document.getElementById('backendStatus');
    const hasKey = !!getSaathiApiKey();
    if (!statusEl) return;
    statusEl.textContent = hasKey ? 'Direct API mode (Gemini): Ready' : 'Direct API mode (Gemini)';
    statusEl.style.color = '#b2f5ea';
}

function setSaathiApiKey() {
    const current = getSaathiApiKey() || '';
    const input = prompt('Enter your diet API key (OPENAI_API_KEY)', current);
    if (input && input.trim()) {
        try { localStorage.setItem('OPENAI_API_KEY', input.trim()); } catch {}
        updateApiModeStatus();
        addBotMessage('API key saved. You can start chatting now.');
    }
}

function getSaathiApiKey() {
    try {
        // Prefer the diet key used across the app
        const openaiEnv = (window.OPENAI_API_KEY || '').trim();
        if (openaiEnv) return openaiEnv;
        // Check localStorage diet key
        try {
            const openaiStored = (localStorage.getItem('OPENAI_API_KEY') || '').trim();
            if (openaiStored) return openaiStored;
        } catch {}
        // URL params support (orKey/openrouter/key)
        const params = new URLSearchParams(window.location.search);
        const paramKey = (params.get('orKey') || params.get('openrouter') || params.get('key') || '').trim();
        if (paramKey) return paramKey;
        // Fallback to OpenRouter-specific key sources
        try {
            const orStored = (localStorage.getItem('OPENROUTER_API_KEY') || localStorage.getItem('SAATHI_OPENROUTER_API_KEY') || '').trim();
            if (orStored) return orStored;
        } catch {}
        const orEnv = (window.OPENROUTER_API_KEY || '').trim();
        if (orEnv) return orEnv;
        return '';
    } catch {
        return '';
    }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 0);
}

/**
 * Focus chat input
 */
function focusChatInput() {
    const input = document.getElementById('chatInput');
    if (input) {
        input.focus();
    }
}


function sendToGeminiAPI(message) {
    // Direct front-end call via OpenRouter (development/testing only)
    callOpenRouterFrontend(message);
}

// Frontend-only call via OpenRouter
async function callOpenRouterFrontend(message) {
    // WARNING: Frontend-only API calls expose keys and are not secure for production.
    // This implementation is intended purely for development/testing.
    try {
        const apiKey = getSaathiApiKey();
        if (!apiKey) {
            showTypingIndicator(false);
            isWaitingForResponse = false;
            addBotMessage('AI key missing. Set OPENAI_API_KEY (diet key) via localStorage or js/config.js.');
            return;
        }

        // Build conversation (last 10 messages + current)
        const recentMessages = chatHistory.slice(-10);
        const messages = [];
        // Optional system prompt keeps responses health-focused
        messages.push({ role: 'system', content: 'You are Saathi, a friendly personal health assistant. Provide concise, safe guidance. Avoid diagnosing; suggest consulting professionals for medical concerns.' });
        for (const m of recentMessages) {
            messages.push({ role: m.role === 'user' ? 'user' : 'assistant', content: m.text });
        }
        messages.push({ role: 'user', content: message });

        // Use a widely available OpenRouter Gemini model by default
        let model = 'google/gemini-1.5-flash';
        const url = 'https://openrouter.ai/api/v1/chat/completions';
        const temperature = 0.7;
        const maxTokens = 512;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 20000);

        let resp = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`,
                'X-Title': 'ParCure Saathi'
            },
            body: JSON.stringify({
                model,
                messages,
                temperature,
                max_tokens: maxTokens
            }),
            signal: controller.signal
        });

        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            console.warn('OpenRouter call failed:', resp.status, errText);
            // If invalid model ID, try alternates commonly available
            const lowerErr = (errText || '').toLowerCase();
            if (resp.status === 400 && lowerErr.includes('not a valid model')) {
                const candidates = [
                    'google/gemini-1.5-flash',
                    'google/gemini-1.5-pro',
                    'google/gemini-pro',
                    'google/gemini-2.0-flash-001',
                    'google/gemini-2.0-flash-exp'
                ];
                let altOk = false;
                for (const m of candidates) {
                    try {
                        model = m;
                        resp = await fetch(url, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${apiKey}`,
                                'X-Title': 'ParCure Saathi'
                            },
                            body: JSON.stringify({ model, messages, temperature, max_tokens: maxTokens }),
                            signal: controller.signal
                        });
                        if (resp.ok) { altOk = true; break; }
                    } catch {}
                }
                if (!altOk) {
                    showTypingIndicator(false);
                    isWaitingForResponse = false;
                    addBotMessage(generateFallbackResponse(message));
                    clearTimeout(timeoutId);
                    return;
                }
            } else {
                showTypingIndicator(false);
                isWaitingForResponse = false;
                addBotMessage(generateFallbackResponse(message));
                clearTimeout(timeoutId);
                return;
            }
        }

        const data = await resp.json();
        const botResponse = data?.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.';
        showTypingIndicator(false);
        isWaitingForResponse = false;
        addBotMessage(botResponse);
        clearTimeout(timeoutId);
    } catch (error) {
        console.error('OpenRouter frontend error:', error);
        showTypingIndicator(false);
        isWaitingForResponse = false;
        addBotMessage(generateFallbackResponse(''));
    }
}

console.log('Saathi chatbot script loaded successfully');

// Demo fallback generator: provides helpful guidance when AI calls fail
function generateFallbackResponse(userText) {
    const t = (userText || '').toLowerCase();
    if (t.includes('exercise')) {
        return 'Here\'s a simple low-impact exercise plan you can follow today:\n\n• Warm-up: 5–7 minutes of gentle marching in place\n• Strength: 2 sets of 10 bodyweight squats, 8 wall push-ups, 10 glute bridges\n• Mobility: 30s ankle circles each side, 30s shoulder rolls\n• Cardio: 10 minutes brisk walk at a comfortable pace\n• Cool-down: 3–5 minutes of deep breathing and light stretching\n\nHydrate, stop on pain, and increase gradually.';
    }
    if (t.includes('diet') || t.includes('meal') || t.includes('food')) {
        return 'Here\'s a balanced meal outline for the day:\n\n• Breakfast: Oats with yogurt, berries, and nuts\n• Lunch: Grilled protein (tofu/chicken) + mixed veggies + brown rice\n• Snack: Fruit + handful of seeds\n• Dinner: Lentil/bean soup with whole-grain toast + salad\n\nAim for whole foods, adequate protein, fiber, and 6–8 glasses of water.';
    }
    if (t.includes('medication') || t.includes('medicine')) {
        return 'Medication guidance reminder:\n\n• Take medicines exactly as prescribed\n• Use consistent times and a pill organizer\n• Avoid mixing with alcohol; check for food interactions\n• If you miss a dose, follow your doctor\'s instructions (do not double up unless told)\n\nContact your clinician for any side effects or dose changes.';
    }
    return 'I\'m here to help. While the AI service is unavailable, here\'s general wellness guidance you can use right away:\n\n• Sleep: Target 7–9 hours; keep a consistent schedule\n• Nutrition: Prioritize whole foods, lean protein, colorful veggies, and fiber\n• Activity: 30 minutes of light-to-moderate movement most days\n• Stress: 5 minutes of deep breathing or mindfulness daily\n• Hydration: 6–8 glasses of water, adjust for activity/climate\n\nAsk me for exercise, diet, or medication tips and I\'ll tailor the advice.';
}

// Utility: formatted time string
function getTimeString() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

// Utility: escape HTML
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text == null ? '' : String(text);
    return div.innerHTML;
}

// ===========================
// CHAT HISTORY MANAGEMENT
// ===========================
function loadChatHistory() {
    try {
        const saved = localStorage.getItem('saathiChatHistory');
        if (saved) {
            chatHistory = JSON.parse(saved);
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
        chatHistory = [];
    }
}

function saveChatMessage(role, text) {
    chatHistory.push({ role, text, timestamp: new Date().toISOString() });
    if (chatHistory.length > 50) chatHistory = chatHistory.slice(-50);
    try {
        localStorage.setItem('saathiChatHistory', JSON.stringify(chatHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

function clearChatHistory() {
    try { localStorage.removeItem('saathiChatHistory'); } catch {}
    chatHistory = [];
    location.reload();
}

// Expose handlers globally for inline HTML event attributes
try {
    window.sendMessage = sendMessage;
    window.sendPredefined = sendPredefined;
    window.handleKeyPress = handleKeyPress;
    window.clearChatHistory = clearChatHistory;
    window.goBack = goBack;
} catch {}

// Provide goBack if missing
function goBack() {
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'dashboard.html';
    }
}
