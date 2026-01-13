// ===========================
// DASHBOARD MODULE - ELDERLY FRIENDLY
// ===========================

let dashboardData = null;
let currentUser = null;

// Sample user data
const sampleUserName = 'John Doe';

// AI Saathi messages
const saathiMessages = [
    "Good evening John. You walked less today. Let's do 5 minutes of knee therapy.",
    "Remember to drink more water today. You've only had 4 glasses so far.",
    "Great job on your exercises! Keep up the good work.",
    "Your sleep was good last night. How are you feeling today?",
    "Don't forget to take your evening medicines at 8 PM."
];

// Get greeting message based on India time
function getIndiaGreeting() {
    // Get current time in India timezone (IST = UTC+5:30)
    const indiaTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    const indiaDate = new Date(indiaTime);
    const hour = indiaDate.getHours();
    
    let greeting = '';
    if (hour >= 5 && hour < 12) {
        greeting = 'Good Morning';
    } else if (hour >= 12 && hour < 17) {
        greeting = 'Good Afternoon';
    } else {
        greeting = 'Good Evening';
    }
    
    return greeting;
}

// Update greeting and date/time
function updateGreeting() {
    // Update greeting message
    const greetingMsg = document.getElementById('greetingMessage');
    if (greetingMsg) {
        greetingMsg.textContent = getIndiaGreeting();
    }
    
    // Update user name
    const greetingName = document.getElementById('greetingName');
    if (greetingName) {
        greetingName.textContent = sampleUserName;
    }
    
    // Update date and time
    const dateTimeEl = document.getElementById('dateTime');
    if (dateTimeEl) {
        const indiaTime = new Date().toLocaleString('en-IN', { 
            timeZone: 'Asia/Kolkata',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        dateTimeEl.textContent = indiaTime;
    }
}

// Setup block click handlers
function setupActionBlocks() {
    const blocks = {
        exerciseBlock: () => handleBlockClick('Exercise'),
        dietBlock: () => handleBlockClick('Diet'),
        saathiBlock: () => handleBlockClick('Saathi'),
        reportsBlock: () => handleBlockClick('Reports')
    };

    for (const [blockId, handler] of Object.entries(blocks)) {
        const element = document.getElementById(blockId);
        if (element) {
            // Make block clickable with keyboard support
            element.addEventListener('click', handler);
            element.setAttribute('role', 'button');
            element.setAttribute('tabindex', '0');
            
            // Add keyboard support for accessibility
            element.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handler();
                }
            });
        }
    }
}

// Handle block click
function handleBlockClick(blockName) {
    console.log(`${blockName} block clicked`);
    showError(`${blockName} feature coming soon! 🎉`);
}

// Update Saathi message
function updateSaathiMessage() {
    const saathiElement = document.getElementById('saathiMessage');
    if (saathiElement) {
        const randomMessage = saathiMessages[Math.floor(Math.random() * saathiMessages.length)];
        saathiElement.textContent = randomMessage;
    }
}

// Animate progress circles
function animateProgressCircles() {
    const circles = document.querySelectorAll('.progress-fill');
    circles.forEach((circle, index) => {
        setTimeout(() => {
            circle.style.animation = 'none';
            setTimeout(() => {
                circle.style.animation = 'fillProgress 2s ease-out forwards';
            }, 10);
        }, index * 200);
    });
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('Dashboard initialized - Elderly friendly version');
    updateGreeting();
    setupActionBlocks();
    updateSaathiMessage();
    animateProgressCircles();
    
    // Update greeting every minute
    setInterval(updateGreeting, 60000);
    
    // Refresh Saathi message every 30 seconds
    setInterval(updateSaathiMessage, 30000);
});
