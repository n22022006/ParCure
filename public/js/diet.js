// ===========================
// DIET PLAN MANAGEMENT SYSTEM
// ===========================

let currentUser = null;
let userCondition = '';
let dietPlans = {}; // Legacy - for daily view caching
let weeklyDietPlan = {
    'Monday': { breakfast: null, lunch: null, dinner: null },
    'Tuesday': { breakfast: null, lunch: null, dinner: null },
    'Wednesday': { breakfast: null, lunch: null, dinner: null },
    'Thursday': { breakfast: null, lunch: null, dinner: null },
    'Friday': { breakfast: null, lunch: null, dinner: null },
    'Saturday': { breakfast: null, lunch: null, dinner: null },
    'Sunday': { breakfast: null, lunch: null, dinner: null }
};
let currentDate = new Date();
let currentView = 'daily';

// Initialize Diet Page
async function initDietPage() {
    try {
        console.log('🔥 Diet page initializing...');
        
        // Setup event listeners first (doesn't depend on Firebase)
        setupEventListeners();
        
        // Check if auth is available
        if (typeof auth === 'undefined') {
            console.warn('Auth not available yet, waiting...');
            setTimeout(initDietPage, 500);
            return;
        }

        // Get current user
        currentUser = auth.currentUser;
        console.log('Current user:', currentUser?.email || 'No user');
        
        if (!currentUser) {
            console.warn('No user logged in, redirecting to login');
            window.location.href = 'index.html';
            return;
        }

        // Load user condition from Firebase
        await loadUserCondition();

        // Show motivational message
        showMotivationalMessage();

        // Auto-generate diet plan for today
        console.log('Starting daily diet plan generation...');
        await generateDailyDietPlan(new Date());
        console.log('✅ Diet page initialized successfully');

    } catch (error) {
        console.error('Error initializing diet page:', error);
        console.error('Error details:', error.message);
        showError('Failed to initialize diet page: ' + error.message);
    }
}

