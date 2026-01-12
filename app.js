const balance = document.getElementById("balance");
const money_plus = document.getElementById("money-plus");
const money_minus = document.getElementById("money-minus");
const list = document.getElementById("list");
const form = document.getElementById("form");
const text = document.getElementById("text");
const amount = document.getElementById("amount");
const dateInput = document.getElementById("date");
const categorySelect = document.getElementById("category");
const periodFilter = document.getElementById("period-filter");
const monthPicker = document.getElementById("month-picker");

let expenseChart = null;

// Initialize local storage interactions
const localStorageTransactions = JSON.parse(
  localStorage.getItem("money_tracker_transactions")
);

let transactions =
  localStorage.getItem("money_tracker_transactions") !== null
    ? localStorageTransactions
    : [];

// Set default date to today
dateInput.valueAsDate = new Date();

// Add transaction
function addTransaction(e) {
  e.preventDefault();

  if (
    text.value.trim() === "" ||
    amount.value.trim() === "" ||
    dateInput.value === ""
  ) {
    alert("กรุณากรอกข้อมูลให้ครบถ้วน");
    return;
  }

  // Get selected type
  const isExpense = document.getElementById('type-expense').checked;
  const rawAmount = Math.abs(+amount.value); // Ensure positive first
  const finalAmount = isExpense ? -rawAmount : rawAmount;
  
  // Get Category (default to 'other' if null)
  const category = categorySelect ? categorySelect.value : 'other';

  const transaction = {
    id: generateID(),
    text: text.value,
    amount: finalAmount,
    date: dateInput.value,
    category: category 
  };

  transactions.push(transaction);

  addTransactionDOM(transaction);
  updateValues();
  updateLocalStorage();
  updateChart(); // Update chart when adding

  text.value = "";
  amount.value = "";
  document.getElementById('type-expense').checked = true;
}

// Generate random ID
function generateID() {
  return Math.floor(Math.random() * 100000000);
}

// Add transactions to DOM list
function addTransactionDOM(transaction) {
  // Get sign
  const sign = transaction.amount < 0 ? "-" : "+";
  const itemClass = transaction.amount < 0 ? "minus" : "plus";

  const item = document.createElement("li");

  // Format amount with currency style
  const formattedAmount = Math.abs(transaction.amount).toLocaleString("th-TH");

  // Format Date for display
  const dateObj = new Date(transaction.date);
  const dateStr = dateObj.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  
  // Category Label Map
  const categoryMap = {
      food: 'อาหาร',
      transport: 'เดินทาง',
      utilities: 'น้ำ-ไฟ',
      shopping: 'ช้อปปิ้ง',
      entertainment: 'บันเทิง',
      salary: 'เงินเดือน',
      business: 'ธุรกิจ',
      other: 'อื่นๆ'
  };
  
  const catLabel = categoryMap[transaction.category] || 'อื่นๆ';

  item.classList.add(itemClass);
  item.innerHTML = `
    <div class="list-info">
        <span style="font-weight:600; font-size:1rem;">${transaction.text}</span>
        <span class="list-date"><span style="color:#f59e0b; margin-right:5px;">[${catLabel}]</span> ${dateStr}</span>
    </div>
    <span class="amount">${sign}฿${formattedAmount}</span>
    <button class="delete-btn" onclick="removeTransaction(${transaction.id})">
        <i class="fas fa-times"></i>
    </button>
  `;

  list.appendChild(item);
}

// Update the balance, income and expense
function updateValues() {
  const currentTransactions = getFilteredTransactions();

  // Create array of amounts
  const amounts = currentTransactions.map((transaction) => transaction.amount);

  // Calculate total
  const total = amounts.reduce((acc, item) => (acc += item), 0).toFixed(2);
  const formattedTotal = Number(total).toLocaleString("th-TH");

  // Calculate income
  const income = amounts
    .filter((item) => item > 0)
    .reduce((acc, item) => (acc += item), 0)
    .toFixed(2);
  const formattedIncome = Number(income).toLocaleString("th-TH");

  // Calculate expense
  const expense = (
    amounts.filter((item) => item < 0).reduce((acc, item) => (acc += item), 0) *
    -1
  ).toFixed(2);
  const formattedExpense = Number(expense).toLocaleString("th-TH");

  balance.innerText = `฿${formattedTotal}`;
  money_plus.innerText = `+฿${formattedIncome}`;
  money_minus.innerText = `-฿${formattedExpense}`;
}

