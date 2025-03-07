import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const ordersCollection = collection(db, "orders");

// ✅ Load all orders into dropdown on page load
async function loadOrders() {
    const orderSelect = document.getElementById('orderSelect');
    orderSelect.innerHTML = '<option value="">Select an Order</option>';

    const ordersSnapshot = await getDocs(ordersCollection);

    ordersSnapshot.forEach(doc => {
        const order = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = `${order.customerName} - ${order.product} (${order.quantity})`;
        option.dataset.order = JSON.stringify({ ...order, orderId: doc.id });
        orderSelect.appendChild(option);
    });
}

// ✅ Generate invoice content for preview
function generateInvoice() {
    const selectedOption = document.getElementById('orderSelect').selectedOptions[0];

    if (!selectedOption || !selectedOption.dataset.order) {
        alert("Please select an order.");
        return;
    }

    const order = JSON.parse(selectedOption.dataset.order);
    const today = new Date().toISOString().split('T')[0];
    const invoiceNumber = `INV-${order.orderId.slice(-6)}`;

    const invoiceText = `
Beastickersco
Burnaby, BC
Phone: (604) 352-4751
Email: beastickersco@outlook.com

Invoice Number: ${invoiceNumber}
Date: ${today}

Bill To:
${order.customerName}
Contact: ${order.customerContact}

Product: ${order.product}
Quantity: ${order.quantity}
Unit Price: $${order.sellPrice.toFixed(2)}
Total Price: $${(order.sellPrice * order.quantity).toFixed(2)}

Thank you for your continued support of Beastickersco. We take pride in providing high-quality custom products tailored to your needs, and we are grateful for the opportunity to work with you. Your trust and loyalty mean everything to us, and we look forward to serving you again with more creative and personalized solutions.
    `.trim();

    document.getElementById('invoicePreview').value = invoiceText;
}

// ✅ Download invoice as Word document
function downloadInvoice() {
    const invoiceText = document.getElementById('invoicePreview').value;

    const blob = new Blob(["\ufeff" + invoiceText], {
        type: "application/msword"
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "Invoice.doc";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// ✅ Expose functions for button onclicks
window.generateInvoice = generateInvoice;
window.downloadInvoice = downloadInvoice;

// ✅ Load orders when page loads
window.onload = loadOrders;
