import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, doc, deleteDoc, updateDoc, getDoc, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firestore references
const customersCollection = collection(db, "customers");
const productsCollection = collection(db, "products");
const ordersCollection = collection(db, "orders");

let currentFilter = "All";

// ✅ Load customers into dropdown
async function loadCustomers() {
    const customerSelect = document.getElementById("customerSelect");
    customerSelect.innerHTML = '<option value="">Select Customer</option>';
    const customers = await getDocs(customersCollection);
    customers.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = data.name;
        option.dataset.contact = data.contact || '';
        customerSelect.appendChild(option);
    });

    customerSelect.addEventListener("change", () => {
        const selectedOption = customerSelect.selectedOptions[0];
        document.getElementById("customerContact").value = selectedOption.dataset.contact || "";
    });
}

// ✅ Load products into dropdown
async function loadProducts() {
    const productSelect = document.getElementById("productSelect");
    productSelect.innerHTML = '<option value="">Select Product</option>';
    const products = await getDocs(productsCollection);
    products.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = data.productName;
        option.dataset.cost = data.costPrice || 0;
        option.dataset.sell = data.sellPrice || 0;
        productSelect.appendChild(option);
    });

    productSelect.addEventListener("change", () => {
        const selectedOption = productSelect.selectedOptions[0];
        document.getElementById("costPrice").value = selectedOption.dataset.cost || 0;
        document.getElementById("sellPrice").value = selectedOption.dataset.sell || 0;
    });
}

// ✅ Add new order
document.getElementById("orderForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const fulfiller = document.getElementById("fulfiller").value;
    const customerName = document.getElementById("customerSelect").selectedOptions[0].textContent;
    const customerContact = document.getElementById("customerContact").value;
    const product = document.getElementById("productSelect").selectedOptions[0].textContent;
    const productId = document.getElementById("productSelect").value;
    const quantity = parseInt(document.getElementById("quantity").value) || 0;
    const orderDate = document.getElementById("orderDate").value;
    const costPrice = parseFloat(document.getElementById("costPrice").value) || 0;
    const sellPrice = parseFloat(document.getElementById("sellPrice").value) || 0;
    const profit = (sellPrice - costPrice) * quantity;

    const order = {
        fulfiller, customerName, customerContact, product, productId, quantity, orderDate, costPrice, sellPrice, profit, status: "Not Started"
    };

    await addDoc(ordersCollection, order);
    alert("Order added successfully!");
    document.getElementById("orderForm").reset();
    loadOrders();
});

// ✅ Load orders into table with filtering
async function loadOrders() {
    const tableBody = document.getElementById("ordersTable");
    tableBody.innerHTML = "";

    let queryRef = ordersCollection;
    if (currentFilter !== "All") {
        queryRef = query(ordersCollection, where("status", "==", currentFilter));
    }

    const ordersSnapshot = await getDocs(queryRef);

    ordersSnapshot.forEach(orderDoc => {
        const data = orderDoc.data();
        const row = document.createElement("tr");
        row.dataset.id = orderDoc.id;

        row.innerHTML = `
            <td>${data.fulfiller}</td>
            <td>${data.customerName}</td>
            <td>${data.customerContact}</td>
            <td>${data.product}</td>
            <td>${data.quantity}</td>
            <td>$${data.costPrice.toFixed(2)}</td>
            <td>$${data.sellPrice.toFixed(2)}</td>
            <td>$${(data.sellPrice * data.quantity).toFixed(2)}</td>
            <td>$${data.profit.toFixed(2)}</td>
            <td>
                <select class="statusDropdown" data-productid="${data.productId}" data-quantity="${data.quantity}">
                    <option ${data.status === "Not Started" ? "selected" : ""}>Not Started</option>
                    <option ${data.status === "Started" ? "selected" : ""}>Started</option>
                    <option ${data.status === "Completed" ? "selected" : ""}>Completed</option>
                </select>
            </td>
            <td>
                <button class="btn edit-btn">Edit</button>
                <button class="btn delete-btn">Delete</button>
            </td>
        `;

        tableBody.appendChild(row);
    });

    attachRowEventListeners();
}

// ✅ Attach listeners to each row
function attachRowEventListeners() {
    document.querySelectorAll(".edit-btn").forEach(btn => btn.addEventListener("click", () => enterEditMode(btn.closest("tr"))));

    document.querySelectorAll(".delete-btn").forEach(btn => btn.addEventListener("click", async () => {
        const orderId = btn.closest("tr").dataset.id;
        if (confirm("Delete this order?")) {
            await deleteDoc(doc(ordersCollection, orderId));
            loadOrders();
        }
    }));

    document.querySelectorAll(".statusDropdown").forEach(dropdown => {
        dropdown.addEventListener("change", async (e) => {
            const row = e.target.closest("tr");
            const orderId = row.dataset.id;
            const status = e.target.value;
            await updateDoc(doc(ordersCollection, orderId), { status });
            loadOrders();
        });
    });
}

// ✅ Edit row logic
function enterEditMode(row) {
    const cells = row.children;
    const inputs = [
        `<input value="${cells[0].innerText}">`,
        `<input value="${cells[1].innerText}">`,
        `<input value="${cells[2].innerText}">`,
        `<input value="${cells[3].innerText}">`,
        `<input type="number" value="${parseInt(cells[4].innerText)}">`,
        `<input type="number" value="${parseFloat(cells[5].innerText.replace("$", ""))}">`,
        `<input type="number" value="${parseFloat(cells[6].innerText.replace("$", ""))}">`
    ];

    for (let i = 0; i < inputs.length; i++) {
        cells[i].innerHTML = inputs[i];
    }

    cells[9].innerHTML = `
        <button class="btn save-btn">Save</button>
        <button class="btn cancel-btn">Cancel</button>
    `;

    row.querySelector(".save-btn").addEventListener("click", () => saveRow(row));
    row.querySelector(".cancel-btn").addEventListener("click", loadOrders);
}

// ✅ Save row data back to Firestore
async function saveRow(row) {
    const orderId = row.dataset.id;
    const inputs = row.querySelectorAll("input");

    const updatedData = {
        fulfiller: inputs[0].value,
        customerName: inputs[1].value,
        customerContact: inputs[2].value,
        product: inputs[3].value,
        quantity: parseInt(inputs[4].value),
        costPrice: parseFloat(inputs[5].value),
        sellPrice: parseFloat(inputs[6].value),
        profit: (parseFloat(inputs[6].value) - parseFloat(inputs[5].value)) * parseInt(inputs[4].value),
    };

    await updateDoc(doc(ordersCollection, orderId), updatedData);
    loadOrders();
}

// ✅ Filter dropdown listener
document.getElementById("orderFilter").addEventListener("change", (e) => {
    currentFilter = e.target.value;
    loadOrders();
});

// ✅ Initial load
window.onload = () => {
    loadCustomers();
    loadProducts();
    loadOrders();
};
