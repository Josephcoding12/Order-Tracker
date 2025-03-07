import { db } from "./firebase-config.js";
import {
    collection, addDoc, getDocs, doc, deleteDoc, updateDoc
} from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firestore reference
const productsCollection = collection(db, "products");

// ✅ Load all products into table
async function loadProducts() {
    const productsTable = document.getElementById("productsTable");
    productsTable.innerHTML = "";

    const productsSnapshot = await getDocs(productsCollection);

    productsSnapshot.forEach(productDoc => {
        const product = productDoc.data();

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${product.productName}</td>
            <td>$${parseFloat(product.costPrice).toFixed(2)}</td>
            <td>$${parseFloat(product.sellPrice).toFixed(2)}</td>
            <td>${product.stockQuantity}</td>
            <td>
                <button class="btn edit-btn" data-id="${productDoc.id}">Edit</button>
                <button class="btn delete-btn" data-id="${productDoc.id}">Delete</button>
            </td>
        `;
        productsTable.appendChild(row);
    });

    attachProductRowEvents();
}

// ✅ Attach Edit & Delete button events
function attachProductRowEvents() {
    document.querySelectorAll(".edit-btn").forEach(button => {
        button.addEventListener("click", () => loadProductForEdit(button.dataset.id));
    });

    document.querySelectorAll(".delete-btn").forEach(button => {
        button.addEventListener("click", async () => {
            if (confirm("Are you sure you want to delete this product?")) {
                await deleteDoc(doc(productsCollection, button.dataset.id));
                loadProducts();
            }
        });
    });
}

// ✅ Load product into form for editing
async function loadProductForEdit(productId) {
    const productRef = doc(productsCollection, productId);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
        alert("Product not found.");
        return;
    }

    const product = productSnap.data();

    document.getElementById("productId").value = productId;
    document.getElementById("productName").value = product.productName;
    document.getElementById("costPrice").value = parseFloat(product.costPrice).toFixed(2);
    document.getElementById("sellPrice").value = parseFloat(product.sellPrice).toFixed(2);
    document.getElementById("stockQuantity").value = product.stockQuantity;
}

// ✅ Handle form submission (Add/Update product)
document.getElementById("productForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const productId = document.getElementById("productId").value.trim();
    const productName = document.getElementById("productName").value.trim();
    const costPrice = parseFloat(document.getElementById("costPrice").value.trim());
    const sellPrice = parseFloat(document.getElementById("sellPrice").value.trim());
    const stockQuantity = parseInt(document.getElementById("stockQuantity").value.trim(), 10);

    if (isNaN(costPrice) || isNaN(sellPrice) || isNaN(stockQuantity)) {
        alert("Please enter valid numbers for cost price, sell price, and stock quantity.");
        return;
    }

    const productData = { productName, costPrice, sellPrice, stockQuantity };

    if (productId) {
        await updateDoc(doc(productsCollection, productId), productData);
        alert("Product updated successfully!");
    } else {
        await addDoc(productsCollection, productData);
        alert("Product added successfully!");
    }

    document.getElementById("productForm").reset();
    document.getElementById("productId").value = "";  // Clear productId after update
    loadProducts();
});

// ✅ Initial load
window.onload = () => {
    loadProducts();
};
