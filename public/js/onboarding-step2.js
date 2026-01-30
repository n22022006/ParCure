import { getFirebase } from './firebase-v9.js';
import { ensureStepOrder, nextIncompleteStep, stepToPath } from './onboarding-guard.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const { auth, rtdb } = getFirebase();

function prefill(uid) {
  const profileRef = ref(rtdb, 'users/' + uid + '/profile');
  return get(profileRef).then((snap) => {
    if (!snap.exists()) return;
    const profile = snap.val() || {};
    if (profile.smoking) {
      const el = document.querySelector(`input[name="smoking"][value="${profile.smoking}"]`);
      if (el) el.checked = true;
    }
    if (profile.alcohol) {
      const el = document.querySelector(`input[name="alcohol"][value="${profile.alcohol}"]`);
      if (el) el.checked = true;
    }
  });
}

function save(uid) {
  const smokingEl = document.querySelector('input[name="smoking"]:checked');
  const alcoholEl = document.querySelector('input[name="alcohol"]:checked');
  const smoking = smokingEl ? smokingEl.value : null;
  const alcohol = alcoholEl ? alcoholEl.value : null;
  const userRef = ref(rtdb, 'users/' + uid);
  // Use nested path updates to avoid overwriting other profile fields
  return update(userRef, { 'profile/smoking': smoking, 'profile/alcohol': alcohol });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  const uid = user.uid;
  const ok = await ensureStepOrder(2, uid);
  if (!ok) return;
  await prefill(uid);

  document.getElementById('step2Form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await save(uid);
      // Compute next from current profile to allow skipping already-completed steps
      const profileSnap = await get(ref(rtdb, 'users/' + uid + '/profile'));
      const profile = profileSnap.exists() ? (profileSnap.val() || {}) : {};
      const next = nextIncompleteStep(profile, 3);
      window.location.href = stepToPath(next);
    } catch (err) {
      console.error('Step 2 save error:', err);
      alert('Failed to save. Please try again.');
    }
  });
});