// Remove transaction by ID
function removeTransaction(id) {
  transactions = transactions.filter((transaction) => transaction.id !== id);

  updateLocalStorage();

  init();
}

// Update local storage transaction
function updateLocalStorage() {
  localStorage.setItem(
    "money_tracker_transactions",
    JSON.stringify(transactions)
  );
}

// Filter logic
function getFilteredTransactions() {
  const filterValue = periodFilter ? periodFilter.value : 'all';
  const now = new Date();

  // Helper to get week number
  const getWeek = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    var weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return [d.getUTCFullYear(), weekNo];
  };

  return transactions.filter((t) => {
    const tDate = new Date(t.date);

    if (filterValue === "all") return true;

    if (filterValue === "month") {
        if (monthPicker && monthPicker.value) {
            const [pYear, pMonth] = monthPicker.value.split('-');
            return (
                tDate.getFullYear() === parseInt(pYear) &&
                tDate.getMonth() + 1 === parseInt(pMonth)
            );
        } else {
             // Default to This Month if no specific month picked (or logic for picker default)
             return (
                tDate.getMonth() === now.getMonth() &&
                tDate.getFullYear() === now.getFullYear()
            );
        }
    }

    if (filterValue === "week") {
      const [tYear, tWeek] = getWeek(tDate);
      const [cYear, cWeek] = getWeek(now);
      return tYear === cYear && tWeek === cWeek;
    }

    return true;
  });
}

const reportMonthPicker = document.getElementById("report-month-picker");

// ... existing code ...

// Custom Plugin for Center Text
const centerTextPlugin = {
  id: 'centerText',
  beforeDraw: function(chart) {
    if (chart.config.type !== 'doughnut') return;
    var width = chart.width,
        height = chart.height,
        ctx = chart.ctx;

    ctx.restore();
    var fontSize = (height / 114).toFixed(2);
    ctx.font = "bold " + fontSize + "em 'Outfit', sans-serif";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#1e293b"; // Dark text

    // Sum data
    const total = chart.config.data.datasets[0].data.reduce((a, b) => a + b, 0);
    const text = "฿" + total.toLocaleString();

    var textX = Math.round((width - ctx.measureText(text).width) / 2),
        textY = height / 2;

    ctx.fillText(text, textX, textY);
    
    // Label "Total"
    ctx.font = "500 " + (fontSize*0.4).toFixed(2) + "em 'Outfit', sans-serif";
    ctx.fillStyle = "#64748b"; // Secondary text
    const label = "ยอดรวม";
    var labelX = Math.round((width - ctx.measureText(label).width) / 2);
    
    ctx.fillText(label, labelX, textY - (height * 0.15));
    ctx.save();
  }
};

Chart.register(centerTextPlugin);

// *** CHART LOGIC ***
const reportPeriodMode = document.getElementById('report-period-mode');
const reportWeekPicker = document.getElementById('report-week-picker');
const reportTypeExpense = document.getElementById('report-type-expense');
const reportTypeIncome = document.getElementById('report-type-income');

// Add listeners if elements exist
if (reportTypeExpense) reportTypeExpense.addEventListener('change', updateChart);
if (reportTypeIncome) reportTypeIncome.addEventListener('change', updateChart);

if (reportPeriodMode) {
    reportPeriodMode.addEventListener('change', (e) => {
        const mode = e.target.value;
        if (mode === 'month') {
            if(reportMonthPicker) reportMonthPicker.style.display = 'block';
            if(reportWeekPicker) reportWeekPicker.style.display = 'none';
        } else {
            if(reportMonthPicker) reportMonthPicker.style.display = 'none';
            if(reportWeekPicker) {
                reportWeekPicker.style.display = 'block';
                if (!reportWeekPicker.value) {
                     // Default to current week
                     const now = new Date();
                     // ISO week date logic is complex, simple approximation for default value:
                     // NOTE: Creating specific ISO week string (YYYY-Www) is tricky in native JS without libs
                     // We will let user pick or just updateChart with default logic first
                }
            }
        }
        updateChart();
    });
}

