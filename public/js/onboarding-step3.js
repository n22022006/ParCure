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
    if (profile.exArmyPersonnel) {
      const el = document.querySelector(`input[name="exArmyPersonnel"][value="${profile.exArmyPersonnel}"]`);
      if (el) el.checked = true;
    }
  });
}

function save(uid) {
  const exArmyEl = document.querySelector('input[name="exArmyPersonnel"]:checked');
  const exArmyPersonnel = exArmyEl ? exArmyEl.value : null;
  const userRef = ref(rtdb, 'users/' + uid);
  return update(userRef, { 'profile/exArmyPersonnel': exArmyPersonnel });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = 'index.html'; return; }
  const uid = user.uid;
  const ok = await ensureStepOrder(3, uid);
  if (!ok) return;
  await prefill(uid);

  document.getElementById('step3Form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await save(uid);
      const profileSnap = await get(ref(rtdb, 'users/' + uid + '/profile'));
      const profile = profileSnap.exists() ? (profileSnap.val() || {}) : {};
      const next = nextIncompleteStep(profile, 4);
      window.location.href = stepToPath(next);
    } catch (err) {
      console.error('Step 3 save error:', err);
      alert('Failed to save. Please try again.');
    }
  });
});
