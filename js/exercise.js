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

// Storage key
const STORAGE_KEY = "parcure_exercise_completed_days";

// Get completed days
function getCompletedDays() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}

// Save completed days
function setCompletedDays(days) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
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

function buildDayCard(day, completed) {
  const sessions = getSessionsCount(day);

  const card = document.createElement("div");
  card.className = "day-card";

  const top = document.createElement("div");
  top.className = "day-top";

  const dayNum = document.createElement("div");
  dayNum.className = "day-num";
  dayNum.textContent = `Day ${day}`;

  const badge = document.createElement("div");

  if (completed) {
    badge.className = "badge completed";
    badge.textContent = "Done";
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

  card.addEventListener("click", () => openDayModal(day));
  return card;
}

function renderGrid() {
  daysGrid.innerHTML = "";
  const completedDays = getCompletedDays();

  for (let day = 1; day <= 30; day++) {
    const completed = completedDays.includes(day);
    const card = buildDayCard(day, completed);
    daysGrid.appendChild(card);
  }

  updateProgressUI();
}

function updateProgressUI() {
  const completedDays = getCompletedDays();
  const completedCount = completedDays.length;

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

  for (let i = 1; i <= sessions; i++) {
    const sessionCard = document.createElement("div");
    sessionCard.className = "session-card";

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
    btn.textContent = "Start";

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
          onExerciseStart: ({index, exercise}) => { /* attach video playback here if available */ },
          onExerciseEnd: ()=>{},
          onRestStart: ()=>{},
          onRestEnd: ()=>{},
          onComplete: async ({report}) => {
            // Mark completed day locally to keep current UI in sync
            const completedDays = getCompletedDays();
            if (!completedDays.includes(day)) { completedDays.push(day); setCompletedDays(completedDays); }
            updateProgressUI();
            closeModal();
            alert(`Session ${i} complete!\nEffectiveness: ${report.effectiveness}\nScore: ${report.score}`);
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

// Mark completed
markDoneBtn.addEventListener("click", () => {
  const completedDays = getCompletedDays();

  if (!completedDays.includes(selectedDay)) {
    completedDays.push(selectedDay);
    setCompletedDays(completedDays);
  }

  renderGrid();
  closeModal();
});

// Start session 1
startFirstBtn.addEventListener("click", () => {
  alert(`Starting Day ${selectedDay} - Session 1`);
});

// Go back to dashboard (CONNECTED)
backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// Reset progress
resetBtn.addEventListener("click", () => {
  localStorage.removeItem(STORAGE_KEY);
  renderGrid();
  alert("Exercise progress reset successfully.");
});

// Initial render
renderGrid();

// =============================
// Session Player Wiring
// =============================
document.addEventListener('DOMContentLoaded', ()=>{
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
      try { pausedEngine.resume(); } catch {}
      if (spEls && spEls.pauseResume) spEls.pauseResume.textContent = 'Pause';
      try { spEls.video.play(); } catch {}
      toggleResumeBtn(false);
    });
  }
  toastEl = document.getElementById('spToast');
  try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
});

function showSessionPlayer(day, session){
  if (!spEls) return;
  spEls.title.textContent = `Day ${day} • Session ${session}`;
  spEls.subtitle.textContent = `6 exercises • 60s each • 30s rest`;
  spEls.overlay.style.display = 'block';
  setRemainingBoxStyle('neutral');
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
    if (!audioCtx) return;
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
  spEls.skip.onclick = ()=>{ engine?.skipExercise(); showToast('Exercise skipped'); };
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
    spEls.exerciseName.textContent = exercise?.name || `Exercise ${index+1}`;
    const src = Master.getVideoSrc(exercise?.id || '');
    try { spEls.video.src = src; spEls.video.loop = true; spEls.video.play().catch(()=>{}); } catch {}
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
    const intv = setInterval(()=>{ if (!currentEngine || currentEngine.state!=='REST'){ clearInterval(intv); return; } spEls.remaining.textContent = formatSec(currentEngine._remainingSec||0); }, 250);
  };
  eng.onRestEnd = ()=>{};
}
