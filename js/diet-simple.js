// ===== SIMPLE DIET SYSTEM =====
// No Firebase complexity - just simple, clean code

const OPENAI_API_KEY = "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";
let currentView = 'daily';
let currentDate = new Date();
let cachedMeals = {};
let weeklyPlan = {};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    console.log('Diet page loaded');
    setupButtons();
    generateDailyView(new Date());
});

// Setup all buttons
function setupButtons() {
    // Back button
    const backBtn = document.querySelector('.diet-back-btn');
    if (backBtn) {
        backBtn.onclick = () => window.location.href = 'dashboard.html';
    }

    // Daily/Weekly toggle
    const dailyBtn = document.getElementById('dailyToggleBtn');
    const weeklyBtn = document.getElementById('weeklyToggleBtn');
    
    if (dailyBtn) dailyBtn.onclick = () => switchView('daily');
    if (weeklyBtn) weeklyBtn.onclick = () => switchView('weekly');

    // Previous/Next day buttons
    const prevBtn = document.getElementById('prevDayBtn');
    const nextBtn = document.getElementById('nextDayBtn');
    
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentDate.setDate(currentDate.getDate() - 1);
            generateDailyView(currentDate);
        };
    }
    
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentDate.setDate(currentDate.getDate() + 1);
            generateDailyView(currentDate);
        };
    }

    // Regenerate button
    const regenerateBtn = document.querySelector('.regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.onclick = () => {
            if (currentView === 'daily') {
                generateDailyView(currentDate, true);
            } else {
                generateWeeklyView(true);
            }
        };
    }
}

// Switch between daily and weekly views
function switchView(view) {
    currentView = view;
    
    // Update buttons
    const dailyBtn = document.getElementById('dailyToggleBtn');
    const weeklyBtn = document.getElementById('weeklyToggleBtn');
    
    if (dailyBtn) dailyBtn.classList.toggle('active', view === 'daily');
    if (weeklyBtn) weeklyBtn.classList.toggle('active', view === 'weekly');
    
    // Update view
    const dailyView = document.getElementById('dailyView');
    const weeklyView = document.getElementById('weeklyView');
    
    if (dailyView) dailyView.classList.toggle('active', view === 'daily');
    if (weeklyView) weeklyView.classList.toggle('active', view === 'weekly');
    
    if (view === 'weekly') {
        generateWeeklyView();
    }
}

// Generate daily view
async function generateDailyView(date, forceRefresh = false) {
    const dateStr = formatDate(date);
    
    // Use cached if available
    if (cachedMeals[dateStr] && !forceRefresh) {
        displayDailyMeals(cachedMeals[dateStr], dateStr);
        return;
    }
    
    console.log('Generating daily meals for:', dateStr);
    showLoading(true);
    
    try {
        const meals = await generateAllMeals(dateStr);
        cachedMeals[dateStr] = meals;
        displayDailyMeals(meals, dateStr);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to generate meals');
    } finally {
        showLoading(false);
    }
}

// Generate all 4 meals in parallel
async function generateAllMeals(dateStr) {
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    
    const promises = mealTypes.map(async (meal) => {
        const prompt = `Create a SHORT and SIMPLE ${meal.toLowerCase()} for an elderly Parkinson's patient for ${dateStr}.

Include 2-3 Indian food options with quantities.

Format exactly like this:
- Food 1: [name] - [quantity]
- Food 2: [name] - [quantity]

Why: [1 sentence benefit]
Tip: [1 sentence tip]`;

        const response = await callAPI(prompt);
        return { meal, content: response };
    });
    
    const results = await Promise.all(promises);
    const meals = {};
    results.forEach(r => meals[r.meal] = r.content);
    return meals;
}

// Call OpenRouter API
async function callAPI(prompt) {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + OPENAI_API_KEY
        },
        body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are Dr. Saathi, a friendly nutritionist for Parkinson\'s patients. Provide short, simple meal recommendations with specific quantities. No markdown symbols or extra text.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 150
        })
    });
    
    if (!response.ok) {
        throw new Error('API error: ' + response.status);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'Unable to generate meal';
}

// Display daily meals
function displayDailyMeals(meals, dateStr) {
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    
    // Update date
    const dateEl = document.querySelector('.current-date');
    if (dateEl) dateEl.textContent = dateStr;
    
    // Update each meal
    mealTypes.forEach(meal => {
        const el = document.getElementById(meal.toLowerCase() + 'Content');
        if (el) {
            el.innerHTML = (meals[meal] || '').replace(/\n/g, '<br>');
        }
    });
}

// Generate weekly view
async function generateWeeklyView(forceRefresh = false) {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    if (!forceRefresh && Object.keys(weeklyPlan).length === 7) {
        displayWeeklyView(weeklyPlan);
        return;
    }
    
    console.log('Generating weekly plan...');
    showLoading(true);
    
    try {
        weeklyPlan = {};
        
        for (const day of days) {
            const meals = await generateDayMeals(day);
            weeklyPlan[day] = meals;
        }
        
        displayWeeklyView(weeklyPlan);
    } catch (error) {
        console.error('Error:', error);
        showError('Failed to generate weekly plan');
    } finally {
        showLoading(false);
    }
}

// Generate meals for one day
async function generateDayMeals(day) {
    const prompt = `Create a SHORT meal plan for ${day} for an elderly Parkinson's patient.

Include 3 simple meals (breakfast, lunch, dinner) with 2-3 Indian food options each.

Format:
Breakfast:
- Food 1 - Quantity
- Food 2 - Quantity

Lunch:
- Food 1 - Quantity
- Food 2 - Quantity

Dinner:
- Food 1 - Quantity
- Food 2 - Quantity`;

    return await callAPI(prompt);
}

// Display weekly view
function displayWeeklyView(plan) {
    const container = document.getElementById('weeklyMeals');
    if (!container) return;
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    container.innerHTML = days.map(day => `
        <div class="day-card">
            <div class="day-name">${day}</div>
            <div class="day-meals">${(plan[day] || '').replace(/\n/g, '<br>')}</div>
        </div>
    `).join('');
}

// Utility functions
function formatDate(date) {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

function showLoading(show) {
    const spinner = document.querySelector('.diet-loading-spinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

function showError(message) {
    const error = document.querySelector('.error-modal');
    if (error) {
        error.textContent = message;
        error.style.display = 'block';
        setTimeout(() => error.style.display = 'none', 3000);
    }
}
