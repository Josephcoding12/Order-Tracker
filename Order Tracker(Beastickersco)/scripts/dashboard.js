import { db } from "./firebase-config.js";
import { collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firestore Collections
const ordersCollection = collection(db, "orders");
const productsCollection = collection(db, "products");
const expensesCollection = collection(db, "expenses");

// Load Dashboard Data
async function loadDashboard() {
    let totalOrders = 0, totalRevenue = 0, totalProfit = 0, totalExpenses = 0;
    let orderStatusCounts = { "Not Started": 0, "Started": 0, "Completed": 0 };
    let lowStockProducts = [];

    // Load Orders
    const ordersSnapshot = await getDocs(ordersCollection);
    totalOrders = ordersSnapshot.size;

    let recentOrdersHTML = "";
    ordersSnapshot.forEach(orderDoc => {
        const order = orderDoc.data();
        const revenue = (order.sellPrice || 0) * (order.quantity || 0);
        const cost = (order.costPrice || 0) * (order.quantity || 0);
        const profit = revenue - cost;

        totalRevenue += revenue;
        totalProfit += profit;
        orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1;

        // Only show last 5 orders
        if (recentOrdersHTML.split("<tr>").length <= 6) {
            recentOrdersHTML += `
                <tr>
                    <td>${order.customerName}</td>
                    <td>${order.product}</td>
                    <td>${order.quantity}</td>
                    <td>${order.status}</td>
                </tr>
            `;
        }
    });

    // Load Expenses
    const expensesSnapshot = await getDocs(expensesCollection);
    expensesSnapshot.forEach(expense => {
        totalExpenses += parseFloat(expense.data().amount || 0);
    });

    // Load Products & Check Low Stock
    const productsSnapshot = await getDocs(productsCollection);
    productsSnapshot.forEach(productDoc => {
        const product = productDoc.data();
        if (product.stockQuantity < 10) {
            lowStockProducts.push(product.productName);
        }
    });

    // Update DOM
    document.getElementById("totalOrders").innerText = totalOrders;
    document.getElementById("totalRevenue").innerText = `$${totalRevenue.toFixed(2)}`;
    document.getElementById("totalProfit").innerText = `$${totalProfit.toFixed(2)}`;
    document.getElementById("totalExpenses").innerText = `$${totalExpenses.toFixed(2)}`;
    document.getElementById("netProfit").innerText = `$${(totalProfit - totalExpenses).toFixed(2)}`;
    document.getElementById("recentOrders").innerHTML = recentOrdersHTML;
    document.getElementById("lowStockList").innerHTML = lowStockProducts.map(item => `<li class="low-stock">${item}</li>`).join("");

    // Load Orders In Progress (Step 1 Feature)
    await loadOrdersStarted();

    // Draw Order Status Chart
    drawChart(orderStatusCounts);
}

// ✅ New Function: Load "Orders Started"
async function loadOrdersStarted() {
    const ordersStartedContainer = document.getElementById("ordersStarted");
    ordersStartedContainer.innerHTML = "";  // Clear any existing content

    const startedOrdersQuery = query(ordersCollection, where("status", "==", "Started"));
    const startedOrdersSnapshot = await getDocs(startedOrdersQuery);

    if (startedOrdersSnapshot.empty) {
        ordersStartedContainer.innerHTML = "<p>No orders in progress.</p>";
        return;
    }

    let startedOrdersHTML = `
        <table border="1" width="100%" style="margin-bottom: 15px;">
            <thead>
                <tr>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Quantity</th>
                </tr>
            </thead>
            <tbody>
    `;

    startedOrdersSnapshot.forEach(orderDoc => {
        const order = orderDoc.data();
        startedOrdersHTML += `
            <tr>
                <td>${order.customerName}</td>
                <td>${order.product}</td>
                <td>${order.quantity}</td>
            </tr>
        `;
    });

    startedOrdersHTML += `
            </tbody>
        </table>
    `;

    ordersStartedContainer.innerHTML = startedOrdersHTML;
}

// Draw Chart using Chart.js
function drawChart(data) {
    const ctx = document.getElementById("orderStatusChart").getContext("2d");
    new Chart(ctx, {
        type: "pie",
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: "Order Status",
                data: Object.values(data),
                backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56"]
            }]
        }
    });
}

// Load Dashboard on Page Load
window.onload = loadDashboard;
