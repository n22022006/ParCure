// ===== SIMPLE DIET SYSTEM =====
// No Firebase complexity - just simple, clean code

// Read OpenRouter/OpenAI style key from global config if available
const OPENAI_API_KEY = (typeof window !== 'undefined' && window.OPENAI_API_KEY) ? window.OPENAI_API_KEY : "";
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
        console.error('Diet API Error:', error);
        // Graceful fallback on auth errors or missing key
        const msg = String(error && error.message || error || '').toLowerCase();
        if (msg.includes('401') || msg.includes('unauthorized') || msg.includes('missing api key')) {
            const fallback = buildMockMeals();
            cachedMeals[dateStr] = fallback;
            displayDailyMeals(fallback, dateStr);
            showError('Using sample meals (API unauthorized). Configure your API key.');
        } else {
            showError('Failed to generate meals');
        }
    } finally {
        showLoading(false);
    }
}

// Generate all 4 meals sequentially to avoid repeating foods across the day
async function generateAllMeals(dateStr) {
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const usedFoods = new Set();
    const meals = {};

    for (const meal of mealTypes) {
        const avoidList = Array.from(usedFoods).join(', ') || 'none';
        const prompt = `Create a SHORT and SIMPLE ${meal.toLowerCase()} for an elderly Parkinson's patient for ${dateStr}.

Include 2–3 Indian food options with quantities.
Do NOT repeat any foods from this avoid list: ${avoidList}.
Use different items than earlier meals today.

Format exactly like this:
- Food 1: [name] - [quantity]
- Food 2: [name] - [quantity]
(Optional) Food 3: [name] - [quantity]

Why: [1 sentence benefit]
Tip: [1 sentence tip]`;

        const response = await callAPI(prompt);
        meals[meal] = response;
        // Track foods used to reduce repetition in subsequent meals
        extractFoodsFromText(response).forEach(f => usedFoods.add(f));
    }

    return meals;
}

// Call OpenRouter API
async function callAPI(prompt) {
    if (!OPENAI_API_KEY) {
        throw new Error('Missing API key');
    }
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': 'Bearer ' + OPENAI_API_KEY,
            'X-Title': 'ParCure Diet'
        },
        body: JSON.stringify({
            model: 'openai/gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are Dr. Saathi, a friendly nutritionist for Parkinson\'s patients. Provide short, simple meal recommendations with specific quantities. Do not repeat foods between meals on the same day. No markdown symbols or extra text.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 180,
            presence_penalty: 0.6,
            frequency_penalty: 0.5
        })
    });
    
    if (!response.ok) {
        throw new Error('API error: ' + response.status);
    }
    
    const data = await response.json();
    return data.choices[0]?.message?.content || 'Unable to generate meal';
}

// Extract food names from generated text to build an avoid list
function extractFoodsFromText(text) {
    if (!text) return [];
    const lines = String(text).split(/\n+/);
    const foods = [];
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('-')) continue;
        // Expect pattern: - Food X: NAME - QUANTITY
        const parts = trimmed.split(':');
        if (parts.length < 2) continue;
        const afterColon = parts.slice(1).join(':');
        const namePart = afterColon.split(' - ')[0].trim();
        if (namePart) {
            // Normalize spacing/case for matching
            foods.push(namePart.toLowerCase());
        }
    }
    return foods;
}

// Build mock meals for fallback mode
function buildMockMeals() {
    return {
        Breakfast: `- Food 1: Poha - 1 small bowl\n- Food 2: Masala oats - 1/2 cup\n\nWhy: Easy to chew, gentle on stomach\nTip: Sip warm water alongside`,
        Lunch: `- Food 1: Dal khichdi - 1 medium bowl\n- Food 2: Curd - 1/2 cup\n\nWhy: Balanced protein and carbs\nTip: Eat slowly and avoid heavy spices`,
        Dinner: `- Food 1: Soft chapati + sabzi - 1 chapati + 1/2 cup sabzi\n- Food 2: Vegetable soup - 1 cup\n\nWhy: Light and comforting for evening\nTip: Prefer early dinner`,
        Snacks: `- Food 1: Banana - 1 small\n- Food 2: Roasted chana - small handful\n\nWhy: Gentle energy between meals\nTip: Keep water intake steady`
    };
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

Do NOT repeat foods within this day's plan; prefer variety.

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
