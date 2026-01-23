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
      alert(`Starting Day ${day} - Session ${i}`);
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
