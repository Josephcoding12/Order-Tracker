import { db } from "./firebase-config.js";
import { collection, getDocs, getDoc, updateDoc, doc, addDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const productsCollection = collection(db, "products");
const restockLogCollection = collection(db, "restock_log");

// ✅ Load all products and display inventory table
async function loadInventory() {
    const tableBody = document.getElementById('inventoryTable');
    tableBody.innerHTML = '';

    const snapshot = await getDocs(productsCollection);
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const row = document.createElement('tr');

        if (data.stockQuantity < 10) {
            row.classList.add('low-stock');
        }

        row.innerHTML = `
            <td>${data.productName}</td>
            <td>${data.stockQuantity}</td>
            <td><input type="number" class="restockInput" data-id="${docSnap.id}" min="1"></td>
            <td><input type="number" class="decreaseInput" data-id="${docSnap.id}" min="1"></td>
            <td><input type="text" class="reasonInput" data-id="${docSnap.id}" placeholder="Reason"></td>
            <td>
                <button class="btn update-btn" data-id="${docSnap.id}" data-name="${data.productName}">Restock</button>
                <button class="btn decrease-btn" data-id="${docSnap.id}" data-name="${data.productName}">Waste</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.update-btn').forEach(button => {
        button.addEventListener('click', () => adjustStock(button.dataset.id, button.dataset.name, 'Restock'));
    });

    document.querySelectorAll('.decrease-btn').forEach(button => {
        button.addEventListener('click', () => adjustStock(button.dataset.id, button.dataset.name, 'Waste'));
    });

    loadRestockLog();
}

// ✅ Adjust stock and log to Firestore
async function adjustStock(productId, productName, actionType) {
    const inputClass = actionType === 'Restock' ? '.restockInput' : '.decreaseInput';
    const input = document.querySelector(`${inputClass}[data-id="${productId}"]`);
    const reasonInput = document.querySelector(`.reasonInput[data-id="${productId}"]`);

    const adjustmentAmount = parseInt(input.value) || 0;
    const reason = reasonInput.value.trim() || "N/A";

    if (adjustmentAmount <= 0) {
        alert('Please enter a valid quantity.');
        return;
    }

    const productRef = doc(productsCollection, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
        alert('Product not found!');
        return;
    }

    const productData = productSnap.data();
    const currentStock = productData.stockQuantity || 0;

    let newStock = actionType === 'Restock'
        ? currentStock + adjustmentAmount
        : currentStock - adjustmentAmount;

    newStock = Math.max(newStock, 0);  // No negative stock

    await updateDoc(productRef, { stockQuantity: newStock });

    await addDoc(restockLogCollection, {
        timestamp: new Date().toISOString(),
        productName: productName,
        quantity: actionType === 'Restock' ? adjustmentAmount : -adjustmentAmount,
        type: actionType,
        reason: reason,
        user: "Admin"  // This can later be dynamic when login system is added
    });

    alert(`${actionType} recorded successfully. New stock: ${newStock}`);
    loadInventory();
}

// ✅ Load restock & waste history log
async function loadRestockLog() {
    const tableBody = document.getElementById('restockLogTable');
    tableBody.innerHTML = '';

    const snapshot = await getDocs(restockLogCollection);
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const row = `
            <tr>
                <td>${new Date(data.timestamp).toLocaleString()}</td>
                <td>${data.productName}</td>
                <td>${data.type}</td>
                <td>${data.quantity}</td>
                <td>${data.reason}</td>
                <td>${data.user}</td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

// ✅ Initial Page Load
window.onload = loadInventory;
