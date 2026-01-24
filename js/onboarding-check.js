// Checks onboarding status on dashboard load and redirects if incomplete
// Uses Firebase v9 modular SDK

import { getFirebase } from './firebase-v9.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, get, update, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const { auth, rtdb } = getFirebase();

async function ensureUserNode(uid, email) {
  const userRef = ref(rtdb, 'users/' + uid);
  const snap = await get(userRef);
  if (!snap.exists()) {
    await update(userRef, {
      uid,
      email: email || null,
      createdAt: serverTimestamp(),
      onboardingCompleted: false
    });
  }
  return userRef;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    // No user; let your existing auth redirect handle it or send to login
    return;
  }

  try {
    const userRef = await ensureUserNode(user.uid, user.email);
    const snap = await get(userRef);
    const data = snap.exists() ? (snap.val() || {}) : {};
    if (!data.onboardingCompleted) {
      // Redirect to onboarding step 1
      window.location.href = 'onboarding-step1.html';
    }
    // else allow dashboard to continue loading
  } catch (err) {
    console.error('Onboarding check failed:', err);
  }
});
