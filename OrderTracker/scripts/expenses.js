import { db } from "./firebase-config.js";
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const expensesCollection = collection(db, "expenses");

async function loadExpenses() {
    const tableBody = document.getElementById('expensesTable');
    tableBody.innerHTML = '';

    const snapshot = await getDocs(expensesCollection);
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.date || ''}</td>
            <td>${data.category || ''}</td>
            <td>${data.description || ''}</td>
            <td>$${parseFloat(data.amount).toFixed(2)}</td>
            <td>
                <button class="btn edit-btn" data-id="${docSnap.id}">Edit</button>
                <button class="btn delete-btn" data-id="${docSnap.id}">Delete</button>
            </td>
        `;
        tableBody.appendChild(row);
    });

    document.querySelectorAll('.edit-btn').forEach(button => {
        button.addEventListener('click', () => loadExpenseForEdit(button.dataset.id));
    });

    document.querySelectorAll('.delete-btn').forEach(button => {
        button.addEventListener('click', () => deleteExpense(button.dataset.id));
    });
}

async function saveExpense(e) {
    e.preventDefault();

    const expenseId = document.getElementById('expenseId').value;
    const expense = {
        date: document.getElementById('expenseDate').value,
        category: document.getElementById('expenseCategory').value,
        description: document.getElementById('expenseDescription').value,
        amount: parseFloat(document.getElementById('expenseAmount').value)
    };

    if (expenseId) {
        await updateDoc(doc(expensesCollection, expenseId), expense);
    } else {
        await addDoc(expensesCollection, expense);
    }

    document.getElementById('expenseForm').reset();
    document.getElementById('expenseId').value = '';
    loadExpenses();
}

async function loadExpenseForEdit(expenseId) {
    const snapshot = await getDocs(expensesCollection);
    snapshot.forEach(docSnap => {
        if (docSnap.id === expenseId) {
            const data = docSnap.data();
            document.getElementById('expenseId').value = expenseId;
            document.getElementById('expenseDate').value = data.date;
            document.getElementById('expenseCategory').value = data.category;
            document.getElementById('expenseDescription').value = data.description;
            document.getElementById('expenseAmount').value = data.amount;
        }
    });
}

async function deleteExpense(expenseId) {
    if (confirm('Are you sure you want to delete this expense?')) {
        await deleteDoc(doc(expensesCollection, expenseId));
        loadExpenses();
    }
}

document.getElementById('expenseForm').addEventListener('submit', saveExpense);
window.onload = loadExpenses;
