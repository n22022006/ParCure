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
    // Call actual Gemini API with Parkinson's disease expert persona
    callParkinsonsDoctorAPI(message);
}

async function callParkinsonsDoctorAPI(message) {
    try {
        if (!window.OPENAI_API_KEY) {
            showTypingIndicator(false);
            addBotMessage('Error: OpenAI API key not configured. Please add it to js/config.js');
            isWaitingForResponse = false;
            return;
        }

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

        const response = await fetch(
            'https://openrouter.ai/api/v1/chat/completions',
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + window.OPENAI_API_KEY
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are Dr. Saathi - a friendly Parkinson\'s disease specialist who cares about patients like a friend. Always respond in a warm, conversational tone. Format your answer in plain text WITHOUT any markdown symbols (no *, -, #, or bold formatting). Use simple line breaks to separate sections. For every question, provide practical solutions in short, well-organized points that are easy to read. Keep answers concise and actionable. Remember all previous conversations with this patient and refer back to what they\'ve shared before.'
                        },
                        ...conversationMessages
                    ],
                    temperature: 0.7,
                    max_tokens: 1024
                })
            }
        ).catch(error => {
            console.error('Fetch error in Saathi:', error);
            console.error('API Key prefix:', window.OPENAI_API_KEY ? window.OPENAI_API_KEY.substring(0, 10) : 'NOT SET');
            throw error;
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'API request failed');
        }

        const data = await response.json();
        if (data.choices && data.choices[0]?.message?.content) {
            const botResponse = data.choices[0].message.content;
            showTypingIndicator(false);
            isWaitingForResponse = false;
            addBotMessage(botResponse);
        } else {
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('Gemini API error:', error);
        showTypingIndicator(false);
        isWaitingForResponse = false;
        addBotMessage('Sorry, I encountered an error: ' + error.message + '. Please try again.');
    }
}    callGeminiAPI();
    


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