if (reportWeekPicker) reportWeekPicker.addEventListener('change', updateChart);

function updateChart() {
    const ctx = document.getElementById('expense-chart');
    if (!ctx) return; 

    // Determine Mode (Expense vs Income)
    const isExpenseRadio = document.getElementById('report-type-expense');
    const isExpense = isExpenseRadio ? isExpenseRadio.checked : true;

    // Use Report Specific Filter
    let currentTransactions = transactions; 
    const now = new Date();
    
    // Check Period Mode
    const mode = reportPeriodMode ? reportPeriodMode.value : 'month';

    if (mode === 'month') {
        let useYear = now.getFullYear();
        let useMonth = now.getMonth();

        if (reportMonthPicker && reportMonthPicker.value) {
            const [pYear, pMonth] = reportMonthPicker.value.split('-');
            useYear = parseInt(pYear);
            useMonth = parseInt(pMonth) - 1; 
        } else if (reportMonthPicker) {
            const m = String(now.getMonth() + 1).padStart(2, '0');
            reportMonthPicker.value = `${now.getFullYear()}-${m}`;
        }

        // Filter by Date (Month)
        currentTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === useYear && tDate.getMonth() === useMonth;
        });

    } else if (mode === 'week') {
        // Week filtering
        let selectedWeekVal = reportWeekPicker ? reportWeekPicker.value : '';
        
        // Helper to get week info from transaction date
        const getWeekStr = (date) => {
             const d = new Date(date);
             d.setHours(0, 0, 0, 0);
             d.setDate(d.getDate() + 4 - (d.getDay() || 7));
             const yearStart = new Date(d.getFullYear(), 0, 1);
             const weekNo = Math.ceil(( ( (d - yearStart) / 86400000 ) + 1) / 7);
             return `${d.getFullYear()}-W${String(weekNo).padStart(2, '0')}`;
        };

        if (!selectedWeekVal) {
             // If no week selected, default to current week
             selectedWeekVal = getWeekStr(now);
             if(reportWeekPicker) reportWeekPicker.value = selectedWeekVal;
        }

        currentTransactions = transactions.filter(t => {
            return getWeekStr(t.date) === selectedWeekVal;
        });
    }
    
    // Filter by Type (Expense < 0, Income > 0)
    const filteredData = currentTransactions.filter(t => isExpense ? t.amount < 0 : t.amount > 0);
    
    const categoryTotals = {};
    filteredData.forEach(t => {
        const cat = t.category || 'other';
        const amount = Math.abs(t.amount); // Always positive for chart
        if (categoryTotals[cat]) {
            categoryTotals[cat] += amount;
        } else {
            categoryTotals[cat] = amount;
        }
    });

    const labels = Object.keys(categoryTotals).map(cat => {
         const map = {
            food: 'อาหาร', transport: 'เดินทาง', utilities: 'น้ำ-ไฟ',
            shopping: 'ช้อปปิ้ง', entertainment: 'บันเทิง', other: 'อื่นๆ',
            salary: 'เงินเดือน', business: 'ธุรกิจ'
         };
         return map[cat] || cat;
    });

    const dataValues = Object.values(categoryTotals);
    
    // Suggest "Top Spending/Income" Insight
    updateInsightCard(categoryTotals, isExpense);

    let backgroundColors = [];
    if (isExpense) {
        // Red/Orange/Yellow Theme
        backgroundColors = ['#f59e0b', '#ef4444', '#f97316', '#eab308', '#dc2626', '#78350f'];
    } else {
        // Green/Blue/Teal Theme
        backgroundColors = ['#10b981', '#3b82f6', '#06b6d4', '#6366f1', '#059669', '#1d4ed8'];
    }

    if (expenseChart) {
        expenseChart.destroy();
    }

    if (dataValues.length === 0) {
        // Clear Insight if no data
        const container = document.getElementById('insight-container');
        if (container) container.innerHTML = `<div style="text-align:center; color:#94a3b8; margin-top:2rem;">ไม่มีข้อมูล${isExpense ? 'รายจ่าย' : 'รายรับ'}</div>`;
        return;
    }

    expenseChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
                borderWidth: 0,
                hoverOffset: 10 
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '75%', 
            plugins: {
                legend: {
                    position: 'bottom', 
                    labels: {
                        usePointStyle: true,
                        padding: 20,
                        font: { family: "'Outfit', sans-serif" }
                    }
                },
                title: { display: false }
            },
            animation: {
                animateScale: true,
                animateRotate: true
            }
        }
    });
}

