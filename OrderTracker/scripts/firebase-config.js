// Import Firebase SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";  // ✅ Needed for auth support

// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyD5LDTA9ifKBuLWMIK-Alp0WI8rFIUe7sE",
    authDomain: "ordertracker-10442.firebaseapp.com",
    databaseURL: "https://ordertracker-10442-default-rtdb.firebaseio.com",
    projectId: "ordertracker-10442",
    storageBucket: "ordertracker-10442.appspot.com",
    messagingSenderId: "998090599434",
    appId: "1:998090599434:web:d4b976f22d6e132745c3f3",
    measurementId: "G-2VHFPRWSKF"
};

// ✅ Initialize Firebase App (needed for both Firestore & Auth)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);  // ✅ Authentication system initialized

// ✅ Export all 3 so any script can use them
export { db, auth, app }; 
