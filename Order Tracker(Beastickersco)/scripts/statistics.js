import { db } from "./firebase-config.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// Firebase Collections
const ordersCollection = collection(db, "orders");
const expensesCollection = collection(db, "expenses");

// Store all loaded data
let allOrders = [];
let allExpenses = [];

// Chart.js instances (safe handling)
const chartInstances = {};

// Load all data from Firebase
async function loadData() {
    const ordersSnapshot = await getDocs(ordersCollection);
    allOrders = ordersSnapshot.docs.map(doc => doc.data());

    const expensesSnapshot = await getDocs(expensesCollection);
    allExpenses = expensesSnapshot.docs.map(doc => doc.data());

    updateStatistics('all');  // Initial load - show all data
}

// Date-based filter for orders
function filterOrdersByDate(range) {
    const now = new Date();
    return allOrders.filter(order => {
        const orderDate = new Date(order.orderDate);
        if (range === 'day') {
            return orderDate.toDateString() === now.toDateString();
        } else if (range === 'week') {
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            return orderDate >= startOfWeek && orderDate <= new Date();
        } else if (range === 'month') {
            return orderDate.getMonth() === new Date().getMonth() &&
                   orderDate.getFullYear() === new Date().getFullYear();
        }
        return true; // 'all' case
    });
}

// Update all displayed stats
function updateStatistics(range) {
    const filteredOrders = filterOrdersByDate(range);

    let totalRevenue = 0, totalCost = 0, totalProfit = 0;
    let productProfits = {}, customerSpend = {}, profitOverTime = {}, orderStatusCounts = {};

    filteredOrders.forEach(order => {
        const revenue = (order.sellPrice || 0) * (order.quantity || 0);
        const cost = (order.costPrice || 0) * (order.quantity || 0);
        const profit = revenue - cost;

        totalRevenue += revenue;
        totalCost += cost;
        totalProfit += profit;

        productProfits[order.product] = (productProfits[order.product] || 0) + profit;
        customerSpend[order.customerName] = (customerSpend[order.customerName] || 0) + revenue;

        const dateKey = order.orderDate.split('T')[0];
        profitOverTime[dateKey] = (profitOverTime[dateKey] || 0) + profit;

        orderStatusCounts[order.status] = (orderStatusCounts[order.status] || 0) + 1;
    });

    const totalExpenses = allExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    const netProfit = totalProfit - totalExpenses;

    updateSummary(totalRevenue, totalCost, totalProfit, totalExpenses, netProfit, filteredOrders);
    populateTopList(productProfits, 'topProducts');
    populateTopList(customerSpend, 'topCustomers');
    drawBarChart(orderStatusCounts, 'statusChart', 'Orders by Status');
    drawLineChart(profitOverTime, 'profitChart', 'Profit Over Time');
    drawBarChart(aggregateExpensesByCategory(), 'expensesChart', 'Expenses by Category');
}

// Update main stats boxes
function updateSummary(revenue, cost, profit, expenses, netProfit, orders) {
    document.getElementById('totalRevenue').innerText = `$${revenue.toFixed(2)}`;
    document.getElementById('totalCost').innerText = `$${cost.toFixed(2)}`;
    document.getElementById('totalProfit').innerText = `$${profit.toFixed(2)}`;
    document.getElementById('totalExpenses').innerText = `$${expenses.toFixed(2)}`;
    document.getElementById('netProfit').innerText = `$${netProfit.toFixed(2)}`;
    document.getElementById('totalOrders').innerText = orders.length;
    document.getElementById('totalCustomers').innerText = new Set(orders.map(o => o.customerName)).size;
}

// Create ranked list for top products/customers
function populateTopList(data, elementId) {
    const list = document.getElementById(elementId);
    list.innerHTML = '';
    Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, value]) => {
            const li = document.createElement('li');
            li.innerText = `${key}: $${value.toFixed(2)}`;
            list.appendChild(li);
        });
}

// Aggregate expenses by category
function aggregateExpensesByCategory() {
    const categoryTotals = {};
    allExpenses.forEach(exp => {
        const category = exp.category || "Uncategorized";
        categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(exp.amount || 0);
    });
    return categoryTotals;
}

// General function to destroy old chart and create a new one
function drawChart(type, data, canvasId, label) {
    const ctx = document.getElementById(canvasId).getContext('2d');

    if (chartInstances[canvasId]) {
        chartInstances[canvasId].destroy();
    }

    chartInstances[canvasId] = new Chart(ctx, {
        type: type,
        data: {
            labels: Object.keys(data),
            datasets: [{
                label: label,
                data: Object.values(data),
                backgroundColor: ['#4CAF50', '#FFC107', '#2196F3', '#FF5722', '#9C27B0'],
                borderColor: '#444',
                borderWidth: 1
            }]
        }
    });
}

// Bar Chart
function drawBarChart(data, canvasId, label) {
    drawChart('bar', data, canvasId, label);
}

// Line Chart
function drawLineChart(data, canvasId, label) {
    drawChart('line', data, canvasId, label);
}

// Date filter handler
document.getElementById('dateFilter').addEventListener('change', (e) => {
    updateStatistics(e.target.value);
});

// Load data on page load
window.onload = loadData;
