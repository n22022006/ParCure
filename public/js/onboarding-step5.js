import { getFirebase } from './firebase-v9.js';
import { ensureStepOrder } from './onboarding-guard.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, get, update, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const { auth, rtdb } = getFirebase();

function prefill(uid) {
  const profileRef = ref(rtdb, 'users/' + uid + '/profile');
  return get(profileRef).then((snap) => {
    if (!snap.exists()) return;
    const profile = snap.val() || {};
    const symptoms = profile.symptoms || {};
    const keys = ['tremor','stiffness','slowMovement','balanceIssues','sleepProblems','speechChanges','depressionAnxiety'];
    keys.forEach(k => {
      const el = document.getElementById(k);
      if (el) el.checked = !!symptoms[k];
    });
  });
}

function save(uid) {
  const symptoms = {
    tremor: document.getElementById('tremor').checked,
    stiffness: document.getElementById('stiffness').checked,
    slowMovement: document.getElementById('slowMovement').checked,
    balanceIssues: document.getElementById('balanceIssues').checked,
    sleepProblems: document.getElementById('sleepProblems').checked,
    speechChanges: document.getElementById('speechChanges').checked,
    depressionAnxiety: document.getElementById('depressionAnxiety').checked
  };
  const userRef = ref(rtdb, 'users/' + uid);
  // Update nested path to avoid overwriting other profile fields
  return update(userRef, { 'profile/symptoms': symptoms });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  const uid = user.uid;
  const ok = await ensureStepOrder(5, uid);
  if (!ok) return;
  await prefill(uid);

  document.getElementById('step5Form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await save(uid);
      const userRef = ref(rtdb, 'users/' + uid);
      await update(userRef, { onboardingCompleted: true, updatedAt: serverTimestamp() });
      window.location.href = 'dashboard.html';
    } catch (err) {
      console.error('Step 5 save error:', err);
      alert('Failed to save. Please try again.');
    }
  });
});
