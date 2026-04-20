// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyDHhVXPVnNbXf3EMvSoVDoJn-TjMDweAtM",
  authDomain: "money-tracker-a3109.firebaseapp.com",
  projectId: "money-tracker-a3109",
  storageBucket: "money-tracker-a3109.firebasestorage.app",
  messagingSenderId: "15598763342",
  appId: "1:15598763342:web:d3b100b808bf258ca5b21f",
  measurementId: "G-H1CF49SJZB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();
console.log("Firebase initialized"); // Debug

// DOM Elements
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
const loginBtnMain = document.getElementById("login-btn-main");
const loginPage = document.getElementById("login-page");
const mainApp = document.getElementById("main-app");
const userSection = document.getElementById("user-section");
const themeToggleBtn = document.getElementById("theme-toggle");

// --- Theme Management ---
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeIcon(savedTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    if (!themeToggleBtn) return;
    const icon = themeToggleBtn.querySelector('i');
    if (theme === 'dark') {
        icon.className = 'fas fa-sun';
        themeToggleBtn.style.color = '#f59e0b'; // Yellow for sun
    } else {
        icon.className = 'fas fa-moon';
        themeToggleBtn.style.color = '#64748b'; // Muted for moon
    }
}

// Initialize Theme
initTheme();

// Event Listener for Theme Toggle
if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', toggleTheme);
}


let transactions = [];
let expenseChart = null;
let unsubscribe = null; // To stop listening when logged out
let currentUser = null;

// Set default date to today
if(dateInput) dateInput.valueAsDate = new Date();

// --- Authentication Functions ---

const login = async () => {
    console.log("Login button clicked"); // Debug
    try {
        await signInWithPopup(auth, provider);
    } catch (error) {
        console.error("Login failed:", error);
        alert("Login failed: " + error.code + " - " + error.message);
    }
};

const logout = async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error("Logout failed:", error);
    }
};

// Attach to window so HTML can call them
window.login = login;
window.logout = logout;

// Event Listeners for Login Buttons
if (loginBtnMain) {
    loginBtnMain.addEventListener("click", login);
}

// Auth State Listener
onAuthStateChanged(auth, (user) => {
    currentUser = user;
    if (user) {
        // User is signed in
        console.log("User logged in:", user.email);
        
        // Hide Login Page, Show Main App
        loginPage.style.display = "none";
        mainApp.style.display = "block"; // Changed to block to fix layout

        // Update User Profile in Nav
        userSection.innerHTML = `
            <div class="user-profile-pill">
                <span class="user-name">${user.displayName.split(' ')[0]}</span>
                <img src="${user.photoURL}" alt="Profile" class="user-avatar">
                <button onclick="logout()" class="logout-icon-btn" title="ออกจากระบบ">
                    <i class="fas fa-sign-out-alt"></i>
                </button>
            </div>
        `;

        // Start Listening to Data
        loadData(user.uid);
    } else {
        // User is signed out
        console.log("User logged out");
        
        // Show Login Page, Hide Main App
        loginPage.style.display = "flex";
        mainApp.style.display = "none";

        // Clear Data
        transactions = [];
        init();
        if (unsubscribe) unsubscribe();
    }
});


// --- Firestore Data Functions ---

function loadData(uid) {
    if (unsubscribe) unsubscribe();

    // Simplify query to avoid Indexing errors for now
    const q = query(
        collection(db, "transactions"), 
        where("uid", "==", uid)
        // orderBy("date", "desc") // Temporarily remove if index is creating issues
    );

    unsubscribe = onSnapshot(q, (snapshot) => {
        transactions = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        init(); // Re-render app with new data
    });
}

// Add transaction
async function addTransaction(e) {
  console.log('Form submission started'); // Debug
  e.preventDefault();

  if (!currentUser) {
      alert("กรุณาเข้าสู่ระบบก่อนบันทึกข้อมูล");
      return;
  }

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
  
  // Get Category
  const category = categorySelect ? categorySelect.value : 'other';

  const newTransaction = {
    uid: currentUser.uid,
    text: text.value,
    amount: finalAmount,
    date: dateInput.value,
    category: category,
    createdAt: serverTimestamp() 
  };

  try {
      await addDoc(collection(db, "transactions"), newTransaction);
      
      // Clear form
      text.value = "";
      amount.value = "";
      document.getElementById('type-expense').checked = true;
  } catch (err) {
      console.error("Error adding document: ", err);
      alert("ไม่สามารถบันทึกข้อมูลได้");
  }
}

