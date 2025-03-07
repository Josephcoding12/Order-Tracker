// client.js
document.addEventListener('DOMContentLoaded', async () => {
    let searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('session_id')) {
        const session_id = searchParams.get('session_id');
        document.getElementById('session-id').setAttribute('value', session_id);
    }
});

// Function to check subscription status after login
async function checkSubscription(email) {
    const userDetails = await fetch(`/get-user-details?email=${encodeURIComponent(email)}`);
    const userData = await userDetails.json();

    if (userData.error) {
        alert("User not found in the system. Please contact support.");
        window.location.href = 'subscription.html';
        return;
    }

    if (!userData.stripeCustomerId) {
        alert("No subscription found. Please subscribe to access the system.");
        window.location.href = 'subscription.html';
        return;
    }

    const subCheck = await fetch('/check-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stripeCustomerId: userData.stripeCustomerId })
    });

    const subData = await subCheck.json();

    if (!subData.active) {
        alert("Subscription is inactive. Please subscribe to continue.");
        window.location.href = 'subscription.html';
    } else {
        window.location.href = 'dashboard.html';
    }
}

// Example usage (after Firebase login success):
// checkSubscription(user.email);  // Call this after successful login
