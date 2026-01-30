// Firebase v9 modular helper
// Centralizes initialization and exports a function to get auth & db

import { initializeApp, getApp, getApps } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

export const firebaseConfig = {
  apiKey: "AIzaSyD0jDQt4Oav5ZeTU93XRdcncpyzyKhPNcc",
  authDomain: "parcure-4aecd.firebaseapp.com",
  projectId: "parcure-4aecd",
  storageBucket: "parcure-4aecd.appspot.com",
  messagingSenderId: "362740241486",
  appId: "1:362740241486:web:12e6cf3e5f3ec12c409f1f"
};

export function getFirebase() {
  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const rtdb = getDatabase(app, 'https://parcure-4aecd-default-rtdb.firebaseio.com');
  return { app, auth, rtdb };
}
