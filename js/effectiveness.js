(function(global){
  /**
   * Compute effectiveness and score (0-100)
   * Inputs:
   * - plannedExerciseSec: planned exercise time (600)
   * - actualDurationSec: total session elapsed including rests and extensions
   * - skips: number of exercises skipped
   * - restExtensions: count of rest extensions
   */
  function computeEffectiveness({ plannedExerciseSec, actualDurationSec, skips, restExtensions }){
    // Base score from how close actualDuration is to ideal (10 min = 600 sec exercise + pacing)
    // We'll treat 10 min as target; penalties for going over.
    const idealMin = 10 * 60;
    const diff = Math.max(0, actualDurationSec - idealMin);

    let score = 100;
    if (diff <= 0) {
      score -= 0; // on or under ideal
    } else if (diff <= 120) {
      score -= 10; // 10–12 min
    } else if (diff <= 180) {
      score -= 20; // 12–13 min
    } else {
      score -= 35; // >13 min
    }

    // Penalties
    score -= skips * 10;
    score -= restExtensions * 3;

    score = Math.max(0, Math.min(100, Math.round(score)));

    let effectiveness = 'Highly Effective';
    if (actualDurationSec <= 10 * 60) {
      effectiveness = 'Highly Effective';
    } else if (actualDurationSec <= 12 * 60) {
      effectiveness = 'Effective';
    } else if (actualDurationSec <= 13 * 60) {
      effectiveness = 'Less Effective';
    } else {
      effectiveness = 'Not Effective';
    }

    return { effectiveness, score };
  }

  global.ParCureExercise = global.ParCureExercise || {};
  global.ParCureExercise.Effectiveness = { computeEffectiveness };
})(window);
