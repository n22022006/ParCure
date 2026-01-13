// ===========================
// ONBOARDING MODULE
// ===========================

let currentPage = 1;
const totalPages = 5;
const uploadedFiles = {};

// Initialize onboarding form
function initOnboarding() {
    updateProgressBar();
    showFormPage(1);
    setupFileInputs();
    setupPainLevelDisplay();
}

// Form page navigation
document.getElementById('nextBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (validateCurrentPage()) {
        saveCurrentPageData();
        
        if (currentPage < totalPages) {
            currentPage++;
            showFormPage(currentPage);
            updateProgressBar();
            updateNavigationButtons();
        }
    }
});

document.getElementById('prevBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    
    if (currentPage > 1) {
        saveCurrentPageData();
        currentPage--;
        showFormPage(currentPage);
        updateProgressBar();
        updateNavigationButtons();
    }
});

// Form submission (final page)
document.getElementById('onboardingForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (validateCurrentPage()) {
        await submitOnboardingForm();
    }
});

// ===========================
// PAGE MANAGEMENT
// ===========================

function showFormPage(pageNum) {
    // Hide all pages
    document.querySelectorAll('.form-page').forEach(page => {
        page.classList.remove('active');
    });

    // Show current page
    const currentPageElement = document.getElementById(`page${pageNum}`);
    if (currentPageElement) {
        currentPageElement.classList.add('active');
        window.scrollTo(0, 0);
    }
}

function updateProgressBar() {
    const percentage = (currentPage / totalPages) * 100;
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = percentage + '%';
    }
}

function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');

    if (prevBtn) prevBtn.classList.toggle('hidden', currentPage === 1);
    if (nextBtn) nextBtn.classList.toggle('hidden', currentPage === totalPages);
    if (submitBtn) submitBtn.classList.toggle('hidden', currentPage !== totalPages);
}

// ===========================
// FORM VALIDATION
// ===========================

function validateCurrentPage() {
    const currentPageElement = document.getElementById(`page${currentPage}`);
    if (!currentPageElement) return false;

    // Get all required fields in current page
    const requiredFields = currentPageElement.querySelectorAll('[required]');
    
    for (let field of requiredFields) {
        if (field.type === 'radio') {
            // For radio buttons, check if any in the group is selected
            const radioGroup = document.querySelectorAll(`input[name="${field.name}"]`);
            const isChecked = Array.from(radioGroup).some(radio => radio.checked);
            if (!isChecked) {
                showError(`Please select an option for ${field.name}`);
                return false;
            }
        } else if (!field.value.trim()) {
            showError(`Please fill in all required fields on this page`);
            return false;
        }

        // Validate email if present
        if (field.type === 'email' && field.value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(field.value)) {
                showError('Please enter a valid email address');
                return false;
            }
        }

        // Validate phone if present
        if (field.type === 'tel' && field.value) {
            const phoneRegex = /^[\d\s\-\(\)\+]{10,}$/;
            if (!phoneRegex.test(field.value)) {
                showError('Please enter a valid phone number');
                return false;
            }
        }
    }

    return true;
}

// ===========================
// DATA MANAGEMENT
// ===========================

function saveCurrentPageData() {
    const currentPageElement = document.getElementById(`page${currentPage}`);
    if (!currentPageElement) return;

    const formData = new FormData();
    const inputs = currentPageElement.querySelectorAll('input, select, textarea');

    inputs.forEach(input => {
        if (input.name) {
            if (input.type === 'radio') {
                if (input.checked) {
                    formData.append(input.name, input.value);
                }
            } else if (input.type === 'file') {
                if (input.files.length > 0) {
                    uploadedFiles[input.name] = input.files[0];
                }
            } else {
                formData.append(input.name, input.value);
            }
        }
    });

    // Convert FormData to object for local storage/preview
    const data = Object.fromEntries(formData);
    console.log(`Page ${currentPage} data:`, data);
}

async function submitOnboardingForm() {
    if (!currentUser) {
        showError('User not authenticated');
        return;
    }

    showLoading(true);

    try {
        // Collect all form data
        const patientData = {
            personal: {
                fullName: document.querySelector('input[name="fullName"]').value,
                age: parseInt(document.querySelector('input[name="age"]').value),
                gender: document.querySelector('select[name="gender"]').value,
                phone: document.querySelector('input[name="phone"]').value,
                email: document.querySelector('input[name="email"]').value
            },
            medical: {
                condition: document.querySelector('input[name="condition"]').value,
                diagnosisDate: document.querySelector('input[name="diagnosisDate"]').value,
                medications: document.querySelector('textarea[name="medications"]').value,
                doctorName: document.querySelector('input[name="doctorName"]').value
            },
            lifestyle: {
                smoking: document.querySelector('input[name="smoking"]:checked').value,
                alcohol: document.querySelector('input[name="alcohol"]:checked').value,
                activityLevel: document.querySelector('select[name="activityLevel"]').value,
                dietType: document.querySelector('select[name="dietType"]').value
            },
            mobility: {
                painLevel: parseInt(document.querySelector('input[name="painLevel"]').value),
                affectedArea: document.querySelector('input[name="affectedArea"]').value,
                movementDifficulty: document.querySelector('textarea[name="movementDifficulty"]').value
            },
            uploads: {},
            createdAt: new Date(),
            lastUpdated: new Date()
        };

        // Upload files to Firebase Storage
        if (Object.keys(uploadedFiles).length > 0) {
            for (const [fileType, file] of Object.entries(uploadedFiles)) {
                const fileRef = firebase.storage().ref(`patients/${currentUser.uid}/${fileType}_${Date.now()}`);
                const snapshot = await fileRef.put(file);
                const downloadURL = await snapshot.ref.getDownloadURL();
                
                patientData.uploads[fileType + 'URL'] = downloadURL;
                patientData.uploads[fileType + 'Name'] = file.name;
            }
        }

        // Save to Firestore using merge to preserve any existing data
        await db.collection('patients').doc(currentUser.uid).set(patientData, { merge: true });

        console.log('Patient data saved successfully');
        showSuccess('Onboarding completed! Redirecting to dashboard...');
        
        // Reset form and navigate to dashboard
        setTimeout(() => {
            document.getElementById('onboardingForm').reset();
            currentPage = 1;
            Object.keys(uploadedFiles).forEach(key => delete uploadedFiles[key]);
            showDashboard();
            loadDashboardData();
        }, 1500);

    } catch (error) {
        console.error('Error saving patient data:', error);
        showError('Failed to save your information: ' + error.message);
    } finally {
        showLoading(false);
    }
}

// ===========================
// FILE INPUT MANAGEMENT
// ===========================

function setupFileInputs() {
    const fileInputs = ['xrayInput', 'mriInput', 'prescriptionInput'];
    
    fileInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const nameElement = document.getElementById(inputId.replace('Input', 'Name'));
                    if (nameElement) {
                        nameElement.textContent = `✓ ${file.name}`;
                        nameElement.style.color = 'var(--success)';
                    }
                    
                    // Store file name for form data
                    const fieldName = inputId.replace('Input', '');
                    uploadedFiles[fieldName] = file;
                }
            });
        }
    });
}

// ===========================
// PAIN LEVEL DISPLAY
// ===========================

function setupPainLevelDisplay() {
    const painSlider = document.querySelector('.pain-slider');
    const painValue = document.querySelector('.pain-value');

    if (painSlider && painValue) {
        painSlider.addEventListener('input', (e) => {
            painValue.textContent = e.target.value;
        });
    }
}

// Call this when showing onboarding
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('onboardingForm')) {
        initOnboarding();
    }
});