function updateInsightCard(categoryTotals, isExpense = true) {
    const container = document.getElementById('insight-container');
    if (!container) return;

    if (Object.keys(categoryTotals).length === 0) {
        container.innerHTML = '';
        return;
    }

    // Find Max
    let maxCat = '';
    let maxVal = 0;
    for (const [cat, val] of Object.entries(categoryTotals)) {
        if (val > maxVal) {
            maxVal = val;
            maxCat = cat;
        }
    }
    
    // Mappings
    const map = {
        food: 'อาหาร', transport: 'เดินทาง', utilities: 'น้ำ-ไฟ',
        shopping: 'ช้อปปิ้ง', entertainment: 'บันเทิง', other: 'อื่นๆ',
        salary: 'เงินเดือน', business: 'ธุรกิจ'
    };
    
    const iconMap = {
        food: '🍔', transport: '🚕', utilities: '💡',
        shopping: '🛍️', entertainment: '🎬', other: '📝',
        salary: '💰', business: '💼'
    };

    const label = map[maxCat] || maxCat;
    const icon = iconMap[maxCat] || (isExpense ? '💸' : '💵');
    const totalVal = Object.values(categoryTotals).reduce((a,b)=>a+b,0);
    const percent = totalVal > 0 ? ((maxVal / totalVal) * 100).toFixed(0) : 0;

    const titleText = isExpense ? `รายจ่ายสูงสุด (${percent}%)` : `รายรับสูงสุด (${percent}%)`;
    const descText = isExpense 
        ? `คุณใช้จ่ายกับ <span class="highlight-cat" style="color:#ef4444;">${label}</span> มากที่สุด` 
        : `รายรับมาจาก <span class="highlight-cat" style="color:#10b981;">${label}</span> มากที่สุด`;

    container.innerHTML = `
        <div class="insight-card animate-enter" style="border-color: ${isExpense ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}">
            <div class="insight-icon" style="color: ${isExpense ? '#ef4444' : '#10b981'}; background: ${isExpense ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'}">${icon}</div>
            <div class="insight-info">
                <h4>${titleText}</h4>
                <p>${descText}</p>
                <div style="font-size:0.9rem; color:#64748b; margin-top:0.2rem;">฿${maxVal.toLocaleString()}</div>
            </div>
        </div>
    `;
}

// Event Listeners
if (reportMonthPicker) {
    reportMonthPicker.addEventListener("change", () => {
        updateChart();
    });
}


// Init app
function init() {
  list.innerHTML = "";
  const filtered = getFilteredTransactions();

  // Sort by date desc (newest first)
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(addTransactionDOM);
  updateValues();
  updateChart();
}

// Event Listeners
form.addEventListener("submit", addTransaction);

if (periodFilter) {
    periodFilter.addEventListener("change", (e) => {
        if (e.target.value === 'month') {
            monthPicker.style.display = 'block';
            if (!monthPicker.value) {
                const now = new Date();
                const year = now.getFullYear();
                const month = String(now.getMonth() + 1).padStart(2, '0');
                monthPicker.value = `${year}-${month}`;
            }
        } else {
            monthPicker.style.display = 'none';
        }
        init();
    });
}

if (monthPicker) {
    monthPicker.addEventListener("change", () => {
        init();
    });
}

init();
