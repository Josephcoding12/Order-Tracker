import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firestore reference
const customersCollection = collection(db, "customers");

// Initial sort and filter settings
let currentSort = "name_asc";
let searchQuery = "";

// ✅ Load all customers into table
async function loadCustomers() {
    const tableBody = document.getElementById("customersTable");
    tableBody.innerHTML = "";

    let customersQuery = customersCollection;

    const snapshot = await getDocs(customersQuery);
    let customers = [];

    snapshot.forEach(doc => {
        let data = doc.data();
        data.id = doc.id;  // Store Firestore doc ID in data object for editing/deleting.
        customers.push(data);
    });

    // 🔎 Filter - Search by name or business
    if (searchQuery) {
        customers = customers.filter(customer => 
            customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (customer.business && customer.business.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }

    // 🔃 Sort Customers
    customers.sort((a, b) => {
        switch (currentSort) {
            case "name_asc": return a.name.localeCompare(b.name);
            case "name_desc": return b.name.localeCompare(a.name);
            case "date_newest": return (b.dateAdded || 0) - (a.dateAdded || 0);
            case "date_oldest": return (a.dateAdded || 0) - (b.dateAdded || 0);
        }
    });

    // 📝 Render table rows
    customers.forEach(customer => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${customer.name}</td>
            <td>${customer.contact}</td>
            <td>${customer.email || ''}</td>
            <td>${customer.phone || ''}</td>
            <td>${customer.business || ''}</td>
            <td>${new Date(customer.dateAdded || Date.now()).toLocaleDateString()}</td>
            <td>
                <button class="btn edit-btn" data-id="${customer.id}">Edit</button>
                <button class="btn delete-btn" data-id="${customer.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    attachRowEventListeners();
}

// ✅ Attach Edit and Delete button handlers
function attachRowEventListeners() {
    document.querySelectorAll(".edit-btn").forEach(btn => {
        btn.addEventListener("click", () => enterEditMode(btn.closest("tr"), btn.dataset.id));
    });

    document.querySelectorAll(".delete-btn").forEach(btn => {
        btn.addEventListener("click", async () => {
            if (confirm("Are you sure you want to delete this customer?")) {
                await deleteDoc(doc(customersCollection, btn.dataset.id));
                loadCustomers();
            }
        });
    });
}

// ✅ Enter Edit Mode (Row becomes editable inputs)
function enterEditMode(row, customerId) {
    const cells = row.children;

    const originalData = {
        name: cells[0].innerText,
        contact: cells[1].innerText,
        email: cells[2].innerText,
        phone: cells[3].innerText,
        business: cells[4].innerText
    };

    row.innerHTML = `
        <td><input type="text" value="${originalData.name}"></td>
        <td><input type="text" value="${originalData.contact}"></td>
        <td><input type="email" value="${originalData.email}"></td>
        <td><input type="tel" value="${originalData.phone}"></td>
        <td><input type="text" value="${originalData.business}"></td>
        <td>${cells[5].innerText}</td>  <!-- Date doesn't change -->
        <td>
            <button class="btn save-btn">Save</button>
            <button class="btn cancel-btn">Cancel</button>
        </td>
    `;

    row.querySelector(".save-btn").addEventListener("click", () => saveCustomer(row, customerId));
    row.querySelector(".cancel-btn").addEventListener("click", loadCustomers);
}

// ✅ Save Updated Customer to Firestore
async function saveCustomer(row, customerId) {
    const inputs = row.querySelectorAll("input");

    const updatedCustomer = {
        name: inputs[0].value.trim(),
        contact: inputs[1].value.trim(),
        email: inputs[2].value.trim() || null,
        phone: inputs[3].value.trim() || null,
        business: inputs[4].value.trim() || null,
        dateAdded: Date.now()  // Keep existing dateAdded in Firestore, do not overwrite.
    };

    await updateDoc(doc(customersCollection, customerId), updatedCustomer);
    loadCustomers();
}

// ✅ Add New Customer
document.getElementById("customerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const newCustomer = {
        name: document.getElementById("customerName").value.trim(),
        contact: document.getElementById("customerContact").value.trim(),
        email: document.getElementById("customerEmail").value.trim() || null,
        phone: document.getElementById("customerPhone").value.trim() || null,
        business: document.getElementById("customerBusiness").value.trim() || null,
        dateAdded: Date.now()  // Timestamp added for sorting
    };

    await addDoc(customersCollection, newCustomer);
    document.getElementById("customerForm").reset();
    loadCustomers();
});

// ✅ Search Handler
document.getElementById("customerSearch").addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    loadCustomers();
});

// ✅ Sort Handler
document.getElementById("customerSort").addEventListener("change", (e) => {
    currentSort = e.target.value;
    loadCustomers();
});

// ✅ Initial Load
window.onload = loadCustomers;
