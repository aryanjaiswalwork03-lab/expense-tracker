let transactions = JSON.parse(localStorage.getItem("data")) || [];
let charts = { pie: null, bar: null };

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("date").valueAsDate = new Date();
  update();
});

function addTransaction() {
  const desc = document.getElementById("desc").value.trim();
  const amount = parseFloat(document.getElementById("amount").value);
  const type = document.getElementById("type").value;
  const date = document.getElementById("date").value;
  if (!desc || !amount || amount <= 0) return alert("Fill all fields");
  transactions.push({ id: Date.now(), desc, amount, type, date });
  localStorage.setItem("data", JSON.stringify(transactions));
  document.getElementById("desc").value = "";
  document.getElementById("amount").value = "";
  document.getElementById("date").valueAsDate = new Date();
  update();
}

function deleteTransaction(id) {
  if (confirm("Delete transaction?")) {
    transactions = transactions.filter((t) => t.id !== id);
    localStorage.setItem("data", JSON.stringify(transactions));
    update();
  }
}

function filterByMonth() {
  const month = document.getElementById("monthFilter").value;
  const filtered = month
    ? transactions.filter((t) => t.date.startsWith(month))
    : transactions;
  renderList(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
}

function update() {
  let income = 0,
    expense = 0;
  transactions.forEach((t) => {
    if (t.type === "income") income += t.amount;
    else expense += t.amount;
  });
  document.getElementById("income").innerText =
    "₹" + income.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  document.getElementById("expense").innerText =
    "₹" + expense.toLocaleString("en-IN", { maximumFractionDigits: 2 });
  document.getElementById("balance").innerText =
    "₹" +
    (income - expense).toLocaleString("en-IN", { maximumFractionDigits: 2 });
  renderList(transactions);
  updateMonthFilter();
  drawCharts(income, expense);
}

function renderList(data = transactions) {
  if (!data.length) {
    document.getElementById("transactionList").innerHTML =
      '<p class="no-transactions">No transactions</p>';
    return;
  }
  document.getElementById("transactionList").innerHTML = data
    .map(
      (t) => `
    <div class="transaction-item ${t.type}">
      <div class="transaction-info">
        <div class="transaction-desc">${t.desc}</div>
        <div class="transaction-date">${new Date(t.date).toLocaleDateString("en-IN")}</div>
      </div>
      <div class="transaction-amount">${t.type === "income" ? "+" : "-"} ₹${t.amount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</div>
      <button class="btn-delete" onclick="deleteTransaction(${t.id})">Delete</button>
    </div>
  `,
    )
    .join("");
}

function updateMonthFilter() {
  const months = [...new Set(transactions.map((t) => t.date.substring(0, 7)))]
    .sort()
    .reverse();
  const select = document.getElementById("monthFilter");
  select.innerHTML =
    '<option value="">All Months</option>' +
    months
      .map((m) => {
        const date = new Date(m + "-01");
        return `<option value="${m}">${date.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}</option>`;
      })
      .join("");
}

function drawCharts(income, expense) {
  const pieCtx = document.getElementById("pieChart").getContext("2d");
  if (charts.pie) charts.pie.destroy();
  charts.pie = new Chart(pieCtx, {
    type: "doughnut",
    data: {
      labels: ["Income", "Expense"],
      datasets: [
        {
          data: [income, expense],
          backgroundColor: ["#38ef7d", "#f45c43"],
          borderColor: ["#11998e", "#eb3349"],
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: "bottom",
          labels: { font: { size: 14 }, padding: 15 },
        },
      },
    },
  });
  const monthlyData = {};
  transactions.forEach((t) => {
    const m = t.date.substring(0, 7);
    if (!monthlyData[m]) monthlyData[m] = { income: 0, expense: 0 };
    monthlyData[m][t.type] += t.amount;
  });
  const months = Object.keys(monthlyData).sort();
  const barCtx = document.getElementById("barChart").getContext("2d");
  if (charts.bar) charts.bar.destroy();
  charts.bar = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: months.map((m) =>
        new Date(m + "-01").toLocaleDateString("en-IN", {
          month: "short",
          year: "2-digit",
        }),
      ),
      datasets: [
        {
          label: "Income",
          data: months.map((m) => monthlyData[m].income),
          backgroundColor: "#38ef7d",
          borderColor: "#11998e",
          borderWidth: 2,
        },
        {
          label: "Expense",
          data: months.map((m) => monthlyData[m].expense),
          backgroundColor: "#f45c43",
          borderColor: "#eb3349",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { callback: (v) => "₹" + v.toLocaleString("en-IN") },
        },
      },
    },
  });
}

function clearAllData() {
  if (confirm("Delete all transactions?")) {
    transactions = [];
    localStorage.removeItem("data");
    update();
  }
}
