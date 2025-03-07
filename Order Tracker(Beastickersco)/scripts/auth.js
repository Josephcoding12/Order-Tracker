import { getAuth, signInWithEmailAndPassword, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const auth = getAuth();

// ✅ Login Function
function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorMessage = document.getElementById('errorMessage');

    errorMessage.textContent = '';

    if (!email || !password) {
        errorMessage.textContent = 'Please enter both email and password.';
        return;
    }

    signInWithEmailAndPassword(auth, email, password)
        .then(() => {
            // ✅ Redirect to dashboard after login
            window.location.href = 'dashboard.html';
        })
        .catch((error) => {
            errorMessage.textContent = 'Login failed: ' + error.message;
        });
}

// ✅ Auto-redirect if already logged in
onAuthStateChanged(auth, (user) => {
    if (user) {
        window.location.href = 'dashboard.html';
    }
});

// ✅ Expose function for HTML button onclick
window.login = login;
