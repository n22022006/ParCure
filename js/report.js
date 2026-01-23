const backBtn = document.getElementById("backBtn");

// UI Elements
const completionText = document.getElementById("completionText");
const progressFill = document.getElementById("progressFill");
const reportSummary = document.getElementById("reportSummary");

const daysCompletedEl = document.getElementById("daysCompleted");
const currentStreakEl = document.getElementById("currentStreak");
const bestStreakEl = document.getElementById("bestStreak");
const lastDayEl = document.getElementById("lastDay");

const suggestionBox = document.getElementById("suggestionBox");

const chartCanvas = document.getElementById("exerciseChart");
const ctx = chartCanvas.getContext("2d");

// Same key used in exercise.js
const STORAGE_KEY = "parcure_exercise_completed_days";

// Load completed days
function getCompletedDays() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.sort((a, b) => a - b) : [];
  } catch {
    return [];
  }
}

// Calculate streaks
function calculateStreaks(days) {
  if (days.length === 0) return { current: 0, best: 0 };

  let best = 1;
  let currentRun = 1;

  for (let i = 1; i < days.length; i++) {
    if (days[i] === days[i - 1] + 1) {
      currentRun++;
      best = Math.max(best, currentRun);
    } else {
      currentRun = 1;
    }
  }

  // Current streak = streak ending at last completed day
  let current = 1;
  for (let i = days.length - 1; i > 0; i--) {
    if (days[i] === days[i - 1] + 1) current++;
    else break;
  }

  return { current, best };
}

// Weekly breakdown (30 days -> week1..week5)
function weeklyBreakdown(days) {
  const weeks = [0, 0, 0, 0, 0]; // Week 1: 1-7, Week2: 8-14, Week3: 15-21, Week4: 22-28, Week5: 29-30
  for (const d of days) {
    if (d >= 1 && d <= 7) weeks[0]++;
    else if (d >= 8 && d <= 14) weeks[1]++;
    else if (d >= 15 && d <= 21) weeks[2]++;
    else if (d >= 22 && d <= 28) weeks[3]++;
    else if (d >= 29 && d <= 30) weeks[4]++;
  }
  return weeks;
}

// Draw bar chart (pure canvas, no library)
function drawBarChart(values) {
  const labels = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];

  // Clear
  ctx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);

  const padding = 40;
  const chartWidth = chartCanvas.width - padding * 2;
  const chartHeight = chartCanvas.height - padding * 2;

  const maxValue = Math.max(...values, 7);
  const barWidth = chartWidth / values.length - 18;

  // Axis
  ctx.font = "14px Arial";
  ctx.fillStyle = "#333";

  // Draw bars
  values.forEach((val, i) => {
    const x = padding + i * (chartWidth / values.length) + 10;
    const barHeight = (val / maxValue) * chartHeight;
    const y = padding + (chartHeight - barHeight);

    // Bar
    ctx.fillStyle = "rgba(109,40,217,0.55)";
    ctx.fillRect(x, y, barWidth, barHeight);

    // Value
    ctx.fillStyle = "#111";
    ctx.fillText(val, x + barWidth / 2 - 4, y - 8);

    // Label
    ctx.fillStyle = "#444";
    ctx.fillText(labels[i], x - 4, padding + chartHeight + 20);
  });

  // Title line
  ctx.fillStyle = "rgba(109,40,217,0.2)";
  ctx.fillRect(padding, padding + chartHeight, chartWidth, 2);
}

// Analyst-style suggestions
function generateSuggestions(daysCompleted, completionPercent, currentStreak, bestStreak) {
  if (daysCompleted === 0) {
    return `You have not started your exercise plan yet.
Start with Day 1 and complete at least 2 sessions today for a strong recovery routine.`;
  }

  if (completionPercent < 20) {
    return `Good start. You completed ${daysCompleted} day(s).
Focus on consistency: try to complete at least 4 days this week.
Small daily progress will improve mobility and reduce pain.`;
  }

  if (completionPercent >= 20 && completionPercent < 60) {
    return `Great progress. Your completion is ${completionPercent}%.
Your best streak is ${bestStreak} day(s).
To recover faster, aim for a streak of 5–7 days with safe pacing.`;
  }

  if (completionPercent >= 60 && completionPercent < 90) {
    return `Excellent consistency. You are ${completionPercent}% through your plan.
Current streak: ${currentStreak} day(s).
Keep hydration + proper sleep along with exercise for faster healing.`;
  }

  return `Outstanding. You are almost complete (${completionPercent}%).
Maintain your routine and continue light stretching even after Day 30 for long-term strength.`;
}

// Main report generator
function buildReport() {
  const completedDays = getCompletedDays();
  const totalDays = 30;
  const doneCount = completedDays.length;

  const completionPercent = Math.round((doneCount / totalDays) * 100);

  // UI updates
  completionText.textContent = `${completionPercent}%`;
  progressFill.style.width = `${completionPercent}%`;

  daysCompletedEl.textContent = doneCount;

  if (doneCount > 0) {
    lastDayEl.textContent = `Day ${completedDays[completedDays.length - 1]}`;
    reportSummary.textContent = `You have completed ${doneCount} out of ${totalDays} days. Keep going.`;
  } else {
    lastDayEl.textContent = "—";
    reportSummary.textContent = "No exercise data found. Start from Move Well.";
  }

  const streaks = calculateStreaks(completedDays);
  currentStreakEl.textContent = streaks.current;
  bestStreakEl.textContent = streaks.best;

  // Weekly chart
  const weekly = weeklyBreakdown(completedDays);
  drawBarChart(weekly);

  // Suggestions
  suggestionBox.textContent = generateSuggestions(doneCount, completionPercent, streaks.current, streaks.best);
}

// Back to dashboard
backBtn.addEventListener("click", () => {
  window.location.href = "dashboard.html";
});

// Build report on load
document.addEventListener("DOMContentLoaded", () => {
  buildReport();
});
