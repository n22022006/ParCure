# ParCure Diet Plan Feature - Implementation Guide

## ✅ Feature Completed

The diet plan feature has been fully implemented with:
- **Daily personalized meal plans** based on user's medical condition
- **Weekly overview** of 7-day meal plans
- **AI-powered generation** using Google's Gemini API
- **Nutrition tracking** with calorie and macronutrient summaries
- **Date navigation** to browse past and future plans
- **Plan regeneration** for fresh suggestions anytime

---

## 📁 Files Created/Modified

### 1. **diet.html** (Diet Page)
- **Location**: `c:\Users\DELL\Documents\ParCure\diet.html`
- **Purpose**: Main UI for diet plan display
- **Features**:
  - Header with toggle buttons (Daily/Weekly)
  - Condition display from database
  - Regenerate plan button
  - Daily view with meal cards (Breakfast, Lunch, Dinner, Snacks, Hydration)
  - Date navigation (Previous/Next day)
  - Nutrition summary grid
  - Weekly grid for 7-day overview
  - Loading spinner
- **Dependencies**: Firebase, css/diet.css, js/diet.js

### 2. **css/diet.css** (Diet Styling)
- **Location**: `c:\Users\DELL\Documents\ParCure\css\diet.css`
- **Purpose**: Complete styling for diet page
- **Features**:
  - Purple theme consistent with app branding
  - Responsive design (mobile, tablet, desktop)
  - Meal card styling with hover effects
  - Date selector styling
  - Nutrition summary grid
  - Weekly day cards
  - Loading spinner animation
  - Smooth transitions and animations

### 3. **js/diet.js** (Diet Logic)
- **Location**: `c:\Users\DELL\Documents\ParCure\js\diet.js`
- **Purpose**: Core diet feature functionality
- **Key Functions**:
  - `initDietPage()` - Initialize page and setup listeners
  - `loadUserCondition()` - Fetch medical condition from Firestore
  - `generateDailyDietPlan(date)` - Generate meal plan for a specific date
  - `generateMealPlans(dateString)` - Generate individual meals using Gemini
  - `callGeminiAPI(prompt, apiKey)` - Call Gemini API
  - `switchView(view)` - Switch between daily/weekly views
  - `generateWeeklyView()` - Create 7-day overview
  - `previousDay()` / `nextDay()` - Navigate between dates
  - `regeneratePlan()` - Re-generate current day's plan

### 4. **js/config.js** (Configuration)
- **Updated**: Added Gemini API key configuration
- **New Section**: 
```javascript
// Gemini API Configuration
window.GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
```

### 5. **dashboard.html** (Dashboard Integration)
- **Updated**: Added diet block click handler to navigate to diet.html
```javascript
const dietBlock = document.getElementById('dietBlock');
if (dietBlock) {
    dietBlock.addEventListener('click', () => {
        window.location.href = 'diet.html';
    });
}
```

### 6. **README.md** (Documentation)
- **Updated**: 
  - Added diet feature to features list
  - Added Gemini API setup instructions
  - Updated project structure
  - Updated user flow
  - Added AI diet plan section explaining integration

---

## 🔧 Setup Instructions

### Step 1: Get Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Click "Get API Key" or create a new one
3. Copy your API key (free tier available with quota limits)

### Step 2: Update Configuration
1. Open `js/config.js`
2. Find: `window.GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";`
3. Replace `YOUR_GEMINI_API_KEY_HERE` with your actual API key

### Step 3: Ensure Medical Condition is Set
The diet feature reads the user's medical condition from Firestore. Make sure:
1. User completes the onboarding form
2. Medical condition is saved in Firebase (typically in the "Medical Condition" page of onboarding)

### Step 4: Test the Feature
1. Log in to the app
2. Navigate to Dashboard
3. Click the "Diet" action block
4. Wait for diet plan to generate
5. Browse daily and weekly views
6. Use date navigation to see different days

---

## 📊 How It Works

### User Flow:
```
User clicks Diet block → Diet page loads
    ↓
Fetch user's medical condition from Firestore
    ↓
Generate meal plans using Gemini API
    ↓
Display in daily/weekly views
    ↓
User can navigate dates or regenerate plans
```

### Gemini API Call:
```
Prompt: "Based on medical condition [condition], create [meal type] with:
1. Recommended foods
2. Ingredients
3. Preparation method
4. Nutritional benefits
5. Nutrition info (calories, protein, carbs, fats)
6. Health tips"
    ↓
Gemini responds with detailed meal information
    ↓
Parse response and display in meal cards
```

---

## 🎯 Features in Detail

### Daily View
- **Meal Cards**: Each meal type (Breakfast, Lunch, Dinner, Snacks, Hydration) has a card
- **Content**: Includes recommended foods, ingredients, preparation, nutritional info
- **Date Navigation**: Navigate between different days
- **Nutrition Summary**: Shows daily totals for calories, protein, carbs, fats

### Weekly View
- **7-Day Grid**: Shows breakfast, lunch, dinner for each day of the week
- **Responsive**: Adapts to different screen sizes
- **Quick Overview**: See meal plans for entire week at a glance

### Regenerate Button
- **Fresh Suggestions**: Users can regenerate plans for current day
- **AI Variation**: Gemini provides different meal suggestions each time
- **Loading State**: Shows spinner during generation

---

## 🔍 Troubleshooting

### Diet plans not generating?
1. **Check API Key**: Verify Gemini API key is set in config.js
2. **Check Firebase**: Ensure user's medical condition is saved in Firestore
3. **Check Browser Console**: Look for error messages with `Ctrl+Shift+J` (Chrome)
4. **Network Error**: Ensure internet connection is stable

### Text not visible?
1. Check CSS file is loaded (diet.css)
2. Verify browser zoom is 100%
3. Clear browser cache and reload

### Plans showing placeholder text?
1. Wait for API response (can take 3-5 seconds)
2. Check Gemini API key validity
3. Verify API quota hasn't been exceeded

---

## 📱 Responsive Design

The diet feature is fully responsive:
- **Mobile (480px)**: Single column layout, stacked elements
- **Tablet (768px)**: Optimized spacing, readable text
- **Desktop (1000px+)**: Multi-column layouts where appropriate

---

## 🔐 Security Notes

1. **API Key Protection**: Never commit actual API keys to version control
2. **Firestore Rules**: Ensure only authenticated users can access their own data
3. **Data Privacy**: Medical information is stored securely in Firestore
4. **HTTPS**: Use HTTPS in production for secure API calls

### Production Recommendations:
- Move Gemini API key to backend environment variables
- Implement API request rate limiting
- Cache meal plans to reduce API calls
- Add request validation and sanitization
- Monitor API usage and costs

---

## 🚀 Future Enhancements

Possible improvements:
- [ ] Save favorite meal plans
- [ ] User-customizable dietary preferences
- [ ] Allergen filtering
- [ ] Recipe details and cooking videos
- [ ] Shopping list generation
- [ ] Meal prep recommendations
- [ ] Integration with nutrition tracking apps
- [ ] Historical meal plan archive
- [ ] Offline access to cached plans

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the README.md for general setup help
3. Check browser console for error messages
4. Verify all files are properly linked in diet.html

---

**Status**: ✅ Implementation Complete - Ready for Testing

**Last Updated**: 2024
**Feature Version**: 1.0
