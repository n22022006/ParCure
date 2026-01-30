const daysGrid = document.getElementById("daysGrid");
const modalOverlay = document.getElementById("modalOverlay");
const closeModalBtn = document.getElementById("closeModal");
const modalTitle = document.getElementById("modalTitle");
const modalSubtitle = document.getElementById("modalSubtitle");
const sessionList = document.getElementById("sessionList");
const markDoneBtn = document.getElementById("markDoneBtn");
const startFirstBtn = document.getElementById("startFirstBtn");

const todayText = document.getElementById("todayText");
const progressText = document.getElementById("progressText");
const progressFill = document.getElementById("progressFill");

const backBtn = document.getElementById("backBtn");
const resetBtn = document.getElementById("resetBtn");

let selectedDay = 1;
let currentEngine = null;
let spEls = null;
let resumeBtnEl = null;
let pausedEngine = null;
let toastEl = null;
let toastTimer = null;
let audioCtx = null;
let soundEnabled = true;
let videoSoundEnabled = false;
let restBeepTimer = null;

// Storage keys
const STORAGE_KEY = "parcure_exercise_completed_days"; // legacy: whole-day completion
const STORAGE_SESSIONS_KEY = "parcure_exercise_sessions_v1"; // new: per-day session completion

// Legacy whole-day completed list (back-compat)
function getCompletedDaysLegacy() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function setCompletedDaysLegacy(days) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
}

// Session-level progress { [day:number]: boolean[] }
function getSessionProgress() {
  const raw = localStorage.getItem(STORAGE_SESSIONS_KEY);
  let obj = raw ? JSON.parse(raw) : {};
  // Backfill from legacy if present
  const legacy = getCompletedDaysLegacy();
  if (legacy.length && Object.keys(obj).length === 0) {
    for (let d of legacy) {
      const count = getSessionsCount(d);
      obj[d] = Array.from({ length: count }, () => true);
    }
  }
  return obj;
}
function setSessionProgress(p) {
  localStorage.setItem(STORAGE_SESSIONS_KEY, JSON.stringify(p));
}

function ensureDayArray(progress, day) {
  const count = getSessionsCount(day);
  if (!progress[day] || !Array.isArray(progress[day])) progress[day] = Array.from({ length: count }, () => false);
  // Adjust length if sessions changed
  if (progress[day].length !== count) {
    const next = Array.from({ length: count }, (_, i) => Boolean(progress[day][i]));
    progress[day] = next;
  }
}

function isDayCompleted(day) {
  const progress = getSessionProgress();
  ensureDayArray(progress, day);
  return progress[day].every(Boolean);
}

function getCompletedDaysCount() {
  let count = 0;
  for (let d = 1; d <= 30; d++) if (isDayCompleted(d)) count++;
  return count;
}

function getUnlockedDayIndex() {
  // First day that is not fully completed is unlocked; following days locked
  for (let d = 1; d <= 30; d++) {
    if (!isDayCompleted(d)) return d;
  }
  return 30; // all done, keep last unlocked
}

// Sessions count logic
function getSessionsCount(day) {
  if (day >= 1 && day <= 19) return 2;
  return 3; // day 20-30
}

function getDayDescription(day) {
  if (day <= 10) return "Easy sessions for routine building.";
  if (day <= 19) return "Balance and strength sessions.";
  return "Extra session for faster recovery.";
}

function buildDayCard(day, completed, locked) {
  const sessions = getSessionsCount(day);

  const card = document.createElement("div");
  card.className = "day-card" + (locked ? " locked" : "");

  const top = document.createElement("div");
  top.className = "day-top";

  const dayNum = document.createElement("div");
  dayNum.className = "day-num";
  dayNum.textContent = `Day ${day}`;

  const badge = document.createElement("div");

  if (completed) {
    badge.className = "badge completed";
    badge.textContent = "Done";
  } else if (locked) {
    badge.className = "badge locked";
    badge.textContent = "Locked";
  } else {
    badge.className = `badge ${sessions === 2 ? "two" : "three"}`;
    badge.textContent = `${sessions} Sessions`;
  }

  top.appendChild(dayNum);
  top.appendChild(badge);

  const desc = document.createElement("div");
  desc.className = "day-desc";
  desc.textContent = getDayDescription(day);

  card.appendChild(top);
  card.appendChild(desc);

  if (!locked) card.addEventListener("click", () => openDayModal(day));
  return card;
}

