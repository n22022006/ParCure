(function(global){
  // Save session reports using Firebase v9 helper
  async function saveSessionReport(report){
    try {
      const { getFirebase } = await import('./firebase-v9.js');
      const { auth, rtdb } = getFirebase();
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');
      const { ref, set } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js');

      return new Promise((resolve, reject) => {
        onAuthStateChanged(auth, async (user) => {
          try {
            if (!user) {
              console.warn('No user authenticated; skipping RTDB save.');
              resolve(false);
              return;
            }
            const path = `users/${user.uid}/exerciseReports/day_${report.day}/session_${report.session}`;
            await set(ref(rtdb, path), report);
            resolve(true);
          } catch (e) {
            console.error('Failed to save report:', e);
            reject(e);
          }
        });
      });
    } catch (e) {
      console.error('Firebase not available; report not saved to RTDB:', e?.message || e);
      return false;
    }
  }

  global.ParCureExercise = global.ParCureExercise || {};
  global.ParCureExercise.ReportStorage = { saveSessionReport };
})(window);
