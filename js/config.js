// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase project credentials
// Get these from Firebase Console: https://console.firebase.google.com/

const firebaseConfig = {
    apiKey: "AIzaSyDIRnH7BqiSaPxM-wm92kX4UVZ9eJYgKlU",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// OpenAI API Configuration
// Get your API key from OpenAI: https://platform.openai.com/api-keys
window.OPENAI_API_KEY = "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";

// Check if Firebase is loaded
if (typeof firebase === 'undefined') {
    console.warn('Firebase SDK not loaded yet');
} else {
    try {
        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        
        // Get Firebase services
        window.auth = firebase.auth();
        window.db = firebase.firestore();
        window.storage = firebase.storage();
        
        // Enable Google Sign-In
        window.provider = new firebase.auth.GoogleAuthProvider();
        
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.warn('Firebase initialization warning:', error.message);
        // Create dummy objects if Firebase fails
        window.auth = { onAuthStateChanged: () => {} };
        window.db = { collection: () => ({ doc: () => ({ get: async () => ({ exists: false }) }) }) };
        window.storage = {};
        window.provider = {};
    }
}

