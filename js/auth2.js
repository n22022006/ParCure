// -------------------------------
// Firebase Config (YOUR PROJECT)
// -------------------------------
const firebaseConfig = {
  apiKey: "AIzaSyD0jDQt4Oav5ZeTU93XRdcncpyzyKhPNcc",
  authDomain: "parcure-4aecd.firebaseapp.com",
  projectId: "parcure-4aecd",
  storageBucket: "parcure-4aecd.appspot.com",
  messagingSenderId: "362740241486",
  appId: "1:362740241486:web:12e6cf3e5f3ec12c409f1f"
};

// Init Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// -------------------------------
// UI Elements
// -------------------------------
const tabSignIn = document.getElementById("tabSignIn");
const tabSignUp = document.getElementById("tabSignUp");

const signInForm = document.getElementById("signInForm");
const signUpForm = document.getElementById("signUpForm");

const messageBox = document.getElementById("messageBox");

const googleSignInBtn = document.getElementById("googleSignInBtn");
const googleSignUpBtn = document.getElementById("googleSignUpBtn");

// -------------------------------
// Helpers
// -------------------------------
function showMessage(msg, type = "error") {
  messageBox.style.color = type === "success" ? "green" : "#b91c1c";
  messageBox.textContent = msg;
}

function setLoading(form, isLoading) {
  const buttons = form.querySelectorAll("button");
  buttons.forEach(btn => btn.disabled = isLoading);
}

// -------------------------------
// Tabs Switch
// -------------------------------
tabSignIn.addEventListener("click", () => {
  tabSignIn.classList.add("active");
  tabSignUp.classList.remove("active");

  signInForm.classList.add("active");
  signUpForm.classList.remove("active");

  showMessage("");
});

tabSignUp.addEventListener("click", () => {
  tabSignUp.classList.add("active");
  tabSignIn.classList.remove("active");

  signUpForm.classList.add("active");
  signInForm.classList.remove("active");

  showMessage("");
});

// -------------------------------
// Sign In (Email/Password)
// -------------------------------
signInForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signInEmail").value.trim();
  const password = document.getElementById("signInPassword").value.trim();

  try {
    setLoading(signInForm, true);
    showMessage("Signing in...", "success");

    await auth.signInWithEmailAndPassword(email, password);

    showMessage("Login successful! Redirecting...", "success");
    window.location.href = "dashboard.html";
  } catch (err) {
    showMessage(err.message);
  } finally {
    setLoading(signInForm, false);
  }
});

// -------------------------------
// Sign Up (Email/Password)
// -------------------------------
signUpForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const name = document.getElementById("signUpName").value.trim();
  const email = document.getElementById("signUpEmail").value.trim();
  const password = document.getElementById("signUpPassword").value.trim();

  if (password.length < 6) {
    showMessage("Password must be at least 6 characters.");
    return;
  }

  try {
    setLoading(signUpForm, true);
    showMessage("Creating account...", "success");

    const userCred = await auth.createUserWithEmailAndPassword(email, password);

    // Save name in Firebase profile
    await userCred.user.updateProfile({ displayName: name });

    showMessage("Account created! Redirecting...", "success");
    // First-time signup goes straight to onboarding
    window.location.href = "onboarding-step1.html";
  } catch (err) {
    showMessage(err.message);
  } finally {
    setLoading(signUpForm, false);
  }
});

// -------------------------------
// Google Sign In
// -------------------------------
async function googleLogin() {
  try {
    showMessage("Connecting to Google...", "success");
    const result = await auth.signInWithPopup(googleProvider);
    const isNew = result && result.additionalUserInfo && result.additionalUserInfo.isNewUser;
    showMessage("Google login successful! Redirecting...", "success");
    // If new Google user, start onboarding; else go to dashboard
    window.location.href = isNew ? "onboarding-step1.html" : "dashboard.html";
  } catch (err) {
    showMessage(err.message);
  }
}

googleSignInBtn.addEventListener("click", googleLogin);
googleSignUpBtn.addEventListener("click", googleLogin);