// Remove transaction
async function removeTransaction(id) {
  if (!currentUser) return;
  if (!confirm('ยืนยันลบรายการนี้?')) return;

  try {
      await deleteDoc(doc(db, "transactions", id));
  } catch (err) {
      console.error("Error deleting document: ", err);
      alert("ไม่สามารถลบข้อมูลได้");
  }
}

// Expose removeTransaction to window for HTML onclick
window.removeTransaction = removeTransaction;


// --- Login Subtitle Rotator ---
const subtitles = [
    "วางแผนการเงินสู่อนาคตที่มั่นคง เริ่มต้นวันนี้",
    "จดครบ จบทุกเรื่องเงิน... ง่ายๆ แค่ปลายนิ้ว",
    "รู้ทันทุกการใช้จ่าย เก็บออมได้ตามเป้าหมาย",
    "เปลี่ยนเรื่องเงินให้เป็นเรื่องง่าย ด้วยตัวคุณเอง"
];
let subtitleIndex = 0;

function rotateSubtitle() {
    const el = document.getElementById('login-subtitle');
    if (!el) return;

    el.classList.add('fade-out');
    
    setTimeout(() => {
        subtitleIndex = (subtitleIndex + 1) % subtitles.length;
        el.innerText = subtitles[subtitleIndex];
        el.classList.remove('fade-out');
    }, 500); // Match CSS transition time
}

// Start Rotation if on login page
if (document.getElementById('login-subtitle')) {
    setInterval(rotateSubtitle, 4000); // Change every 4 seconds
}

