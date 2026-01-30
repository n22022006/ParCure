// ===========================
// DASHBOARD MODULE - ELDERLY FRIENDLY
// ===========================

let dashboardData = null;
let currentUser = null;

function getStoredUserName() {
  try {
    return localStorage.getItem('pc_user_name') || 'Friend';
  } catch (e) {
    return 'Friend';
  }
}

// AI Saathi messages
const saathiMessages = [
    "Good evening John. You walked less today. Let's do 5 minutes of knee therapy.",
    "Remember to drink more water today. You've only had 4 glasses so far.",
    "Great job on your exercises! Keep up the good work.",
    "Your sleep was good last night. How are you feeling today?",
    "Don't forget to take your evening medicines at 8 PM."
];

// Get India Hour correctly (IST)
function getIndiaHour() {
  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hourPart = parts.find((p) => p.type === "hour");
  return parseInt(hourPart.value, 10);
}

// Greeting message based on India time
function getIndiaGreeting() {
  const hour = getIndiaHour();

  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  if (hour >= 17 && hour < 20) return "Good Evening";
  return "Good Night";
}

// Update greeting + name + image
function updateGreeting() {
  // Greeting message
  const greetingMsg = document.getElementById("greetingMessage");
  if (greetingMsg) {
    greetingMsg.textContent = getIndiaGreeting();
  }

  // User name
  const greetingName = document.getElementById("greetingName");
  if (greetingName) {
    greetingName.textContent = getStoredUserName();
  }

  // Greeting image
  const greetingImage = document.getElementById("greetingImage");
  if (greetingImage) {
    const hour = getIndiaHour();

    let imageSrc = "";
    if (hour >= 5 && hour < 12) {
      imageSrc = "images/morning.jpeg"; // morning
    } else if (hour >= 12 && hour < 17) {
      imageSrc = "images/afternoon2.jpg"; // afternoon
    } else if (hour >= 17 && hour < 20) {
      imageSrc = "images/evening2.jpg"; // evening
    } else {
      imageSrc = "images/night2.jpg"; // night
    }

    greetingImage.src = imageSrc;
    greetingImage.alt = getIndiaGreeting();
  }
}

// Run on load + update every 1 minute
document.addEventListener("DOMContentLoaded", () => {
  updateGreeting();
  setInterval(updateGreeting, 60 * 1000);
});


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
  // Navigate to the appropriate page for main features
  if (blockName === 'Exercise') {
    window.location.href = 'exercise.html';
    return;
  }

  if (blockName === 'Reports') {
    window.location.href = 'report.html';
    return;
  }
  if (blockName === 'Saathi') {
    window.location.href = 'saathi.html';
    return;
  }
   if (blockName === 'Diet') {
    window.location.href = 'diet.html';
    return;
  }


  // Fallback for features not yet implemented
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
