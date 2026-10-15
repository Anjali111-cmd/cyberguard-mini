const STORAGE_KEY = "cyberguard_complaints";

function getComplaints() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch (error) {
        return [];
    }
}

function saveComplaints(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function(character) {
        const map = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };
        return map[character];
    });
}

if (sessionStorage.getItem("adminLoggedIn") !== "true") {
    window.location.href = "login.html";
}

const table = document.getElementById("complaintTable");
const emptyTable = document.getElementById("emptyTable");
const search = document.getElementById("search");
const category = document.getElementById("category");
const priority = document.getElementById("priority");
const status = document.getElementById("status");

let categoryChart = null;
let statusChart = null;

function getFilteredComplaints() {
    const query = search.value.trim().toLowerCase();
    return getComplaints().filter(function(complaint) {
        const matchesSearch = !query || complaint.id.toLowerCase().includes(query) || complaint.text.toLowerCase().includes(query);
        const matchesCategory = !category.value || complaint.category === category.value;
        const matchesPriority = !priority.value || complaint.priority === priority.value;
        const matchesStatus = !status.value || complaint.status === status.value;
        return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    });
}

function priorityBadge(value) {
    let className = "low-pill";
    if (value === "High") className = "high-pill";
    if (value === "Medium") className = "medium-pill";
    return `<span class="pill ${className}">${escapeHTML(value)}</span>`;
}

function renderDashboard() {
    const complaints = getComplaints();

    document.getElementById("total").textContent = complaints.length;
    document.getElementById("high").textContent = complaints.filter(c => c.priority === "High").length;
    document.getElementById("review").textContent = complaints.filter(c => c.status === "Under Review").length;
    document.getElementById("resolved").textContent = complaints.filter(c => c.status === "Resolved").length;

    const filtered = getFilteredComplaints();
    table.innerHTML = "";
    emptyTable.classList.toggle("hidden", filtered.length !== 0);

    filtered.forEach(function(complaint) {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td><b>${escapeHTML(complaint.id)}</b></td>
            <td>${escapeHTML(complaint.category)}</td>
            <td>${priorityBadge(complaint.priority)}</td>
            <td>
                <select class="status-select" data-id="${escapeHTML(complaint.id)}">
                    <option ${complaint.status === "Registered" ? "selected" : ""}>Registered</option>
                    <option ${complaint.status === "Under Review" ? "selected" : ""}>Under Review</option>
                    <option ${complaint.status === "Resolved" ? "selected" : ""}>Resolved</option>
                </select>
            </td>
            <td>${escapeHTML(complaint.date)}</td>
            <td>
                <button class="action-btn view-btn" data-action="view" data-id="${escapeHTML(complaint.id)}">View</button>
                <button class="action-btn delete-btn" data-action="delete" data-id="${escapeHTML(complaint.id)}">Delete</button>
            </td>
        `;
        table.appendChild(row);
    });

    drawCharts(complaints);
}

function drawCharts(complaints) {
    if (categoryChart) categoryChart.destroy();
    if (statusChart) statusChart.destroy();
    if (typeof Chart === "undefined") return;

    const categories = ["UPI / Financial Fraud", "Phishing", "Account Hacking", "Social Media Fraud", "Other"];
    const categoryData = categories.map(cat => complaints.filter(c => c.category === cat).length);

    categoryChart = new Chart(document.getElementById("categoryChart"), {
        type: "bar",
        data: {
            labels: categories,
            datasets: [{ label: "Complaints", data: categoryData }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });

    const statuses = ["Registered", "Under Review", "Resolved"];
    const statusData = statuses.map(st => complaints.filter(c => c.status === st).length);

    statusChart = new Chart(document.getElementById("statusChart"), {
        type: "doughnut",
        data: {
            labels: statuses,
            datasets: [{ label: "Complaints", data: statusData }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false
        }
    });
}

table.addEventListener("click", function(event) {
    const button = event.target.closest("[data-action]");
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;

    if (action === "view") openComplaint(id);
    if (action === "delete") deleteComplaint(id);
});

table.addEventListener("change", function(event) {
    if (!event.target.classList.contains("status-select")) return;
    const id = event.target.dataset.id;
    const newStatus = event.target.value;
    const complaints = getComplaints();
    const complaint = complaints.find(item => item.id === id);

    if (!complaint) return;
    complaint.status = newStatus;
    complaint.updatedAt = new Date().toLocaleString();
    saveComplaints(complaints);
    renderDashboard();
});

function deleteComplaint(id) {
    if (!confirm("Are you sure you want to delete this complaint?")) return;
    const complaints = getComplaints().filter(complaint => complaint.id !== id);
    saveComplaints(complaints);
    renderDashboard();
}

function openComplaint(id) {
    const complaint = getComplaints().find(item => item.id === id);
    if (!complaint) return;

    const modal = document.getElementById("modal");
    const modalBody = document.getElementById("modalBody");

    modalBody.innerHTML = `
        <div class="detail-row"><span class="detail-label">Complaint ID:</span> ${escapeHTML(complaint.id)}</div>
        <div class="detail-row"><span class="detail-label">Category:</span> ${escapeHTML(complaint.category)}</div>
        <div class="detail-row"><span class="detail-label">Priority:</span> ${escapeHTML(complaint.priority)}</div>
        <div class="detail-row"><span class="detail-label">Status:</span> ${escapeHTML(complaint.status)}</div>
        <div class="detail-row"><span class="detail-label">Complaint:</span><br>${escapeHTML(complaint.text)}</div>
        <div class="detail-row"><span class="detail-label">Registered:</span> ${escapeHTML(complaint.date)}</div>
        <div class="detail-row"><span class="detail-label">Last Updated:</span> ${escapeHTML(complaint.updatedAt)}</div>
        <div class="detail-row"><span class="detail-label">Evidence:</span><br>${complaint.evidence && complaint.evidence.length ? complaint.evidence.map(item => escapeHTML(item)).join("<br>") : "No evidence uploaded."}</div>
        <div class="detail-row"><span class="detail-label">Screenshots:</span><br>${complaint.screenshots && complaint.screenshots.length ? complaint.screenshots.map(item => escapeHTML(item)).join("<br>") : "No screenshots uploaded."}</div>
    `;

    modal.classList.remove("hidden");
}

document.getElementById("closeModal").addEventListener("click", function() {
    document.getElementById("modal").classList.add("hidden");
});

document.getElementById("modal").addEventListener("click", function(event) {
    if (event.target.id === "modal") {
        event.target.classList.add("hidden");
    }
});

search.addEventListener("input", renderDashboard);
category.addEventListener("change", renderDashboard);
priority.addEventListener("change", renderDashboard);
status.addEventListener("change", renderDashboard);

document.getElementById("clearAll").addEventListener("click", function() {
    if (!confirm("Delete ALL complaints?")) return;
    localStorage.removeItem(STORAGE_KEY);
    saveComplaints([]);
    renderDashboard();
});

document.getElementById("logoutBtn").addEventListener("click", function() {
    sessionStorage.removeItem("adminLoggedIn");
    sessionStorage.removeItem("adminToken");
    window.location.href = "login.html";
});

renderDashboard();