// --- UI Functions (Mostly Unchanged logic, just data source) ---

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
  
  // Category Label & Icon Map
  const categoryMap = {
      food: { label: 'อาหาร', icon: '🍔', color: '#f59e0b' },
      transport: { label: 'เดินทาง', icon: '🚕', color: '#3b82f6' },
      utilities: { label: 'น้ำ-ไฟ', icon: '💡', color: '#eab308' },
      shopping: { label: 'ช้อปปิ้ง', icon: '🛍️', color: '#ec4899' },
      entertainment: { label: 'บันเทิง', icon: '🎬', color: '#8b5cf6' },
      salary: { label: 'เงินเดือน', icon: '💰', color: '#10b981' },
      business: { label: 'ธุรกิจ', icon: '💼', color: '#06b6d4' },
      other: { label: 'อื่นๆ', icon: '📝', color: '#64748b' }
  };
  
  const catData = categoryMap[transaction.category] || categoryMap.other;

  item.classList.add(itemClass);
  // Premium List Item Structure
  item.innerHTML = `
    <div class="list-left">
        <div class="list-icon" style="background: ${catData.color}20; color: ${catData.color};">
            ${catData.icon}
        </div>
        <div class="list-info">
            <span class="list-title">${transaction.text}</span>
            <span class="list-meta">${dateStr} • ${catData.label}</span>
        </div>
    </div>
    
    <div class="list-right">
        <span class="amount ${itemClass}">${sign}${formattedAmount}</span>
        <button class="delete-btn" onclick="removeTransaction('${transaction.id}')">
            <i class="fas fa-trash"></i>
        </button>
    </div>
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
             // Default to This Month if no specific month picked
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

// Chart Logic
const reportPeriodMode = document.getElementById('report-period-mode');
const reportWeekPicker = document.getElementById('report-week-picker');
const reportMonthPicker = document.getElementById("report-month-picker");
const reportTypeExpense = document.getElementById('report-type-expense');
const reportTypeIncome = document.getElementById('report-type-income');

// Chart Plugin
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
    ctx.fillStyle = "#1e293b"; 

    // Sum data
    const total = chart.config.data.datasets[0].data.reduce((a, b) => a + b, 0);
    const text = "฿" + total.toLocaleString();

    var textX = Math.round((width - ctx.measureText(text).width) / 2),
        textY = height / 2;

    ctx.fillText(text, textX, textY);
    
    // Label "Total"
    ctx.font = "500 " + (fontSize*0.4).toFixed(2) + "em 'Outfit', sans-serif";
    ctx.fillStyle = "#64748b"; 
    const label = "ยอดรวม";
    var labelX = Math.round((width - ctx.measureText(label).width) / 2);
    
    ctx.fillText(label, labelX, textY - (height * 0.15));
    ctx.save();
  }
};

Chart.register(centerTextPlugin);

function updateChart() {
    const ctx = document.getElementById('expense-chart');
    if (!ctx) return; 

    // Determine Mode (Expense vs Income vs Comparison)
    const isExpenseRadio = document.getElementById('report-type-expense');
    const isComparisonRadio = document.getElementById('report-type-comparison');
    
    let reportType = 'expense';
    if (isExpenseRadio && isExpenseRadio.checked) reportType = 'expense';
    else if (isComparisonRadio && isComparisonRadio.checked) reportType = 'comparison';
    else reportType = 'income';

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

        currentTransactions = transactions.filter(t => {
            const tDate = new Date(t.date);
            return tDate.getFullYear() === useYear && tDate.getMonth() === useMonth;
        });

    } else if (mode === 'week') {
        let selectedWeekVal = reportWeekPicker ? reportWeekPicker.value : '';
        const getWeekStr = (date) => {
            const tempDate = new Date(date.valueOf());
            tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
            const year = tempDate.getFullYear();
            const weekNo = Math.ceil((((tempDate - new Date(year, 0, 1)) / 86400000) + 1) / 7);
            return `${year}-W${String(weekNo).padStart(2, '0')}`;
        };

        if (selectedWeekVal) {
             currentTransactions = transactions.filter(t => getWeekStr(new Date(t.date)) === selectedWeekVal);
        } else if (reportWeekPicker) {
             const currentWeekStr = getWeekStr(now);
             reportWeekPicker.value = currentWeekStr;
             currentTransactions = transactions.filter(t => getWeekStr(new Date(t.date)) === currentWeekStr);
        }
    }

    // Process Data based on Report Type
    let labels = [];
    let backgroundColors = [];
    let dataValues = [];
    
    // If Comparison Mode
    if (reportType === 'comparison') {
        labels = ['รายรับ', 'รายจ่าย'];
        backgroundColors = ['#10b981', '#ef4444']; // Green vs Red
        
        const totalInc = currentTransactions
            .filter(t => t.amount > 0)
            .reduce((acc, t) => acc + t.amount, 0);
            
        const totalExp = Math.abs(currentTransactions
            .filter(t => t.amount < 0)
            .reduce((acc, t) => acc + t.amount, 0));
            
        dataValues = [totalInc, totalExp];
        
        // Pass special flag or data to analysis card if needed, 
        // but for now updateInsightCard handles general financial health via total transactions anyway.
        // We might want to clear specific category analysis or show a summary.
        updateInsightCard({}, false); // Clear category insight for now, or we can make a specific comparison insight
    } else {
        // Existing Income/Expense Category Logic
        const isExpense = (reportType === 'expense');
        const categoryTotals = {};
        
        currentTransactions.forEach(transaction => {
            if (isExpense && transaction.amount < 0) {
                const cat = transaction.category;
                const amt = Math.abs(transaction.amount);
                categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
            } else if (!isExpense && transaction.amount > 0) {
                const cat = transaction.category;
                const amt = transaction.amount;
                categoryTotals[cat] = (categoryTotals[cat] || 0) + amt;
            }
        });

        const map = {
            food: 'อาหาร', transport: 'เดินทาง', utilities: 'น้ำ-ไฟ',
            shopping: 'ช้อปปิ้ง', entertainment: 'บันเทิง', other: 'อื่นๆ',
            salary: 'เงินเดือน', business: 'ธุรกิจ'
        };
        
        labels = Object.keys(categoryTotals).map(cat => map[cat] || cat);
        dataValues = Object.values(categoryTotals);
        
        updateInsightCard(categoryTotals, isExpense);

        if (isExpense) {
            backgroundColors = ['#f59e0b', '#ef4444', '#f97316', '#eab308', '#dc2626', '#78350f'];
        } else {
            backgroundColors = ['#10b981', '#3b82f6', '#06b6d4', '#6366f1', '#059669', '#1d4ed8'];
        }
    }

    if (expenseChart) {
        expenseChart.destroy();
    }

    // Check if empty (only for visual valid check)
    const totalData = dataValues.reduce((a,b)=>a+b,0);
    if (totalData === 0) {
        const container = document.getElementById('insight-container');
        if (container) container.innerHTML = `<div style="text-align:center; color:#94a3b8; margin-top:2rem;">ไม่มีข้อมูลในช่วงเวลานี้</div>`;
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
    
    // Always Calculate Financial Health First (for Advice Box)
    const allTransactions = transactions; // Use global transactions
    const totalIncome = allTransactions
        .filter(t => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0);
    
    // Expenses are stored as negative, so convert to positive for calculation
    const totalExpense = Math.abs(allTransactions
        .filter(t => t.amount < 0)
        .reduce((sum, t) => sum + t.amount, 0));

    const balance = totalIncome - totalExpense;
    const savingsRate = totalIncome > 0 ? ((balance / totalIncome) * 100) : 0;
    
    // --- 2. Determine Health Status & Advice ---
    let healthStatus = 'good'; // good, warning, danger
    let adviceTitle = "เยี่ยมมาก! สุขภาพการเงินแข็งแรง";
    let adviceText = "คุณมีการจัดการรายรับ-รายจ่ายที่ดี มีเงินออมคงเหลือ พยายามรักษาแบบนี้ต่อไปนะครับ";
    
    if (balance < 0) {
        healthStatus = 'danger';
        adviceTitle = "ระวัง! รายจ่ายเกินรายรับ";
        adviceText = `ขณะนี้คุณติดลบอยู่ ฿${Math.abs(balance).toLocaleString()} ควรลดค่าใช้จ่ายที่ไม่จำเป็น หรือหารายได้เสริมด่วนครับ`;
    } else if (savingsRate < 20) {
        healthStatus = 'warning';
        adviceTitle = "เริ่มตึงมือแล้วนะ";
        adviceText = `คุณมีเงินออมเหลือเพียง ${savingsRate.toFixed(1)}% ของรายรับ (ควรมีสัก 20%) ลองลดค่ากาแฟหรือช้อปปิ้งลงหน่อยดีไหม?`;
    }

    // --- 3. Find Top Category (Existing Logic) ---
    const isComparisonMode = (Object.keys(categoryTotals).length === 0 && !isExpense); // Check if called from comparison mode

    if (isComparisonMode) {
        container.innerHTML = `
            <div class="insight-card">
                <div class="insight-header">
                    <i class="fas fa-chart-pie"></i> สรุปภาพรวม
                </div>
                <div style="font-size:1.1rem; font-weight:600; margin-bottom:10px;">
                    รายรับ: <span style="color:#10b981;">฿${totalIncome.toLocaleString('th-TH')}</span>
                </div>
                <div style="font-size:1.1rem; font-weight:600; margin-bottom:15px;">
                    รายจ่าย: <span style="color:#ef4444;">฿${totalExpense.toLocaleString('th-TH')}</span>
                </div>
                <div class="advice-box advice-${healthStatus}">
                    <div style="font-weight:bold; margin-bottom:5px;">
                        ${healthStatus === 'good' ? '✨' : (healthStatus === 'warning' ? '⚠️' : '🚨')} ${adviceTitle}
                    </div>
                    ${adviceText}
                </div>
            </div>
        `;
        return;
    }

    if (Object.keys(categoryTotals).length === 0) {
        container.innerHTML = `<div style="text-align:center; color:var(--text-muted); margin-top:2rem;">ยังไม่มีข้อมูลสำหรับวิเคราะห์</div>`;
        return;
    }

    let maxCat = '';
    let maxVal = 0;
    let totalPie = 0;
    for (const [cat, val] of Object.entries(categoryTotals)) {
        totalPie += val;
        if (val > maxVal) {
            maxVal = val;
            maxCat = cat;
        }
    }
    const maxPercent = totalPie > 0 ? ((maxVal / totalPie) * 100).toFixed(1) : 0;

    const map = {
        food: 'อาหาร', transport: 'เดินทาง', utilities: 'น้ำ-ไฟ',
        shopping: 'ช้อปปิ้ง', entertainment: 'บันเทิง', other: 'อื่นๆ',
        salary: 'เงินเดือน', business: 'ธุรกิจ'
    };
    
    const iconMap = {
        food: 'fas fa-utensils', transport: 'fas fa-bus', utilities: 'fas fa-bolt',
        shopping: 'fas fa-shopping-bag', entertainment: 'fas fa-gamepad', other: 'fas fa-box',
        salary: 'fas fa-briefcase', business: 'fas fa-store'
    };

    const displayCat = map[maxCat] || maxCat;
    const displayIcon = iconMap[maxCat] || 'fas fa-circle';
    const displayVal = Number(maxVal).toLocaleString('th-TH');

    // --- 4. Render HTML ---
    container.innerHTML = `
        <div class="insight-card">
            <div class="insight-header">
                <i class="fas fa-chart-line"></i> วิเคราะห์พฤติกรรม
            </div>
            
            <div>
                คุณใช้จ่ายกับ <span style="font-weight:600; color:var(--primary-color);">${displayCat}</span> มากที่สุด
                <div class="insight-highlight">
                    <i class="${displayIcon}" style="margin-right:10px;"></i>
                    ${maxPercent}%
                </div>
                <div style="font-size:0.9rem; color:var(--text-muted);">
                    เป็นจำนวนเงิน ฿${displayVal}
                </div>
            </div>

            <div class="advice-box advice-${healthStatus}">
                <div style="font-weight:bold; margin-bottom:5px;">
                    ${healthStatus === 'good' ? '✨' : (healthStatus === 'warning' ? '⚠️' : '🚨')} ${adviceTitle}
                </div>
                ${adviceText}
            </div>
        </div>
    `;
}


const reportTypeComparison = document.getElementById('report-type-comparison');

// Global Chart Event Listeners (ensure they are attached to window update logic is handled by init/updateChart)
if (reportTypeExpense) reportTypeExpense.addEventListener('change', updateChart);
if (reportTypeIncome) reportTypeIncome.addEventListener('change', updateChart);
if (reportTypeComparison) reportTypeComparison.addEventListener('change', updateChart);

if (reportPeriodMode) {
    reportPeriodMode.addEventListener('change', (e) => {
        // Toggle Pickers
        if (e.target.value === 'month') {
            if(reportMonthPicker) reportMonthPicker.style.display = 'block';
            if(reportWeekPicker) reportWeekPicker.style.display = 'none';
        } else {
            if(reportMonthPicker) reportMonthPicker.style.display = 'none';
            if(reportWeekPicker) {
                reportWeekPicker.style.display = 'block';
                if (!reportWeekPicker.value) {
                     // Default to current week
                     const now = new Date();
                }
            }
        }
        updateChart();
    });
}
if (reportWeekPicker) reportWeekPicker.addEventListener('change', updateChart);
if (reportMonthPicker) reportMonthPicker.addEventListener("change", updateChart);


// Init app
function init() {
  list.innerHTML = "";
  // Data is already sorted by Query, but filter logic takes over.
  // Note: getFilteredTransactions uses global `transactions` array which is now populated from Firestore
  const filtered = getFilteredTransactions();

  // Sort again client side just to be safe if filter change affects it, although Query did it.
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

  filtered.forEach(addTransactionDOM);
  updateValues();
  // Expose updateChart globally or call it here
  window.updateChart = updateChart; 
  updateChart();
}

// Main Form Listeners
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
    monthPicker.addEventListener("change", init);
}

// Initial Call (Will show empty until Auth loads)
init();