function renderGrid() {
  daysGrid.innerHTML = "";
  const unlocked = getUnlockedDayIndex();

  for (let day = 1; day <= 30; day++) {
    const completed = isDayCompleted(day);
    const locked = day > unlocked && !completed;
    const card = buildDayCard(day, completed, locked);
    daysGrid.appendChild(card);
  }

  updateProgressUI();
}

function updateProgressUI() {
  const completedCount = getCompletedDaysCount();

  todayText.textContent = `Day ${selectedDay}`;
  progressText.textContent = `${completedCount} / 30`;

  const percent = (completedCount / 30) * 100;
  progressFill.style.width = `${percent}%`;
}

function openDayModal(day) {
  selectedDay = day;

  const sessions = getSessionsCount(day);
  modalTitle.textContent = `Day ${day}`;
  modalSubtitle.textContent = `${sessions} Sessions • Safe Plan`;

  sessionList.innerHTML = "";

  const progress = getSessionProgress();
  ensureDayArray(progress, day);

  for (let i = 1; i <= sessions; i++) {
    const sessionCard = document.createElement("div");
    const completed = !!progress[day][i - 1];
    const prevCompleted = i === 1 ? true : !!progress[day][i - 2];
    const locked = !completed && !prevCompleted;
    sessionCard.className = "session-card" + (locked ? " locked" : completed ? " completed" : "");

    const left = document.createElement("div");
    left.className = "session-left";

    const title = document.createElement("div");
    title.className = "session-title";
    title.textContent = `Session ${i}`;

    const sub = document.createElement("div");
    sub.className = "session-sub";
    sub.textContent = "Warm-up • Therapy • Cool down";

    left.appendChild(title);
    left.appendChild(sub);

    const btn = document.createElement("button");
    btn.className = "session-btn";
    if (completed) { btn.textContent = "Completed"; btn.disabled = true; btn.classList.add('disabled'); }
    else if (locked) { btn.textContent = "Locked"; btn.disabled = true; btn.classList.add('disabled'); }
    else { btn.textContent = "Start"; }

    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      try {
        const Engine = window.ParCureExercise?.Engine;
        const Master = window.ParCureExercise?.Master;
        const ReportStorage = window.ParCureExercise?.ReportStorage;
        if (!Engine || !Master) {
          alert(`Starting Day ${day} - Session ${i}\n(Session engine not loaded; please include exercise-engine.js and exercise-master.js)`);
          return;
        }
        const eng = new Engine.ExerciseSessionEngine({
          day,
          session: i,
          onStateChange: ({state}) => { /* could update UI if present */ },
          onExerciseStart: ({index, exercise}) => { /* video handled in attachEngineEvents */ },
          onExerciseEnd: ()=>{},
          onRestStart: ()=>{},
          onRestEnd: ()=>{},
          onComplete: async ({report}) => {
            // Mark this session completed
            const prog = getSessionProgress();
            ensureDayArray(prog, day);
            prog[day][i - 1] = true;
            setSessionProgress(prog);
            // If all sessions done, toast
            if (prog[day].every(Boolean)) {
              showToast(`Day ${day} completed!`);
            } else {
              showToast(`Session ${i} completed`);
            }
            updateProgressUI();
            // Re-render modal session list and grid to unlock next session/day
            renderGrid();
            openDayModal(day);
          }
        });
        currentEngine = eng;
        // Keyboard shortcuts: S to skip exercise, R to extend rest
        const keyHandler = (ev) => {
          if (!currentEngine) return;
          if (ev.key.toLowerCase() === 's') { currentEngine.skipExercise(); showToast('Exercise skipped'); }
          if (ev.key.toLowerCase() === 'r') { currentEngine.extendRest(); showToast('Rest extended +30s'); }
        };
        document.addEventListener('keydown', keyHandler);
        showSessionPlayer(day, i);
        attachEngineEvents(eng);
        wireControls(eng);
        toggleResumeBtn(false);
        eng.start();
      } catch (err) {
        console.error('Failed to start session engine:', err);
        alert('Failed to start session. See console for details.');
      }
    });

    sessionCard.appendChild(left);
    sessionCard.appendChild(btn);

    sessionList.appendChild(sessionCard);
  }

  modalOverlay.classList.add("show");
  updateProgressUI();
}

