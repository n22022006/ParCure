(function(global){
  const { Master, Effectiveness, ReportStorage } = (global.ParCureExercise || {});

  const STATES = { IDLE:'IDLE', EXERCISE:'EXERCISE', REST:'REST', COMPLETE:'COMPLETE' };

  class ExerciseSessionEngine {
    constructor({ day, session, onStateChange, onExerciseStart, onExerciseEnd, onRestStart, onRestEnd, onComplete }){
      this.day = day;
      this.session = session;
      this.state = STATES.IDLE;
      this.onStateChange = onStateChange || (()=>{});
      this.onExerciseStart = onExerciseStart || (()=>{});
      this.onExerciseEnd = onExerciseEnd || (()=>{});
      this.onRestStart = onRestStart || (()=>{});
      this.onRestEnd = onRestEnd || (()=>{});
      this.onComplete = onComplete || (()=>{});

      this.currentExerciseIndex = 0;
      this.totalElapsedSec = 0;
      this.skippedCount = 0;
      this.restExtendedCount = 0;
      this.exerciseLog = [];

      this._timer = null;
      this._remainingSec = 0;
      this._paused = false;

      // Precompute session plan: 6 exercises
      const planIds = Master?.getSessionPlan?.(day, session) || [];
      this._plan = planIds.length ? planIds : (Master?.EXERCISES || []).slice(0, (Master?.EXERCISES_PER_SESSION||6)).map(x=>x.id);
    }

    start(){
      this._transition(STATES.EXERCISE);
      this._startExercise();
    }

    skipExercise(){
      if (this.state !== STATES.EXERCISE) return;
      this.skippedCount++;
      this._log('exercise', { index: this.currentExerciseIndex, skipped: true });
      this._nextPhaseAfterExercise();
    }

    extendRest(extraSec = Master?.REST_DURATION_SEC || 30){
      if (this.state !== STATES.REST) return;
      this.restExtendedCount++;
      this._remainingSec += extraSec;
    }

    stop(){
      clearInterval(this._timer);
      this._timer = null;
      this._transition(STATES.COMPLETE);
      this._finalize();
    }

    _startExercise(){
      const duration = Master?.EXERCISE_DURATION_SEC || 60;
      const exId = this._plan[(this.currentExerciseIndex) % this._plan.length];
      const ex = Master?.findById?.(exId) || (Master?.EXERCISES || [])[0] || { id: exId, name: 'Exercise' };
      this.onExerciseStart({ index: this.currentExerciseIndex, exercise: ex, duration });
      this._countdown(duration, ()=>{
        this._log('exercise', { index: this.currentExerciseIndex, skipped: false });
        this.onExerciseEnd({ index: this.currentExerciseIndex, exercise: ex });
        this._nextPhaseAfterExercise();
      });
    }

    _nextPhaseAfterExercise(){
      this.currentExerciseIndex++;
      if (this.currentExerciseIndex >= (Master?.EXERCISES_PER_SESSION || 6)){
        this._transition(STATES.COMPLETE);
        this._finalize();
      } else {
        this._transition(STATES.REST);
        this._startRest();
      }
    }

    _startRest(){
      const rest = Master?.REST_DURATION_SEC || 30;
      this.onRestStart({ duration: rest, index: this.currentExerciseIndex });
      this._countdown(rest, ()=>{
        this.onRestEnd({ index: this.currentExerciseIndex });
        this._transition(STATES.EXERCISE);
        this._startExercise();
      });
    }

    _countdown(seconds, done){
      clearInterval(this._timer);
      this._remainingSec = seconds;
      this._timer = setInterval(()=>{
        if (this._paused) return;
        this._remainingSec--;
        this.totalElapsedSec++;
        if (this._remainingSec <= 0){
          clearInterval(this._timer);
          this._timer = null;
          done();
        }
      }, 1000);
    }

    pause(){ this._paused = true; }
    resume(){ this._paused = false; }
    isPaused(){ return !!this._paused; }

    _transition(to){
      this.state = to;
      this.onStateChange({ state: to });
    }

    _log(type, payload){
      this.exerciseLog.push({ type, ts: Date.now(), ...payload });
    }

    async _finalize(){
      const plannedDuration = Master?.PLANNED_SESSION_EXERCISE_TIME_SEC || 600;
      const completed = Math.min(this.currentExerciseIndex, Master?.EXERCISES_PER_SESSION || 6);
      const skipped = this.skippedCount;
      const actual = this.totalElapsedSec; // includes rests and extensions
      const restExtendedCount = this.restExtendedCount;
      const { effectiveness, score } = (Effectiveness?.computeEffectiveness || (()=>({effectiveness:'Effective',score:80})) )({
        plannedExerciseSec: plannedDuration,
        actualDurationSec: actual,
        skips: skipped,
        restExtensions: restExtendedCount
      });
      const report = {
        type: 'exercise',
        day: this.day,
        session: this.session,
        date: new Date().toISOString(),
        plannedDuration: plannedDuration,
        actualDuration: actual,
        exercisesPlanned: Master?.EXERCISES_PER_SESSION || 6,
        exercisesCompleted: completed,
        exercisesSkipped: skipped,
        restExtendedCount,
        effectiveness,
        score
      };

      try { await ReportStorage?.saveSessionReport?.(report); } catch(e){ /* ignore */ }
      this.onComplete({ report });
    }
  }

  global.ParCureExercise = global.ParCureExercise || {};
  global.ParCureExercise.Engine = { ExerciseSessionEngine, STATES };
})(window);
