import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

document.getElementById("checkoutForm").addEventListener("submit", async function(e) {
    e.preventDefault();  // Prevent default form submission

    const fullName = document.getElementById("fullName").value.trim();
    const email = document.getElementById("email").value.trim();
    const businessName = document.getElementById("businessName").value.trim();
    const password = document.getElementById("password").value.trim();
    const confirmPassword = document.getElementById("confirmPassword").value.trim();

    if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
    }

    const auth = getAuth();

    try {
        // Create Firebase User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log("User Created:", user);

        // Send to Stripe Checkout
        const response = await fetch("/create-checkout-session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email, lookup_key: "bea_ordertracker_monthly_plan" })
        });

        const session = await response.json();
        window.location.href = session.url;  // Redirect to Stripe Checkout
    } catch (error) {
        alert("Error: " + error.message);
    }
});
