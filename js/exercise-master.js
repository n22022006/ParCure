(function(global){
  const EXERCISE_DURATION_SEC = 60;
  const REST_DURATION_SEC = 30;
  const EXERCISES_PER_SESSION = 6;
  const PLANNED_SESSION_EXERCISE_TIME_SEC = 600; // per requirement

  const EXERCISES = [
    { id: 'band_external_rotation', name: 'Band External Rotation' },
    { id: 'cross_chest_arms_swing', name: 'Cross Chest Arms Swing' },
    { id: 'grapevine', name: 'Grapevine' },
    { id: 'high_knee_marching', name: 'High-Knee Marching' },
    { id: 'inclined_pushups', name: 'Inclined Pushups' },
    { id: 'mini_squats', name: 'Mini squats' },
    { id: 'obstacle_walk', name: 'Obstacle Walk Exercise' },
    { id: 'seated_marching', name: 'Seated Marching' },
    { id: 'single_leg_stand', name: 'Single Leg Stand' },
    { id: 'sit_to_stand', name: 'Sit to stand' },
    { id: 'standing_trunk_rotation', name: 'Standing Trunk Rotation' },
    { id: 'wall_ball_dribbling', name: 'Wall Ball Dribbling Exercise' }
  ];

  function getSessionsCountForDay(day){
    if (day >= 1 && day <= 10) return 2;
    if (day >= 20 && day <= 30) return 3;
    return 2; // default for 11-19
  }

  // Deterministic session plan: rotate through the 12 exercises, 6 per session
  function getSessionPlan(day, session){
    const total = EXERCISES.length; // 12
    // derive a start index based on day & session so variety is ensured
    const start = ((day - 1) * 3 + (session - 1) * 2) % total;
    const plan = [];
    for (let i = 0; i < 6; i++) {
      plan.push(EXERCISES[(start + i) % total].id);
    }
    return plan; // array of exercise IDs length 6
  }

  function findById(id){
    for (const ex of EXERCISES) { if (ex.id === id) return ex; }
    return null;
  }

  // Export
  global.ParCureExercise = global.ParCureExercise || {};
  global.ParCureExercise.Master = {
    EXERCISES,
    EXERCISE_DURATION_SEC,
    REST_DURATION_SEC,
    EXERCISES_PER_SESSION,
    PLANNED_SESSION_EXERCISE_TIME_SEC,
    getSessionsCountForDay,
    getSessionPlan,
    findById,
    getVideoSrc: function(id){
      const base = (window.EXERCISE_VIDEO_BASE || 'videos/');
      return base + id + '.mp4';
    }
  };
})(window);