// Show motivational message from Saathi
function showMotivationalMessage() {
    const motivationalMessages = [
        "You're doing great! Let's create a healthy meal plan for you today.",
        "Remember, eating right is taking care of yourself. Let's get started!",
        "Small steps lead to big changes. Today's meals are specially planned for you.",
        "Your health is important. Let's make today's nutrition count!",
        "You've got this! Healthy eating is within your reach.",
        "Every meal is an opportunity to nourish your body. Let's begin!"
    ];
    
    const randomMessage = motivationalMessages[Math.floor(Math.random() * motivationalMessages.length)];
    const motivationElement = document.getElementById('motivationMessage');
    if (motivationElement) {
        motivationElement.textContent = randomMessage;
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Back button - navigate to dashboard
    const backBtn = document.querySelector('.diet-back-btn');
    if (backBtn) {
        backBtn.onclick = function() {
            window.location.href = 'dashboard.html';
            return false;
        };
    }

    // View toggle buttons
    const dailyToggle = document.getElementById('dailyToggleBtn');
    const weeklyToggle = document.getElementById('weeklyToggleBtn');

    if (dailyToggle) {
        dailyToggle.addEventListener('click', () => {
            switchView('daily');
        });
    }

    if (weeklyToggle) {
        weeklyToggle.addEventListener('click', () => {
            switchView('weekly');
        });
    }

    // Date navigation
    const prevBtn = document.getElementById('prevDayBtn');
    const nextBtn = document.getElementById('nextDayBtn');

    if (prevBtn) {
        prevBtn.addEventListener('click', previousDay);
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', nextDay);
    }

    // Regenerate button
    const regenerateBtn = document.querySelector('.regenerate-btn');
    if (regenerateBtn) {
        regenerateBtn.addEventListener('click', regeneratePlan);
    }
}

// Fetch User Condition from Realtime Database
async function loadUserCondition() {
    try {
        if (typeof rtdb === 'undefined') {
            console.warn('Realtime Database not available yet');
            userCondition = 'General Health Management';
            return;
        }
        const snapshot = await rtdb.ref('patients/' + currentUser.uid).once('value');

        if (snapshot.exists()) {
            const data = snapshot.val() || {};
            // Try different possible field names where condition might be stored
            userCondition = data.medicalCondition || 
                           data.condition || 
                           (data.medical && data.medical.condition) ||
                           (data.personalDetails && data.personalDetails.condition) ||
                           'General Health Management';

            // Update condition display
            const conditionValue = document.querySelector('.condition-value');
            if (conditionValue) {
                conditionValue.textContent = userCondition;
            }
        } else {
            // Default condition if no data found
            userCondition = 'General Health Management';
            const conditionValue = document.querySelector('.condition-value');
            if (conditionValue) {
                conditionValue.textContent = userCondition;
            }
        }
    } catch (error) {
        console.error('Error loading user condition:', error);
        userCondition = 'General Health Management';
    }
}

// Generate Daily Diet Plan using Gemini API
async function generateDailyDietPlan(date) {
    try {
        console.log('🎯 Starting daily diet plan generation...');
        showLoadingSpinner(true);

        const dateString = formatDate(date);
        const dateKey = dateString;

        // Check if plan already exists for this date
        if (dietPlans[dateKey]) {
            console.log('💾 Using cached plan for:', dateString);
            updateDailyView(dietPlans[dateKey], dateString);
            showLoadingSpinner(false);
            return;
        }

        console.log('🔄 No cached plan found, generating new meals...');
        // Call Gemini API to generate plan
        const meals = await generateMealPlans(dateString);

        // Store the plan
        dietPlans[dateKey] = meals;

        // Update the view
        updateDailyView(meals, dateString);

        console.log('🎉 Daily diet plan generation complete!');
        showLoadingSpinner(false);

    } catch (error) {
        console.error('❌ Error generating diet plan:', error);
        console.error('Stack:', error.stack);
        showError('Failed to generate diet plan. Please try again.');
        showLoadingSpinner(false);
    }
}

// Generate Individual Meals using Gemini API (for daily view)
async function generateMealPlans(dateString) {
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const geminiKey = window.OPENAI_API_KEY || getGeminiKeyFromConfig();

    if (!geminiKey) {
        throw new Error('Gemini API key not configured');
    }

    console.log(`🍽️ Generating ${mealTypes.length} meals for ${dateString}`);

    // Generate all meals in parallel (much faster!)
    const mealPromises = mealTypes.map(async (mealType) => {
        try {
            console.log(`  → Generating ${mealType}...`);
            const prompt = createMealPromptDaily(mealType, dateString);
            const response = await callGeminiAPI(prompt, geminiKey);
            console.log(`  ✓ ${mealType} generated (${response?.length || 0} chars)`);
            return { mealType, response };
        } catch (error) {
            console.error(`Error generating ${mealType}:`, error);
            return { mealType, response: `Unable to generate ${mealType} plan. Please try again.` };
        }
    });

    // Wait for all meals to be generated at the same time
    console.log('⏳ Waiting for all meals...');
    const mealResults = await Promise.all(mealPromises);
    console.log('✅ All meals generated');
    
    // Convert results array to object
    const meals = {};
    mealResults.forEach(result => {
        meals[result.mealType] = result.response;
    });

    return meals;
}

// Create Prompt for Daily View (Breakfast, Lunch, Dinner, Snacks)
function createMealPromptDaily(mealType, dateString) {
    const timeRanges = {
        'Breakfast': '7:00 AM - 9:00 AM',
        'Lunch': '12:00 PM - 2:00 PM',
        'Dinner': '6:00 PM - 8:00 PM',
        'Snacks': 'Throughout the day'
    };

    const prompt = `Generate a SHORT and SIMPLE ${mealType.toLowerCase()} meal plan for an elderly Parkinson's disease patient for ${dateString}.
Time: ${timeRanges[mealType]}

Include Indian food options if suitable. Keep it short - Only 2-3 food items.

Format:
Food Item 1: [Name] - [Quantity]
Food Item 2: [Name] - [Quantity]
Food Item 3: [Name] - [Quantity]

Why it helps:
[1-2 sentences explaining benefits]

Quick tip:
[1 sentence eating or preparation tip]`;

    return prompt;
}
    
    // Convert results array to object
    const meals = {};
    mealResults.forEach(result => {
        meals[result.mealType] = result.response;
    });

    return meals;


// Create Prompt for specific day and meal type
function createMealPromptForDay(dayName, mealType) {
    const mealTimes = {
        'breakfast': '7:00 AM - 9:00 AM',
        'lunch': '12:00 PM - 2:00 PM',
        'dinner': '6:00 PM - 8:00 PM'
    };

    const capitalizedMeal = mealType.charAt(0).toUpperCase() + mealType.slice(1);
    
    const prompt = `Generate a SHORT and SIMPLE ${mealType} meal plan for ${dayName} (${mealTimes[mealType]}) for an elderly Parkinson's disease patient.

Include Indian food options if suitable. Keep it short - Only 2-3 food items.

Format:
Food Item 1: [Name] - [Quantity]
Food Item 2: [Name] - [Quantity]
Food Item 3: [Name] - [Quantity]

Why it helps:
[1-2 sentences explaining benefits]

Quick tip:
[1 sentence eating or preparation tip]`;

    return prompt;
}

// Call OpenRouter API
async function callGeminiAPI(prompt, apiKey) {
    const apiKeyToUse = window.OPENAI_API_KEY || apiKey;

    try {
        console.log('🌐 OpenRouter API Call');
        console.log('  • API Key present:', !!apiKeyToUse);
        console.log('  • Prompt length:', prompt.length);
        
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + apiKeyToUse
            },
            body: JSON.stringify({
                model: 'openai/gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: 'You are Dr. Saathi, a nutritionist specialist for elderly Parkinson\'s disease patients. Your job is to provide SPECIFIC food recommendations with exact quantities. Start with actual food names and quantities IMMEDIATELY. No greetings. Format in plain text without markdown.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 200
            })
        });

        console.log('  • Response Status:', response.status);

        if (!response.ok) {
            const errorData = await response.json();
            console.error('  ✗ API Error:', errorData);
            throw new Error(`OpenRouter API error: ${errorData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        console.log('  ✓ Success - Response received');

        if (data.choices && data.choices[0]?.message?.content) {
            return data.choices[0].message.content;
        } else {
            throw new Error('Unexpected API response format');
        }

    } catch (error) {
        console.error('✗ OpenRouter API failed:', error.message);
        throw error;
    }
}

// Update Daily View
function updateDailyView(meals, dateString) {
    console.log('📋 Updating daily view for:', dateString);
    console.log('Meals data:', meals);
    
    const mealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

    mealTypes.forEach(mealType => {
        const contentElement = document.getElementById(`${mealType.toLowerCase()}Content`);
        if (contentElement) {
            const mealContent = meals[mealType] || 'Generating meal plan...';
            console.log(`  → ${mealType}: ${mealContent?.substring(0, 50)}...`);
            contentElement.innerHTML = formatMealContent(mealContent);
        } else {
            console.warn(`  ✗ Element not found for ${mealType}`);
        }
    });

    // Update nutrition summary
    calculateAndDisplayNutrition(meals);

    // Update current date display
    const currentDateElement = document.querySelector('.current-date');
    if (currentDateElement) {
        currentDateElement.textContent = dateString;
        console.log('  → Date updated:', dateString);
    }
    
    console.log('✅ Daily view updated');
}

// Format Meal Content for Display
function formatMealContent(content) {
    if (!content || content.includes('Unable to generate')) {
        return `<p class="loading-text">${content}</p>`;
    }

    // Convert markdown-style formatting to HTML
    let html = content
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/^- /gm, '')
        .split('\n')
        .filter(line => line.trim())
        .map(line => {
            if (line.startsWith('**')) {
                return `<p><strong>${line.replace(/\*\*/g, '')}</strong></p>`;
            } else if (line.match(/^\d+\./)) {
                return `<p>${line}</p>`;
            } else {
                return `<p>${line}</p>`;
            }
        })
        .join('');

    return html;
}

// Calculate and Display Nutrition Summary
function calculateAndDisplayNutrition(meals) {
    // Extract nutrition values from meal content
    const nutritionSummary = extractNutritionData(meals);

    const summaryElement = document.getElementById('nutritionSummary');
    if (summaryElement) {
        summaryElement.innerHTML = `
            <h3>Daily Nutrition Summary</h3>
            <div class="nutrition-grid">
                <div class="nutrition-item">
                    <div class="nutrition-label">Calories</div>
                    <div class="nutrition-value">${nutritionSummary.calories}</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Protein</div>
                    <div class="nutrition-value">${nutritionSummary.protein}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Carbs</div>
                    <div class="nutrition-value">${nutritionSummary.carbs}g</div>
                </div>
                <div class="nutrition-item">
                    <div class="nutrition-label">Fats</div>
                    <div class="nutrition-value">${nutritionSummary.fats}g</div>
                </div>
            </div>
        `;
    }
}

// Extract Nutrition Data from Meal Content
function extractNutritionData(meals) {
    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    for (const meal in meals) {
        const content = meals[meal] || '';
        
        // Extract numbers from the content
        const calorieMatch = content.match(/(\d+)\s*calories?/i);
        const proteinMatch = content.match(/(\d+)\s*g?\s*protein/i);
        const carbsMatch = content.match(/(\d+)\s*g?\s*carbs?/i);
        const fatsMatch = content.match(/(\d+)\s*g?\s*fats?/i);

        if (calorieMatch) totalCalories += parseInt(calorieMatch[1]) || 0;
        if (proteinMatch) totalProtein += parseInt(proteinMatch[1]) || 0;
        if (carbsMatch) totalCarbs += parseInt(carbsMatch[1]) || 0;
        if (fatsMatch) totalFats += parseInt(fatsMatch[1]) || 0;
    }

    // If no data extracted, show placeholder values
    if (totalCalories === 0) {
        totalCalories = '~2000-2500';
        totalProtein = '~50-60';
        totalCarbs = '~200-250';
        totalFats = '~60-70';
    }

    return {
        calories: totalCalories,
        protein: totalProtein,
        carbs: totalCarbs,
        fats: totalFats
    };
}

// Switch View between Daily and Weekly
async function switchView(view) {
    currentView = view;

    const dailyView = document.getElementById('dailyView');
    const weeklyView = document.getElementById('weeklyView');
    const dailyToggle = document.getElementById('dailyToggleBtn');
    const weeklyToggle = document.getElementById('weeklyToggleBtn');

    if (view === 'daily') {
        if (dailyView) dailyView.classList.add('active');
        if (weeklyView) weeklyView.classList.remove('active');
        if (dailyToggle) dailyToggle.classList.add('active');
        if (weeklyToggle) weeklyToggle.classList.remove('active');
    } else {
        if (dailyView) dailyView.classList.remove('active');
        if (weeklyView) weeklyView.classList.add('active');
        if (dailyToggle) dailyToggle.classList.remove('active');
        if (weeklyToggle) weeklyToggle.classList.add('active');
        await generateWeeklyView();
    }
}

// Generate Weekly View
async function generateWeeklyView() {
    try {
        showLoadingSpinner(true);

        const weeklyGrid = document.querySelector('.weekly-grid');
        if (!weeklyGrid) {
            showLoadingSpinner(false);
            return;
        }

        weeklyGrid.innerHTML = '';

        // Check if weekly plan is empty - if so, generate it
        const hasAllMeals = Object.keys(weeklyDietPlan).every(day => 
            weeklyDietPlan[day].breakfast && weeklyDietPlan[day].lunch && weeklyDietPlan[day].dinner
        );

        if (!hasAllMeals) {
            await generateCompleteWeeklyPlan();
        }

        // Render exactly 7 cards from weeklyDietPlan - one per day
        Object.keys(weeklyDietPlan).forEach(dayName => {
            const dayMeals = weeklyDietPlan[dayName];
            const dayCard = createDayCard(dayName, dayMeals);
            weeklyGrid.appendChild(dayCard);
        });

        console.log('Weekly view rendered with', Object.keys(weeklyDietPlan).length, 'unique days');
        showLoadingSpinner(false);

    } catch (error) {
        console.error('Error generating weekly view:', error);
        showError('Failed to generate weekly view');
        showLoadingSpinner(false);
    }
}

// Generate Complete Weekly Plan (all 7 days at once)
async function generateCompleteWeeklyPlan() {
    try {
        console.log('Starting generateCompleteWeeklyPlan...');
        const dayNames = Object.keys(weeklyDietPlan);
        console.log('Days to generate:', dayNames);
        
        // Generate meals for all days in parallel
        const mealPromises = dayNames.map(async (dayName) => {
            console.log(`Checking ${dayName}:`, weeklyDietPlan[dayName].breakfast ? 'already has meals' : 'needs meals');
            if (!weeklyDietPlan[dayName].breakfast) {
                return await generateMealsForDay(dayName);
            }
        });

        await Promise.all(mealPromises);
        console.log('Complete weekly plan generated');
    } catch (error) {
        console.error('Error generating complete weekly plan:', error);
        throw error;
    }
}

// Generate meals for a specific day
async function generateMealsForDay(dayName) {
    try {
        console.log(`Generating meals for ${dayName}...`);
        const mealTypes = ['breakfast', 'lunch', 'dinner'];
        const mealPromises = mealTypes.map(async (mealType) => {
            try {
                console.log(`  Generating ${mealType} for ${dayName}...`);
                const prompt = createMealPromptForDay(dayName, mealType);
                const response = await callGeminiAPI(prompt, window.OPENAI_API_KEY);
                console.log(`  ✓ ${mealType} generated`);
                return { mealType, response };
            } catch (error) {
                console.error(`Error generating ${mealType} for ${dayName}:`, error);
                return { mealType, response: `Unable to generate ${mealType}.` };
            }
        });

        const results = await Promise.all(mealPromises);
        
        // Store meals in weeklyDietPlan for this specific day
        results.forEach(({ mealType, response }) => {
            weeklyDietPlan[dayName][mealType] = response;
        });
        
        console.log(`✓ All meals generated for ${dayName}`);

    } catch (error) {
        console.error(`Error in generateMealsForDay for ${dayName}:`, error);
    }
}

// Create Day Card for Weekly View
function createDayCard(dayName, dayMeals) {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.setAttribute('data-day', dayName);

    // Get meal content with safe fallback
    const breakfastContent = dayMeals.breakfast || 'Generating...';
    const lunchContent = dayMeals.lunch || 'Generating...';
    const dinnerContent = dayMeals.dinner || 'Generating...';

    // Extract first line from each meal (max 50 chars)
    const breakfastPreview = breakfastContent.split('\n')[0].substring(0, 50);
    const lunchPreview = lunchContent.split('\n')[0].substring(0, 50);
    const dinnerPreview = dinnerContent.split('\n')[0].substring(0, 50);

    card.innerHTML = `
        <div class="day-card-header">
            <h4>${dayName}</h4>
        </div>
        <div class="day-meals-list">
            <div class="day-meal-item">
                <strong>🌅 Breakfast:</strong>
                <p>${breakfastPreview}${breakfastContent.length > 50 ? '...' : ''}</p>
            </div>
            <div class="day-meal-item">
                <strong>🍽️ Lunch:</strong>
                <p>${lunchPreview}${lunchContent.length > 50 ? '...' : ''}</p>
            </div>
            <div class="day-meal-item">
                <strong>🌙 Dinner:</strong>
                <p>${dinnerPreview}${dinnerContent.length > 50 ? '...' : ''}</p>
            </div>
        </div>
    `;

    return card;
}

// Previous Day Navigation
function previousDay() {
    currentDate.setDate(currentDate.getDate() - 1);
    generateDailyDietPlan(currentDate);
}

// Next Day Navigation
function nextDay() {
    currentDate.setDate(currentDate.getDate() + 1);
    generateDailyDietPlan(currentDate);
}

// Regenerate Entire Weekly Plan
async function regeneratePlan() {
    try {
        showLoadingSpinner(true);

        // Reset the entire weekly plan
        Object.keys(weeklyDietPlan).forEach(day => {
            weeklyDietPlan[day] = { breakfast: null, lunch: null, dinner: null };
        });

        // Generate new complete weekly plan
        await generateCompleteWeeklyPlan();

        // Re-render the current view
        if (currentView === 'weekly') {
            await generateWeeklyView();
        } else {
            await generateDailyDietPlan(currentDate);
        }

        showLoadingSpinner(false);

    } catch (error) {
        console.error('Error regenerating plan:', error);
        showError('Failed to regenerate diet plan');
        showLoadingSpinner(false);
    }
}

// Helper: Format Date
function formatDate(date) {
    const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
}

// Helper: Get Gemini API Key from Config
function getGeminiKeyFromConfig() {
    // Try to get from window object (set by config.js)
    if (window.OPENAI_API_KEY) {
        return window.OPENAI_API_KEY;
    }

    // Try to get from localStorage as fallback
    const storedKey = localStorage.getItem('OPENAI_API_KEY');
    if (storedKey) {
        return storedKey;
    }

    return null;
}

// Helper: Show/Hide Loading Spinner
function showLoadingSpinner(show) {
    const spinner = document.querySelector('.diet-loading-spinner');
    if (spinner) {
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    }
}

// Helper: Show Error Message
function showError(message) {
    alert(message); // Simple implementation - can be enhanced with toast notifications
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
    // Give Firebase time to load (it's loaded asynchronously)
    setTimeout(initDietPage, 1000);
});

// Handle unload to prevent leaving during API calls
window.addEventListener('beforeunload', (e) => {
    const spinner = document.querySelector('.diet-loading-spinner');
    if (spinner && !spinner.classList.contains('hidden')) {
        e.preventDefault();
        e.returnValue = 'Plan generation in progress. Are you sure?';
    }
});
