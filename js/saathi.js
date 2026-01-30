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
    checkBackendHealth();
});

// ===========================
// MESSAGE HANDLING
// ===========================

/**
 * Send user message to Saathi
 */
function sendMessage() {
    const input = document.getElementById('chatInput');
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
async function checkBackendHealth() {
    const statusEl = document.getElementById('backendStatus');
    const API_BASE = (window.SAATHI_API_BASE) || (`http://${location.hostname}:3001`);
    try {
        const res = await fetch(`${API_BASE}/api/health`, { method: 'GET' });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json().catch(() => ({}));
        if (statusEl) {
            statusEl.textContent = `Backend: Connected (${data?.service || 'saathi-backend'})`;
            statusEl.style.color = '#b2f5ea';
        }
    } catch (e) {
        if (statusEl) {
            statusEl.textContent = 'Backend: Unreachable. Start server on http://127.0.0.1:3001';
            statusEl.style.color = '#ffb3b3';
        }
        console.warn('Backend health check failed:', e?.message || e);
    }
}

/**
 * Scroll chat to bottom
 */
function scrollToBottom() {
    const chatMessages = document.getElementById('chatMessages');
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

// ===========================
// GEMINI API INTEGRATION
// ===========================

/**
 * Send message to Gemini API
 * 
 * TO INTEGRATE GEMINI:
 * 1. Add your Gemini API key to js/config.js as window.GEMINI_API_KEY
 * 2. Replace the placeholder logic below with actual API call
 * 
 * Example API call structure:
 * const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=' + window.GEMINI_API_KEY, {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json' },
 *     body: JSON.stringify({
 *         contents: [{
 *             parts: [{ text: message }]
 *         }]
 *     })
 * });
 */
function sendToGeminiAPI(message) {
    // Route through backend Gemini proxy
    callSaathiBackend(message);
}

async function callSaathiBackend(message) {
    try {
        // Build conversation history for context
        let conversationMessages = [];
        
        // Include last 10 messages for context
        const recentMessages = chatHistory.slice(-10);
        recentMessages.forEach(msg => {
            conversationMessages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            });
        });
        
        // Add current message
        conversationMessages.push({
            role: 'user',
            content: message
        });

        const API_BASE = (window.SAATHI_API_BASE) || (`http://${location.hostname}:3001`);

        // Enforce POST-only requests to the Saathi chat endpoint
        // (Prevents accidental GET navigation that leads to 426 errors)
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message,
                history: conversationMessages
            })
        };

        const resp = await fetch(`${API_BASE}/api/saathi/chat`, requestOptions);

        if (!resp.ok) {
            const err = await resp.json().catch(() => ({}));
            throw new Error(err?.error || 'Saathi backend request failed');
        }

        const data = await resp.json();
        const botResponse = data?.text || 'Sorry, I could not generate a response.';
        showTypingIndicator(false);
        isWaitingForResponse = false;
        addBotMessage(botResponse);
    } catch (error) {
        console.error('Gemini API error:', error);
        showTypingIndicator(false);
        isWaitingForResponse = false;
        addBotMessage('Sorry, I cannot reach the assistant right now. Please ensure the backend is running on http://127.0.0.1:3001 and try again.');
    }
}
    


// ===========================
// CHAT HISTORY MANAGEMENT
// ===========================

/**
 * Load chat history from localStorage
 */
function loadChatHistory() {
    try {
        const saved = localStorage.getItem('saathiChatHistory');
        if (saved) {
            chatHistory = JSON.parse(saved);
            // Display previous messages (optional - can show fresh chat each time)
            // chatHistory.forEach(msg => {
            //     if (msg.role === 'user') {
            //         addUserMessage(msg.text);
            //     } else {
            //         addBotMessage(msg.text);
            //     }
            // });
        }
    } catch (error) {
        console.error('Error loading chat history:', error);
    }
}

/**
 * Save chat message to history
 */
function saveChatMessage(role, text) {
    chatHistory.push({
        role: role,
        text: text,
        timestamp: new Date().toISOString()
    });

    // Keep only last 50 messages
    if (chatHistory.length > 50) {
        chatHistory = chatHistory.slice(-50);
    }

    try {
        localStorage.setItem('saathiChatHistory', JSON.stringify(chatHistory));
    } catch (error) {
        console.error('Error saving chat history:', error);
    }
}

/**
 * Clear chat history
 */
function clearChatHistory() {
    if (confirm('Are you sure you want to clear all chat history?')) {
        chatHistory = [];
        localStorage.removeItem('saathiChatHistory');
        location.reload();
    }
}

// ===========================
// UTILITY FUNCTIONS
// ===========================

/**
 * Get formatted time string
 */
function getTimeString() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
}

/**
 * Escape HTML special characters
 */
function escapeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Go back to previous page
 */
function goBack() {
    // Try to go back, fallback to dashboard.html if no history
    if (window.history.length > 1) {
        window.history.back();
    } else {
        window.location.href = 'dashboard.html';
    }
}

console.log('Saathi chatbot script loaded successfully');