function closeModal() {
  modalOverlay.classList.remove("show");
}

closeModalBtn.addEventListener("click", closeModal);
modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) closeModal();
});

// Mark completed (entire day)
markDoneBtn.addEventListener("click", () => {
  const progress = getSessionProgress();
  ensureDayArray(progress, selectedDay);
  progress[selectedDay] = progress[selectedDay].map(() => true);
  setSessionProgress(progress);
  renderGrid();
  openDayModal(selectedDay);
});

// Start session 1
startFirstBtn.addEventListener("click", () => {
  const progress = getSessionProgress();
  ensureDayArray(progress, selectedDay);
  const idx = progress[selectedDay].findIndex(v => !v);
  const sessionToStart = idx === -1 ? 1 : (idx + 1);
  // simulate clicking that session's button by reopening modal and triggering handler
  openDayModal(selectedDay);
  const btns = sessionList.querySelectorAll('.session-btn');
  if (btns && btns[sessionToStart - 1] && !btns[sessionToStart - 1].disabled) {
    btns[sessionToStart - 1].click();
  }
});

// Go back to dashboard (CONNECTED)
backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// Reset progress
resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(STORAGE_SESSIONS_KEY);
  renderGrid();
  alert("Exercise progress reset successfully.");
});

// Initial render
renderGrid();

// =============================
// Session Player Wiring
// =============================
document.addEventListener('DOMContentLoaded', ()=>{
  // Ensure master video base points to existing folder
  try { window.EXERCISE_VIDEO_BASE = 'video/'; } catch {}
  spEls = {
    overlay: document.getElementById('sessionPlayerOverlay'),
    close: document.getElementById('spClose'),
    title: document.getElementById('spTitle'),
    subtitle: document.getElementById('spSubtitle'),
    video: document.getElementById('sessionVideo'),
    exerciseName: document.getElementById('spExerciseName'),
    state: document.getElementById('spState'),
    remaining: document.getElementById('spRemaining'),
    pauseResume: document.getElementById('spPauseResume'),
    sound: document.getElementById('spSound'),
    videoSound: document.getElementById('spVideoSound'),
    skip: document.getElementById('spSkip'),
    extendRest: document.getElementById('spExtendRest'),
    stop: document.getElementById('spStop')
  };
  if (spEls.close) spEls.close.addEventListener('click', ()=>{
    if (!currentEngine) { hideSessionPlayer(); return; }
    const endNow = confirm('Stop session?\nOK = End now (save report)\nCancel = Pause and resume later');
    if (endNow) {
      try { currentEngine.stop(); } catch {}
      pausedEngine = null;
      hideSessionPlayer();
      toggleResumeBtn(false);
    } else {
      try { currentEngine.pause(); } catch {}
      pausedEngine = currentEngine;
      hideSessionPlayer();
      toggleResumeBtn(true);
    }
  });
  resumeBtnEl = document.getElementById('resumeLastSessionBtn');
  if (resumeBtnEl) {
    resumeBtnEl.addEventListener('click', ()=>{
      if (!pausedEngine) return;
      showSessionPlayer(pausedEngine.day, pausedEngine.session);
      ensureAudioReady();
      try { pausedEngine.resume(); } catch {}
      if (spEls && spEls.pauseResume) spEls.pauseResume.textContent = 'Pause';
      try { spEls.video.play(); } catch {}
      toggleResumeBtn(false);
    });
  }
  toastEl = document.getElementById('spToast');
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  // Load sound preference
  try {
    const saved = localStorage.getItem('parcure_exercise_sound');
    if (saved !== null) soundEnabled = saved === 'true';
    const vSaved = localStorage.getItem('parcure_exercise_video_sound');
    if (vSaved !== null) videoSoundEnabled = vSaved === 'true';
  } catch {}
  updateSoundBtn();
  updateVideoSoundBtn();
  if (spEls.sound) {
    spEls.sound.addEventListener('click', ()=>{
      soundEnabled = !soundEnabled;
      try { localStorage.setItem('parcure_exercise_sound', String(soundEnabled)); } catch {}
      if (soundEnabled) ensureAudioReady();
      updateSoundBtn();
      showToast(`Sound: ${soundEnabled ? 'On' : 'Off'}`);
    });
  }
  if (spEls.videoSound) {
    spEls.videoSound.addEventListener('click', ()=>{
      videoSoundEnabled = !videoSoundEnabled;
      try { localStorage.setItem('parcure_exercise_video_sound', String(videoSoundEnabled)); } catch {}
      applyVideoSound();
      updateVideoSoundBtn();
      showToast(`Video Sound: ${videoSoundEnabled ? 'On' : 'Off'}`);
    });
  }
});

