// ===========================
// MAIN APP INITIALIZATION
// ===========================

let splashHidden = false;

// Initialize app on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Starting ParCure');
    
    // Initialize splash screen animations
    initializeSplashScreen();
    
    // Hide splash and show login after 8 seconds
    hideSplashScreenAfterDelay();
    
    // Fallback: show login immediately if splash doesn't hide
    setTimeout(() => {
        if (!splashHidden) {
            console.log('⚠️ Fallback: Forcing app to show');
            const splash = document.getElementById('splashScreen');
            if (splash) splash.classList.add('hidden');
            
            const appContainer = document.getElementById('appContainer');
            if (appContainer && appContainer.classList.contains('hidden')) {
                appContainer.classList.remove('hidden');
                showLogin();
            }
        }
    }, 4000);  // Reduced from 10000 to 4000ms
});

// Hide splash and show app after delay
function hideSplashScreenAfterDelay() {
    setTimeout(() => {
        if (splashHidden) return;
        
        splashHidden = true;
        const splashScreen = document.getElementById('splashScreen');
        const appContainer = document.getElementById('appContainer');
        
        console.log('🎬 Hiding splash screen');
        
        if (splashScreen) {
            splashScreen.classList.add('hidden');
        }
        
        if (appContainer) {
            appContainer.classList.remove('hidden');
            document.body.classList.add('app-loaded');
            console.log('✅ App container shown');
        }
    }, 3000);  // Reduced from 8000 to 3000ms for faster display
}

// ===========================
// GLOBAL UTILITY FUNCTIONS
// ===========================

// Show/Hide loading spinner (already defined in auth.js but included here for redundancy)
function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

// Show error modal (already defined in auth.js but included here for redundancy)
function showError(message) {
    console.error('Error:', message);
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    
    if (errorModal && errorMessage) {
        errorMessage.textContent = message;
        errorModal.classList.remove('hidden');
    }
}

// Close error modal
function closeErrorModal() {
    const errorModal = document.getElementById('errorModal');
    if (errorModal) {
        errorModal.classList.add('hidden');
    }
}

// ===========================
// SPLASH SCREEN ANIMATION
// ===========================

function initializeSplashScreen() {
    createSnowParticles();
}

function createSnowParticles() {
    const particlesContainer = document.querySelector('.particles-container');
    if (!particlesContainer) return;

    // Create 150 snowfall particles for dense snowfall
    for (let i = 0; i < 150; i++) {
        createParticle(particlesContainer);
    }

    // Create new particles continuously - faster generation
    const particleInterval = setInterval(() => {
        if (splashHidden) {
            clearInterval(particleInterval);
            return;
        }
        createParticle(particlesContainer);
    }, 100);
}

function createParticle(container) {
    const particle = document.createElement('div');
    particle.className = 'particle';

    // Random starting position
    const startX = Math.random() * 100;
    const startY = Math.random() * -100;
    const duration = Math.random() * 3 + 4; // 4-7 seconds
    const delay = Math.random() * 2;

    particle.style.left = startX + '%';
    particle.style.top = startY + 'px';
    particle.style.animationDuration = duration + 's';
    particle.style.animationDelay = delay + 's';

    particle.style.animation = `fall ${duration}s ease-in ${delay}s forwards`;
    container.appendChild(particle);

    // Remove particle after animation completes
    setTimeout(() => {
        particle.remove();
    }, (duration + delay) * 1000);
}

// ===========================
// ERROR HANDLING
// ===========================

// Global error handler
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    showError('An unexpected error occurred. Please try again.');
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
    showError('An unexpected error occurred. Please try again.');
});

// ===========================
// PAGE VISIBILITY HANDLING
// ===========================

// Handle visibility changes to refresh dashboard when user returns
document.addEventListener('visibilitychange', () => {
    if (!document.hidden && document.getElementById('dashboardPage')?.classList.contains('active')) {
        console.log('App became visible, refreshing dashboard...');
        if (typeof loadDashboardData === 'function') {
            loadDashboardData();
        }
    }
});

console.log('ParCure app initialized');
