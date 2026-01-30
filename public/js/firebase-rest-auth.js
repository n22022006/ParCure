// Firebase REST API Authentication (No CDN needed)
// Works directly with Firebase REST endpoints

const FIREBASE_API_KEY = "AIzaSyD0jDQt4Oav5ZeTU93XRdcncpyzyKhPNcc";
const FIREBASE_PROJECT_ID = "parcure-4aecd";

let currentUser = null;
let userToken = null;

// Check if user is already logged in
function checkAuthStatus() {
    const savedToken = localStorage.getItem('firebaseToken');
    const savedUser = localStorage.getItem('firebaseUser');
    
    if (savedToken && savedUser) {
        userToken = savedToken;
        currentUser = JSON.parse(savedUser);
        console.log('✅ User already logged in:', currentUser.email);
        goToDashboard();
        return true;
    }
    return false;
}

// Sign Up with Email & Password
async function signUpWithEmail(email, password, name) {
    try {
        console.log('🔐 Signing up user:', email);
        
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    displayName: name,
                    returnSecureToken: true
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error.message);
        }

        // Save user data
        currentUser = {
            uid: data.localId,
            email: data.email,
            displayName: name
        };
        userToken = data.idToken;

        localStorage.setItem('firebaseToken', userToken);
        localStorage.setItem('firebaseUser', JSON.stringify(currentUser));

        console.log('✅ Signup successful:', currentUser);
        showSuccess('Account created! Redirecting to dashboard...');
        
        setTimeout(() => {
            goToDashboard();
        }, 1500);

        return true;

    } catch (error) {
        console.error('❌ Signup error:', error.message);
        showError('Signup failed: ' + error.message);
        return false;
    }
}

// Sign In with Email & Password
async function signInWithEmail(email, password) {
    try {
        console.log('🔓 Signing in user:', email);
        
        const response = await fetch(
            `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    password: password,
                    returnSecureToken: true
                })
            }
        );

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error.message);
        }

        // Save user data
        currentUser = {
            uid: data.localId,
            email: data.email,
            displayName: data.displayName || 'User'
        };
        userToken = data.idToken;

        localStorage.setItem('firebaseToken', userToken);
        localStorage.setItem('firebaseUser', JSON.stringify(currentUser));

        console.log('✅ Login successful:', currentUser);
        showSuccess('Logged in! Redirecting to dashboard...');
        
        setTimeout(() => {
            goToDashboard();
        }, 1500);

        return true;

    } catch (error) {
        console.error('❌ Login error:', error.message);
        showError('Login failed: ' + error.message);
        return false;
    }
}

// Logout
function logout() {
    console.log('🚪 Logging out user');
    currentUser = null;
    userToken = null;
    localStorage.removeItem('firebaseToken');
    localStorage.removeItem('firebaseUser');
    window.location.href = 'index.html';
}

// Redirect to dashboard
function goToDashboard() {
    console.log('📊 Redirecting to dashboard');
    window.location.href = 'dashboard.html';
}

// Check auth on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Auth system loaded');
    checkAuthStatus();
});
