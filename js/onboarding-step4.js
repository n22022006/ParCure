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
    if (profile.treatmentStartDateTime) {
      const el = document.getElementById('treatmentStartDateTime');
      el.value = profile.treatmentStartDateTime;
    }
  });
}

function save(uid) {
  const dt = document.getElementById('treatmentStartDateTime').value;
  if (!dt) { alert('Treatment start date/time is required'); return false; }
  const userRef = ref(rtdb, 'users/' + uid);
  return update(userRef, { 'profile/treatmentStartDateTime': dt });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  const uid = user.uid;
  const ok = await ensureStepOrder(4, uid);
  if (!ok) return;
  await prefill(uid);

  document.getElementById('step4Form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const ok = await save(uid);
      if (ok === false) return;
      const profileSnap = await get(ref(rtdb, 'users/' + uid + '/profile'));
      const profile = profileSnap.exists() ? (profileSnap.val() || {}) : {};
      const next = nextIncompleteStep(profile, 5);
      window.location.href = stepToPath(next);
    } catch (err) {
      console.error('Step 4 save error:', err);
      alert('Failed to save. Please try again.');
    }
  });
});
