// TEST Firebase Configuration
// Using test mode for development - NO CREDENTIALS NEEDED

console.log('Setting up test Firebase configuration...');

// Create mock Firebase objects for testing without real credentials
const firebase = {
    initializeApp: function(config) {
        console.log('Firebase initialized in TEST MODE');
        return this;
    },
    auth: function() {
        return {
            signInWithEmailAndPassword: async (email, pwd) => {
                console.log('TEST: Sign in with', email);
                return { user: { uid: 'test-user-' + Date.now(), email: email } };
            },
            createUserWithEmailAndPassword: async (email, pwd) => {
                console.log('TEST: Create user', email);
                return { user: { uid: 'test-user-' + Date.now(), email: email } };
            },
            signOut: async () => {
                console.log('TEST: Sign out');
            },
            onAuthStateChanged: function(callback) {
                console.log('TEST: Auth state listener registered');
                // Call with no user (simulating logged out state)
                setTimeout(() => callback(null), 100);
                return this;
            },
            signInWithPopup: async () => {
                console.log('TEST: Google Sign-In');
                return { user: { uid: 'test-google-user', email: 'test@google.com' } };
            }
        };
    },
    firestore: function() {
        return {
            collection: (name) => ({
                doc: (id) => ({
                    get: async () => ({ exists: false, data: () => ({}) }),
                    set: async (data) => console.log('TEST: Saving data', data),
                })
            })
        };
    },
    storage: function() {
        return { ref: () => ({}) };
    }
};

// Mock Firebase services
const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();
const provider = { name: 'Google' };

console.log('TEST MODE: Firebase mock initialized successfully');
