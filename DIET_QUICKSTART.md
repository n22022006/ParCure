# ParCure Diet Feature - Quick Start Guide

## 🎯 Getting Started in 3 Steps

### Step 1: Get Your Gemini API Key (2 minutes)
```
1. Open: https://aistudio.google.com/app/apikey
2. Click "Get API Key" (upper right button)
3. Select "Create API key in existing project" or create new
4. Copy the API key to clipboard
5. Keep this tab open or save the key somewhere safe
```

### Step 2: Update Configuration (1 minute)
```
1. Open: js/config.js
2. Find this line:
   window.GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
3. Replace YOUR_GEMINI_API_KEY_HERE with your actual key
4. Save the file
```

**Example:**
```javascript
// BEFORE:
window.GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

// AFTER:
window.GEMINI_API_KEY = "AIzaSyDxK3L_jR2mN4pQ5sT6uV7wX8yZ9abc-DEF";
```

### Step 3: Test It Out (2 minutes)
```
1. Load the app in browser (start from index.html)
2. Login with your account
3. Go to Dashboard
4. Click the "Diet" action block
5. Wait for personalized meal plan to generate
6. Browse daily and weekly views
```

---

## 🔍 How to Verify It's Working

### Loading Spinner
- You should see "Generating your personalized diet plan..." message
- This should last 3-5 seconds while API generates content

### Meal Cards Appear With:
- Recommended Foods
- Ingredients
- Preparation Instructions
- Nutritional Benefits
- Calorie & Macronutrient Info
- Health Tips

### Nutrition Summary Shows:
- Daily Calories (e.g., "~2000-2500")
- Protein (e.g., "~50-60g")
- Carbs (e.g., "~200-250g")
- Fats (e.g., "~60-70g")

---

## ❌ Troubleshooting

### "Error: Gemini API key not configured"
**Solution:**
1. Check that you updated js/config.js correctly
2. Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R on Mac)
3. Check browser console for more details (F12)

### "Generating breakfast plan..." stays forever
**Solution:**
1. Check internet connection
2. Verify API key is correct
3. Check browser console (F12) for error messages
4. Try refreshing the page

### "Unexpected API response format"
**Solution:**
1. Verify API key is from Google AI Studio (not Firebase key)
2. Check if API quota has been exceeded (free tier limit)
3. Try a different meal type or regenerate

### Blank meal cards with no content
**Solution:**
1. Wait a few more seconds (API is slow sometimes)
2. Click "Regenerate Plan" button
3. Check browser console for JavaScript errors
4. Verify config.js was saved properly

---

## 📝 FAQ

### Q: Is Gemini API free?
**A:** Yes! Google provides free API access with quota limits (60 requests/minute). Perfect for development.

### Q: Where do I get the API key?
**A:** 
1. Go to https://aistudio.google.com/app/apikey
2. Click "Get API Key"
3. It will automatically create one

### Q: Can I use Firebase API key instead?
**A:** No, you need a Gemini API key. They're different:
- **Firebase API Key**: For Firebase services (auth, database)
- **Gemini API Key**: For AI text generation

### Q: What happens when I click "Regenerate Plan"?
**A:** 
- Deletes cached meal plan for that day
- Calls Gemini API again
- Generates completely new meal suggestions
- Takes 3-5 seconds

### Q: Can I use this without internet?
**A:** No, Gemini API requires internet connection for generating plans.

### Q: Will this work on mobile?
**A:** Yes! The diet page is fully responsive for mobile and tablet devices.

### Q: How does it know what meals to suggest?
**A:** It reads your medical condition from the onboarding form you completed and generates meals tailored to that condition.

---

## 🧪 Testing With Different Conditions

The diet plan generation works for ANY medical condition in the database:

### Common Conditions to Test:
- "Diabetes Management"
- "Hypertension Control"
- "Heart Disease Recovery"
- "Arthritis Management"
- "Weight Loss"
- "Thyroid Disorder"
- "General Health"

The Gemini API will generate appropriate meal suggestions for each condition.

---

## 📱 Browser Requirements

- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Internet connection
- Cookies enabled (for Firebase)

---

## 🔐 Security Tips

1. **Never commit your actual API key to Git**
   - Use .gitignore for config.js
   - Use environment variables in production

2. **For Production Deployment:**
   - Move API key to backend (.env file)
   - Call Gemini API from your server, not client
   - Implement rate limiting
   - Monitor API usage and costs

3. **Share your project safely:**
   - Before sharing, replace your API key with placeholder
   - Use .gitignore to prevent accidental commits
   - Team members should get their own API keys

---

## 📞 Support Resources

1. **Google AI Studio Help:** https://aistudio.google.com/
2. **Gemini API Docs:** https://ai.google.dev/
3. **ParCure README:** See README.md in project root
4. **Diet Feature Guide:** See DIET_FEATURE.md

---

## ✅ Checklist Before Going Live

- [ ] Gemini API key obtained and stored
- [ ] js/config.js updated with API key
- [ ] Browser cache cleared
- [ ] Tested diet feature with your account
- [ ] Verified meal plans display correctly
- [ ] Tested date navigation
- [ ] Tested weekly view
- [ ] Tested regenerate button
- [ ] Tested on mobile device

---

**You're all set! 🎉 Enjoy personalized meal planning!**

Need help? Check the troubleshooting section above or review the full DIET_FEATURE.md guide.
