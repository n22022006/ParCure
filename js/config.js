// Firebase Configuration
// IMPORTANT: Replace these values with your actual Firebase project credentials
// Get these from Firebase Console: https://console.firebase.google.com/

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

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

