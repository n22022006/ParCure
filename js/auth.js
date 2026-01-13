// ===========================
// AUTHENTICATION MODULE
// ===========================

let currentUser = null;

// Initialize Auth State Listener when Firebase is ready
function initializeAuthListener() {
    if (typeof auth === 'undefined' || typeof auth.onAuthStateChanged !== 'function') {
        console.warn('Firebase Auth not available, using offline mode');
        showLogin();
        return;
    }
    
    console.log('Initializing Firebase Auth listener');
    auth.onAuthStateChanged(async (user) => {
        console.log('Auth state changed:', user ? user.uid : 'no user');
        
        if (user) {
            currentUser = user;
            console.log('User logged in:', user.uid);
            
            try {
                // Check if user has completed onboarding
                const userDoc = await db.collection('patients').doc(user.uid).get();
                
                if (userDoc.exists && userDoc.data().personal) {
                    // User has completed onboarding, show dashboard
                    showDashboard();
                    loadDashboardData();
                } else {
                    // User needs to complete onboarding
                    showOnboarding();
                }
            } catch (error) {
                console.error('Error checking user data:', error);
                showLogin();
            }
        } else {
            currentUser = null;
            console.log('User logged out');
            showLogin();
        }
    });
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Firebase is loaded
    setTimeout(() => {
        initializeAuthListener();
    }, 500);
});

// ===========================
// LOGIN & SIGNUP EVENT LISTENERS
// ===========================

// Toggle between Login and Signup
function setupToggleButtons() {
    console.log('Setting up toggle buttons...');
    
    const signupToggle = document.getElementById('signupToggle');
    const loginToggle = document.getElementById('loginToggle');
    
    console.log('Signup toggle found:', !!signupToggle);
    console.log('Login toggle found:', !!loginToggle);
    
    if (signupToggle) {
        signupToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('✓ Create one clicked - showing signup form');
            const loginPage = document.getElementById('loginPage');
            const signupPage = document.getElementById('signupPage');
            
            if (loginPage) {
                loginPage.classList.add('hidden');
                loginPage.classList.remove('active');
            }
            if (signupPage) {
                signupPage.classList.remove('hidden');
                signupPage.classList.add('active');
            }
            
            return false;
        });
    } else {
        console.error('signupToggle element not found');
    }
    
    if (loginToggle) {
        loginToggle.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('✓ Sign in clicked - showing login form');
            const signupPage = document.getElementById('signupPage');
            const loginPage = document.getElementById('loginPage');
            
            if (signupPage) {
                signupPage.classList.add('hidden');
                signupPage.classList.remove('active');
            }
            if (loginPage) {
                loginPage.classList.remove('hidden');
                loginPage.classList.add('active');
            }
            
            return false;
        });
    } else {
        console.error('loginToggle element not found');
    }
}

// Setup buttons when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupToggleButtons);
} else {
    setupToggleButtons();
}

// Also setup with a small delay to ensure elements are in DOM
setTimeout(setupToggleButtons, 100);

// Login Form Submission
function setupLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (!loginForm) return;
    
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Login form submitted');
        showLoading(true);

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            if (typeof auth === 'undefined' || !auth.signInWithEmailAndPassword) {
                showError('Firebase not configured. Please add your Firebase credentials to js/config.js');
                console.warn('Firebase Auth not available');
            } else {
                await auth.signInWithEmailAndPassword(email, password);
                document.getElementById('loginForm').reset();
            }
        } catch (error) {
            showError('Login failed: ' + error.message);
            console.error('Login error:', error);
        } finally {
            showLoading(false);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupLoginForm);

// Signup Form Submission
function setupSignupForm() {
    const signupForm = document.getElementById('signupForm');
    if (!signupForm) return;
    
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        console.log('Signup form submitted');
        showLoading(true);

        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            showError('Passwords do not match');
            showLoading(false);
            return;
        }

        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            showLoading(false);
            return;
        }

        try {
            if (typeof auth === 'undefined' || !auth.createUserWithEmailAndPassword) {
                showError('Firebase not configured. Please add your Firebase credentials to js/config.js');
                console.warn('Firebase Auth not available');
            } else {
                const userCredential = await auth.createUserWithEmailAndPassword(email, password);
                await userCredential.user.updateProfile({ displayName: name });
                document.getElementById('signupForm').reset();
                showSuccess('Account created! Redirecting to onboarding...');
            }
        } catch (error) {
            showError('Signup failed: ' + error.message);
            console.error('Signup error:', error);
        } finally {
            showLoading(false);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupSignupForm);

// Google Sign-In
function setupGoogleSignIn() {
    const googleBtn = document.getElementById('googleSignInBtn');
    if (!googleBtn) return;
    
    googleBtn.addEventListener('click', async () => {
        console.log('Google Sign-In clicked');
        showLoading(true);

        try {
            if (typeof auth === 'undefined' || !auth.signInWithPopup) {
                showError('Firebase not configured. Please add your Firebase credentials to js/config.js');
                console.warn('Firebase Auth not available');
            } else {
                const result = await auth.signInWithPopup(window.provider);
                console.log('Google sign-in successful:', result.user);
            }
        } catch (error) {
            showError('Google sign-in failed: ' + error.message);
            console.error('Google sign-in error:', error);
        } finally {
            showLoading(false);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupGoogleSignIn);

// Logout
function setupLogoutButton() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', async () => {
        console.log('Logout clicked');
        showLoading(true);
        try {
            if (typeof auth === 'undefined' || !auth.signOut) {
                console.warn('Firebase Auth not available');
                showLogin();
            } else {
                await auth.signOut();
            }
        } catch (error) {
            showError('Logout failed: ' + error.message);
        } finally {
            showLoading(false);
        }
    });
}

document.addEventListener('DOMContentLoaded', setupLogoutButton);

// ===========================
// UI UTILITY FUNCTIONS
// ===========================

function showPage(pageId) {
    console.log('Showing page:', pageId);
    
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.add('hidden');
        page.classList.remove('active');
    });

    // Show selected page
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
        selectedPage.classList.remove('hidden');
        selectedPage.classList.add('active');
        console.log('Page shown successfully:', pageId);
    } else {
        console.error('Page not found:', pageId);
    }
}

function showLogin() {
    console.log('Showing login page');
    
    // Show app container
    const appContainer = document.getElementById('appContainer');
    if (appContainer) {
        appContainer.classList.remove('hidden');
        document.body.classList.add('app-loaded');
    }

    // Reset to login page
    const signupPage = document.getElementById('signupPage');
    if (signupPage) {
        signupPage.classList.add('hidden');
    }
    
    showPage('loginPage');
}

function showOnboarding() {
    console.log('Showing onboarding page');
    showPage('onboardingContainer');
    if (typeof initOnboarding === 'function') {
        initOnboarding();
    }
}

function showDashboard() {
    console.log('Redirecting to dashboard page');
    window.location.href = 'dashboard.html';
}

function showLoading(show) {
    const spinner = document.getElementById('loadingSpinner');
    if (show) {
        spinner.classList.remove('hidden');
    } else {
        spinner.classList.add('hidden');
    }
}

function showError(message) {
    const errorModal = document.getElementById('errorModal');
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorModal.classList.remove('hidden');
}

function closeErrorModal() {
    document.getElementById('errorModal').classList.add('hidden');
}

function showSuccess(message) {
    console.log('Success:', message);
    // You can enhance this with a toast notification if needed
}

// Close error modal when clicking outside
document.getElementById('errorModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'errorModal') {
        closeErrorModal();
    }
});