function showSessionPlayer(day, session){
  if (!spEls) return;
  spEls.title.textContent = `Day ${day} • Session ${session}`;
  spEls.subtitle.textContent = `6 exercises • 60s each • 30s rest`;
  spEls.overlay.style.display = 'block';
  setRemainingBoxStyle('neutral');
  ensureAudioReady();
  applyVideoSound();
}

function hideSessionPlayer(){ if (spEls) spEls.overlay.style.display = 'none'; }

function toggleResumeBtn(show){ if (resumeBtnEl) resumeBtnEl.style.display = show ? 'block' : 'none'; }

// Subtle phase cues: vibration + remaining box color
function safeVibrate(pattern){ try { if (navigator.vibrate) navigator.vibrate(pattern); } catch {} }

function setRemainingBoxStyle(mode){
  if (!spEls || !spEls.remaining) return;
  const box = spEls.remaining.parentElement;
  if (!box) return;
  if (mode === 'exercise') {
    box.style.background = '#eafff1';
    box.style.borderColor = '#b9f2d5';
    spEls.remaining.style.color = '#0f5132';
  } else if (mode === 'rest') {
    box.style.background = '#fff4e6';
    box.style.borderColor = '#ffdfaa';
    spEls.remaining.style.color = '#7a5a00';
  } else {
    box.style.background = '#f7f7ff';
    box.style.borderColor = '#e6e6ff';
    spEls.remaining.style.color = '#4c1d95';
  }
}

function showToast(msg, ms=2000){
  if (!toastEl) return;
  toastEl.textContent = msg;
  toastEl.style.display = 'block';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ toastEl.style.display = 'none'; }, ms);
}

