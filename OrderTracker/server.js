const express = require('express');
const stripe = require('stripe')('sk_test_51Qzt7mPdA8XRvtsZVWCxjTLSYb6bZ56tzMla5Etmey2DxEbirPivSzeEbJSC8JZBtiyXbTjGAZaKMB8B43sB85zw00BCKFhPe4');
const admin = require('firebase-admin');
const cors = require('cors');
const bodyParser = require('body-parser');

const serviceAccount = require('./path-to-your-firebase-adminsdk.json');  // Replace with your actual path

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const YOUR_DOMAIN = 'http://localhost:4242';

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Create Checkout Session
app.post('/create-checkout-session', async (req, res) => {
    const prices = await stripe.prices.list({
        lookup_keys: [req.body.lookup_key],
        expand: ['data.product'],
    });

    const session = await stripe.checkout.sessions.create({
        billing_address_collection: 'auto',
        line_items: [
            {
                price: prices.data[0].id,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: `${YOUR_DOMAIN}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });

    res.redirect(303, session.url);
});

// ✅ Create Billing Portal Session
app.post('/create-portal-session', async (req, res) => {
    const { session_id } = req.body;

    const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

    const portalSession = await stripe.billingPortal.sessions.create({
        customer: checkoutSession.customer,
        return_url: YOUR_DOMAIN,
    });

    res.redirect(303, portalSession.url);
});

// ✅ Check Subscription Status (called from client.js after login)
app.post('/check-subscription', async (req, res) => {
    const { stripeCustomerId } = req.body;

    try {
        const subscriptions = await stripe.subscriptions.list({
            customer: stripeCustomerId,
            status: 'active',
        });

        res.json({ active: subscriptions.data.length > 0 });
    } catch (error) {
        console.error('Failed to check subscription:', error);
        res.status(500).json({ error: 'Failed to check subscription status' });
    }
});

// ✅ Get User Details (client-side fetch after login)
app.get('/get-user-details', async (req, res) => {
    const { email } = req.query;

    try {
        const userDoc = await db.collection('users').doc(email).get();

        if (!userDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(userDoc.data());
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// ✅ Webhook Handling (Stripe subscription events)
const endpointSecret = 'whsec_12345';  // Replace with your actual webhook secret

app.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
    let event = req.body;

    if (endpointSecret) {
        const signature = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
        } catch (err) {
            console.error('Webhook signature verification failed.', err.message);
            return res.sendStatus(400);
        }
    }

    handleWebhookEvent(event);

    res.sendStatus(200);
});

function handleWebhookEvent(event) {
    const subscription = event.data.object;

    switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
            updateUserSubscription(subscription);
            break;
        case 'customer.subscription.deleted':
            deactivateUserSubscription(subscription);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
}

// ✅ Link Stripe Subscription to Firebase User
async function updateUserSubscription(subscription) {
    const customer = await stripe.customers.retrieve(subscription.customer);

    const email = customer.email;

    const userRef = db.collection('users').doc(email);
    await userRef.set({
        stripeCustomerId: subscription.customer,
        subscriptionStatus: subscription.status,
        subscriptionPlan: subscription.items.data[0].plan.nickname,
        subscriptionStart: subscription.start_date,
        subscriptionEnd: subscription.current_period_end
    }, { merge: true });

    console.log(`User ${email} subscription updated.`);
}

// ✅ Deactivate Subscription in Firebase if canceled
async function deactivateUserSubscription(subscription) {
    const customer = await stripe.customers.retrieve(subscription.customer);

    const email = customer.email;

    const userRef = db.collection('users').doc(email);
    await userRef.update({
        subscriptionStatus: 'canceled'
    });

    console.log(`User ${email} subscription canceled.`);
}

app.listen(4242, () => console.log('Stripe server running on http://localhost:4242'));
