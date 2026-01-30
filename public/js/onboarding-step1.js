import { getFirebase } from './firebase-v9.js';
import { ensureStepOrder, stepToPath } from './onboarding-guard.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { ref, get, update } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const { auth, rtdb } = getFirebase();

function prefill(uid) {
  const profileRef = ref(rtdb, 'users/' + uid + '/profile');
  return get(profileRef)
    .then((snap) => {
      if (!snap.exists()) return;
      const profile = snap.val() || {};
      const name = document.getElementById('name');
      const age = document.getElementById('age');
      if (profile.name) name.value = profile.name;
      if (profile.age) age.value = profile.age;
    })
    .catch((err) => {
      console.warn('Step1 prefill skipped due to RTDB read error:', err?.code || err);
    });
}

function save(uid) {
  const name = document.getElementById('name').value.trim();
  const ageStr = document.getElementById('age').value.trim();
  const age = Number(ageStr);

  if (!name) { alert('Name is required'); return false; }
  if (!age || age < 1 || age > 120) { alert('Age must be between 1 and 120'); return false; }

  const userRef = ref(rtdb, 'users/' + uid);
  return update(userRef, { profile: { name, age } });
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = 'index.html';
    return;
  }

  const uid = user.uid;

  const ok = await ensureStepOrder(1, uid);
  if (!ok) return;

  await prefill(uid);

  document.getElementById('step1Form').addEventListener('submit', async (e) => {
    e.preventDefault();

    try {
      await save(uid);

      // ✅ Always go to step 2 after completing step 1
      window.location.href = stepToPath(2);

    } catch (err) {
      console.error('Step 1 save error:', err);
      alert('Failed to save. Please try again.');
    }
  });
});