function playBeep(type='exercise'){
  try {
    if (!audioCtx || !soundEnabled) return;
    if (audioCtx.state === 'suspended') return; // will resume on user gesture
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = type==='exercise' ? 660 : 440; // higher tone for exercise, lower for rest
    gain.gain.value = 0.04; // soft volume
    osc.connect(gain).connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {}
}

function formatSec(s){ const m = Math.floor(s/60).toString().padStart(2,'0'); const ss = (s%60).toString().padStart(2,'0'); return `${m}:${ss}`; }

function wireControls(engine){
  if (!spEls) return;
  spEls.pauseResume.onclick = ()=>{
    if (!engine) return;
    if (engine.isPaused()){ engine.resume(); spEls.pauseResume.textContent = 'Pause'; showToast('Resumed'); if(!spEls.video.paused){} else { try { spEls.video.play(); } catch {} } }
    else { engine.pause(); spEls.pauseResume.textContent = 'Resume'; showToast('Paused'); try { spEls.video.pause(); } catch {} }
  };
  spEls.skip.onclick = ()=>{ ensureAudioReady(); engine?.skipExercise(); showToast('Exercise skipped'); };
  spEls.extendRest.onclick = ()=>{ engine?.extendRest(); showToast('Rest extended +30s'); };
  spEls.stop.onclick = ()=>{
    if (!engine) return;
    const endNow = confirm('Stop session?\nOK = End now (save report)\nCancel = Pause and resume later');
    if (endNow) {
      try { engine.stop(); } catch {}
      pausedEngine = null;
      hideSessionPlayer();
      toggleResumeBtn(false);
    } else {
      try { engine.pause(); } catch {}
      pausedEngine = engine;
      hideSessionPlayer();
      toggleResumeBtn(true);
    }
  };
}

function attachEngineEvents(eng){
  const Master = window.ParCureExercise?.Master;
  eng.onStateChange = ({state})=>{ if (spEls) spEls.state.textContent = state; };
  eng.onExerciseStart = ({index, exercise, duration})=>{
    if (!spEls || !Master) return;
    clearRestBeepTimer();
    spEls.exerciseName.textContent = exercise?.name || `Exercise ${index+1}`;
    // Prefer explicit map path, then fallback to Master base
    const map = (window.EXERCISE_VIDEO_MAP || {});
    let src = map[exercise?.id] || '';
    if (src && typeof src === 'string') src = src.trim();
    if (!src) src = Master.getVideoSrc(exercise?.id || '');
    try {
      spEls.video.src = src;
      spEls.video.loop = true;
      applyVideoSound();
      spEls.video.play().catch(()=>{});
    } catch {}
    playBeep('exercise');
    setRemainingBoxStyle('exercise');
    safeVibrate(80);
    // Live remaining updates via interval
    const intv = setInterval(()=>{ if (!currentEngine || currentEngine.state!=='EXERCISE'){ clearInterval(intv); return; } spEls.remaining.textContent = formatSec(currentEngine._remainingSec||0); }, 250);
  };
  eng.onExerciseEnd = ()=>{ try { spEls.video.pause(); } catch {} };
  eng.onRestStart = ({duration})=>{
    if (!spEls) return;
    spEls.exerciseName.textContent = 'Rest';
    try { spEls.video.pause(); } catch {}
    playBeep('rest');
    setRemainingBoxStyle('rest');
    safeVibrate(40);
    // Repeating beep during rest until it's over
    clearRestBeepTimer();
    restBeepTimer = setInterval(()=>{
      if (!currentEngine || currentEngine.state !== 'REST' || currentEngine.isPaused()) return;
      playBeep('rest');
    }, 1000);
    const intv = setInterval(()=>{ if (!currentEngine || currentEngine.state!=='REST'){ clearInterval(intv); return; } spEls.remaining.textContent = formatSec(currentEngine._remainingSec||0); }, 250);
  };
  eng.onRestEnd = ()=>{ clearRestBeepTimer(); };
}

function ensureAudioReady(){
  try {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') { audioCtx.resume().catch(()=>{}); }
  } catch {}
}

function updateSoundBtn(){
  if (spEls && spEls.sound) spEls.sound.textContent = `Sound: ${soundEnabled ? 'On' : 'Off'}`;
}

function updateVideoSoundBtn(){
  if (spEls && spEls.videoSound) spEls.videoSound.textContent = `Video Sound: ${videoSoundEnabled ? 'On' : 'Off'}`;
}

function applyVideoSound(){
  try {
    if (!spEls || !spEls.video) return;
    spEls.video.muted = !videoSoundEnabled;
    spEls.video.volume = videoSoundEnabled ? 0.8 : 0.0;
  } catch {}
}

function clearRestBeepTimer(){ if (restBeepTimer){ clearInterval(restBeepTimer); restBeepTimer = null; } }
