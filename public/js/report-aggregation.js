(function(global){
  async function fetchAllReports(){
    try {
      const { getFirebase } = await import('./firebase-v9.js');
      const { auth, rtdb } = getFirebase();
      const { onAuthStateChanged } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js');
      const { ref, get, child } = await import('https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js');

      return new Promise((resolve) => {
        onAuthStateChanged(auth, async (user) => {
          if (!user) { resolve([]); return; }
          const base = ref(rtdb, `users/${user.uid}/exerciseReports`);
          const snap = await get(base);
          if (!snap.exists()) { resolve([]); return; }
          const data = snap.val();
          // Flatten into array
          const reports = [];
          Object.keys(data || {}).forEach(dayKey => {
            const sessions = data[dayKey];
            Object.keys(sessions || {}).forEach(sessKey => {
              reports.push(sessions[sessKey]);
            });
          });
          resolve(reports);
        });
      });
    } catch (e) {
      console.warn('Firebase not available; aggregator returning empty set', e?.message || e);
      return [];
    }
  }

  function computeDaysCompleted(reports){
    // A day is completed if it has at least 1 session with effectiveness != 'Not Effective'
    const dayMap = new Map();
    for(const r of reports){
      const existing = dayMap.get(r.day) || false;
      const ok = r.effectiveness === 'Highly Effective' || r.effectiveness === 'Effective' || r.effectiveness === 'Less Effective';
      dayMap.set(r.day, existing || ok);
    }
    return Array.from(dayMap.entries()).filter(([_, v]) => v).map(([d]) => d).sort((a,b)=>a-b);
  }

  function calculateStreaks(days){
    if (days.length === 0) return { current: 0, best: 0 };
    let best = 1, currentRun = 1;
    for (let i = 1; i < days.length; i++) {
      if (days[i] === days[i - 1] + 1) { currentRun++; best = Math.max(best, currentRun); } else { currentRun = 1; }
    }
    let current = 1;
    for (let i = days.length - 1; i > 0; i--) { if (days[i] === days[i - 1] + 1) current++; else break; }
    return { current, best };
  }

  function weeklyCounts(days){
    const weeks = [0,0,0,0,0];
    for(const d of days){
      if (d>=1 && d<=7) weeks[0]++; else if (d<=14) weeks[1]++; else if (d<=21) weeks[2]++; else if (d<=28) weeks[3]++; else if (d<=30) weeks[4]++;
    }
    return weeks;
  }

  function completionPercentage(days){
    return Math.round((days.length / 30) * 100);
  }

  function smartSuggestions(reports, daysCompleted, completionPct, streaks){
    const skips = reports.reduce((acc,r)=>acc+(r.exercisesSkipped||0),0);
    const lowScores = reports.filter(r=> (r.score||0)<60).length;
    if(daysCompleted===0){
      return 'You have not started your exercise plan yet. Start with Day 1 and complete at least 2 sessions today for a strong recovery routine.';
    }
    if (completionPct < 20){
      return `Good start. You completed ${daysCompleted} day(s). Focus on consistency: try to complete at least 4 days this week.`;
    }
    if (skips>5){
      return 'Try reducing exercise skips. Consider shorter rest extensions and focusing on posture for each movement.';
    }
    if (lowScores>3){
      return 'Several sessions had low effectiveness. Aim to keep total time near 10 minutes by limiting rest extensions.';
    }
    if (completionPct >= 60 && streaks.current >= 3){
      return 'Excellent consistency. Keep hydration and sleep in check. Maintain pacing to avoid fatigue.';
    }
    return 'Great progress. Maintain daily routine and adjust rests to keep sessions near 10 minutes.';
  }

  async function aggregateReport(){
    const reports = await fetchAllReports();
    const days = computeDaysCompleted(reports);
    const streaks = calculateStreaks(days);
    const weekly = weeklyCounts(days);
    const completionPct = completionPercentage(days);
    const suggestions = smartSuggestions(reports, days.length, completionPct, streaks);
    return { reports, daysCompleted: days.length, lastDay: days[days.length-1]||null, streaks, weekly, completionPct, suggestions, daysList: days };
  }

  global.ParCureExercise = global.ParCureExercise || {};
  global.ParCureExercise.Aggregation = { aggregateReport, fetchAllReports };
})(window);
