// Enforce sequential onboarding steps and prevent revisits after completion
import { getFirebase } from './firebase-v9.js';
import { ref, get } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

export async function ensureStepOrder(step, uid) {
  const { rtdb } = getFirebase();
  const userRef = ref(rtdb, 'users/' + uid);
  let data = {};
  try {
    const snap = await get(userRef);
    data = snap.exists() ? snap.val() : {};
  } catch (err) {
    console.warn('ensureStepOrder: unable to read user node, proceeding without guard:', err?.code || err);
    // If offline or permission issues, don't block navigation
    return true;
  }

  // If already completed, go back to dashboard
  if (data.onboardingCompleted) {
    window.location.href = 'dashboard.html';
    return false;
  }

  const p = data.profile || {};
  const missing = firstMissingStep(p, step);
  if (missing && missing < step) {
    window.location.href = stepToPath(missing);
    return false;
  }
  return true;
}

function firstMissingStep(profile, currentStep) {
  // Only check steps prior to current
  const checks = [
    () => !profile.name || !profile.age, // Step 1
    () => profile.smoking == null || profile.alcohol == null, // Step 2
    () => profile.exArmyPersonnel == null, // Step 3
    () => profile.treatmentStarted == null // Step 4
    // Step 5 is the symptoms submission; not required before visiting 5
  ];
  for (let i = 1; i < currentStep; i++) {
    if (checks[i - 1]()) return i;
  }
  return null;
}

export function stepToPath(n) {
  switch (n) {
    case 1: return 'onboarding-step1.html';
    case 2: return 'onboarding-step2.html';
    case 3: return 'onboarding-step3.html';
    case 4: return 'onboarding-step4.html';
    case 5: return 'onboarding-step5.html';
    default: return 'onboarding-step1.html';
  }
}

export function nextIncompleteStep(profile, startAt = 1) {
  const checks = [
    () => !profile.name || !profile.age, // Step 1
    () => profile.smoking == null || profile.alcohol == null, // Step 2
    () => profile.exArmyPersonnel == null, // Step 3
    () => profile.treatmentStarted == null // Step 4
    // Step 5 submission handled separately
  ];
  for (let i = startAt; i <= 4; i++) {
    if (checks[i - 1]()) return i;
  }
  // If all steps up to 4 are complete, go to 5
  return 5;
}
