// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase project credentials
// Get these from Firebase Console: https://console.firebase.google.com/

const firebaseConfig = {
    apiKey: "AIzaSyD0jDQt4Oav5ZeTU93XRdcncpyzyKhPNcc",
    authDomain: "parcure-4aecd.firebaseapp.com",
    projectId: "parcure-4aecd",
    storageBucket: "parcure-4aecd.appspot.com",
    messagingSenderId: "362740241486",
    appId: "1:362740241486:web:12e6cf3e5f3ec12c409f1f"
};

// OpenAI API Configuration
// Get your API key from OpenAI: https://platform.openai.com/api-keys
window.OPENAI_API_KEY = "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";

// Initialize Firebase immediately when this script loads (not waiting for DOMContentLoaded)
console.log(' config.js loading...');

let initRetries = 0;
const MAX_RETRIES = 100; // 100 * 200ms = 20 seconds max

function initializeFirebase() {
    if (typeof firebase === 'undefined') {
        initRetries++;
        if (initRetries <= MAX_RETRIES) {
            console.log(` Firebase SDK not yet available (attempt ${initRetries}/${MAX_RETRIES}), retrying...`);
            setTimeout(initializeFirebase, 200);
        } else {
            console.error(' Firebase SDK failed to load after 20 seconds');
        }
        return;
    }
    
    if (window.auth && window.rtdb) {
        console.log('Firebase already initialized');
        return;
    }
    
    try {
        console.log(' Initializing Firebase with credentials...');
        console.log('Firebase version:', firebase.SDK_VERSION || 'unknown');
        
        // Initialize Firebase
        const app = firebase.initializeApp(firebaseConfig);
        
        // Get Firebase services
        window.auth = firebase.auth();
        window.rtdb = firebase.database();
        window.storage = firebase.storage();
        
        // Enable Google Sign-In
        window.provider = new firebase.auth.GoogleAuthProvider();
        
        console.log(' Firebase initialized successfully!');
        console.log('  • Auth:', typeof window.auth);
        console.log('  • Realtime DB:', typeof window.rtdb);
        console.log('  • Storage:', typeof window.storage);
        console.log('  • Google Provider:', typeof window.provider);
        
    } catch (error) {
        console.error(' Firebase initialization error:', error.message);
        if (error.code === 'app/duplicate-app') {
            console.log('Firebase already initialized from another script');
            // Firebase was already initialized, just get the services
            window.auth = firebase.auth();
            window.rtdb = firebase.database();
            window.storage = firebase.storage();
            window.provider = new firebase.auth.GoogleAuthProvider();
            console.log('Firebase services retrieved successfully!');
        }
    }
}

// Try to initialize Firebase immediately
console.log('Calling initializeFirebase()...');
if (typeof window !== 'undefined' && window.NO_FIREBASE) {
    console.log('⚠️ Skipping Firebase initialization (NO_FIREBASE flag set)');
} else {
    initializeFirebase();
}

// Saathi Backend Base URL
// Ensure frontend knows where to reach the Saathi backend.
// Priority: URL query param (?saathi=...), then localStorage, then any pre-set global, else default.
(function ensureSaathiApiBase() {
    try {
        const params = new URLSearchParams(window.location.search);
        const paramBase = params.get('saathi');
        const storedBase = localStorage.getItem('SAATHI_API_BASE');
        const defaultBase = 'http://127.0.0.1:3001';

        const finalBase = paramBase || storedBase || window.SAATHI_API_BASE || defaultBase;
        window.SAATHI_API_BASE = finalBase;
        console.log(' SAATHI_API_BASE =', window.SAATHI_API_BASE);
    } catch (e) {
        window.SAATHI_API_BASE = window.SAATHI_API_BASE || 'http://127.0.0.1:3001';
    }
})();


