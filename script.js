// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.log('PWA SW failed: ', err));
}

// Elements
const calendarGrid = document.getElementById("calendar-grid"), currentMonthText = document.getElementById("current-month");
const logDrawer = document.getElementById("log-drawer"), settingsModal = document.getElementById("settings-modal"), overlay = document.getElementById("overlay");
const selectedDateText = document.getElementById("selected-date-text"), saveBtn = document.getElementById("save-log-btn");
const chips = document.querySelectorAll(".chip[data-type]"), themeChips = document.querySelectorAll("#theme-selector .chip");
const flipCard = document.getElementById("quote-flip-card"), dailyQuote = document.getElementById("daily-quote");
const tabWeekly = document.getElementById("tab-weekly"), tabMonthly = document.getElementById("tab-monthly"), toggleSlider = document.getElementById("toggle-slider");
const weeklyChart = document.getElementById("weekly-chart"), monthlyChart = document.getElementById("monthly-chart"), adviceBox = document.getElementById("advice-box");

let currentDate = new Date(), selectedDateString = null, currentGraph = 'weekly';
let currentSelections = { flow: 'none', mood: 'none' };

// Load Data
let trackerData = JSON.parse(localStorage.getItem("flowTrackerData")) || {};
let currentTheme = localStorage.getItem("appTheme") || "default";
let userName = localStorage.getItem("userName") || "Bonolota";

// Literary Motivational Quotes
const motivationDb = {
    none: [
        "And, when you want something, all the universe conspires in helping you to achieve it. — Paulo Coelho",
        "Clouds come floating into my life, no longer to carry rain or usher storm, but to add color to my sunset sky. — Rabindranath Tagore",
        "You are capable of amazing things."
    ],
    calm: [
        "Let your life lightly dance on the edges of Time like dew on the tip of a leaf. — Rabindranath Tagore",
        "It's the possibility of having a dream come true that makes life interesting. — Paulo Coelho",
        "Peace comes from within. Enjoy this gentle rhythm."
    ],
    sensitive: [
        "Tears are words that need to be written. — Paulo Coelho",
        "The butterfly counts not months but moments, and has time enough. — Rabindranath Tagore",
        "It's okay to feel deeply. Be gentle with yourself today."
    ],
    cramps: [
        "There is only one thing that makes a dream impossible to achieve: the fear of failure. Rest today. — Paulo Coelho",
        "Rest is not a reward, it's a necessity. Take it easy today.",
        "Warmth, rest, and patience. You've got this."
    ],
    fatigue: [
        "The secret of life, though, is to fall seven times and to get up eight. Rest while you need to. — Paulo Coelho",
        "Trees are the earth's endless effort to speak to the listening heaven. Ground yourself and rest. — Rabindranath Tagore",
        "Give yourself permission to rest. You don't have to be productive every day."
    ]
};

const careMeasures = {
    cramps: { title: "Soothing Cramps", advice: "Your body is working hard. Try a warm heating pad, sip chamomile tea, and practice gentle stretching." },
    fatigue: { title: "Rebuilding Energy", advice: "Your energy levels are dipping. Prioritize 8 full hours of sleep tonight and give yourself permission to rest guilt-free." },
    sensitive: { title: "Emotional Care", advice: "Emotions are flowing strongly this month. Practice deep breathing, journal your thoughts, and seek comfort." },
    calm: { title: "Maintaining Balance", advice: "You are experiencing a lovely balanced month! Maintain this harmony with light walks and mindful breathing." },
    none: { title: "Keep Tracking", advice: "Log your moods to see personalized self-care insights here!" }
};

// Initialization
function initApp() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    document.getElementById('user-name-input').value = userName === "Bonolota" ? "" : userName; // Keep blank if default
    updateGreeting();
    renderCalendar();
    updateDailyQuote();
}

// Personalized Greeting
function updateGreeting() {
    const hour = new Date().getHours();
    let timeText = "Good evening";
    if (hour < 12) timeText = "Good morning";
    else if (hour < 17) timeText = "Good afternoon";
    document.getElementById("greeting-text").textContent = `${timeText}, ${userName} ✨`;
}

// Settings & Themes
document.getElementById("settings-btn").addEventListener("click", () => {
    themeChips.forEach(c => c.classList.toggle("active", c.dataset.theme === currentTheme));
    settingsModal.classList.remove("hidden");
    overlay.classList.remove("hidden");
});

themeChips.forEach(chip => {
    chip.addEventListener("click", (e) => {
        themeChips.forEach(c => c.classList.remove("active"));
        e.target.classList.add("active");
        currentTheme = e.target.dataset.theme;
        document.documentElement.setAttribute('data-theme', currentTheme);
    });
});

document.getElementById("save-settings-btn").addEventListener("click", () => {
    const inputName = document.getElementById("user-name-input").value.trim();
    userName = inputName || "Bonolota";
    localStorage.setItem("userName", userName);
    localStorage.setItem("appTheme", currentTheme);
    updateGreeting();
    settingsModal.classList.add("hidden");
    overlay.classList.add("hidden");
});

// Backup Data (Export & Import)
document.getElementById('export-btn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(trackerData));
    const dl = document.createElement('a');
    dl.setAttribute("href", dataStr);
    dl.setAttribute("download", "sanctuary_backup.json");
    dl.click();
});

document.getElementById('import-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            trackerData = JSON.parse(e.target.result);
            localStorage.setItem("flowTrackerData", JSON.stringify(trackerData));
            renderCalendar();
            alert("Data successfully restored!");
        } catch(err) { alert("Error importing file."); }
    };
    reader.readAsText(file);
});

// Flip Card
flipCard.addEventListener("click", () => flipCard.classList.toggle("flipped"));

function updateDailyQuote() {
    const today = new Date();
    const localToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    let currentMood = trackerData[localToday]?.mood || 'none';
    const quotesArr = motivationDb[currentMood] || motivationDb.none;
    dailyQuote.textContent = `"${quotesArr[Math.floor(Math.random() * quotesArr.length)]}"`;
}

// Graphs
tabWeekly.addEventListener("click", () => { currentGraph = 'weekly'; switchTab(tabWeekly, tabMonthly, "0", weeklyChart, monthlyChart); });
tabMonthly.addEventListener("click", () => { currentGraph = 'monthly'; switchTab(tabMonthly, tabWeekly, "100%", monthlyChart, weeklyChart); });

function switchTab(activeBtn, inactiveBtn, translate, showChart, hideChart) {
    activeBtn.classList.add("active"); inactiveBtn.classList.remove("active");
    toggleSlider.style.transform = `translateX(${translate})`;
    showChart.classList.remove("hidden-chart"); hideChart.classList.add("hidden-chart");
    renderInsights();
}

function renderInsights() {
    currentGraph === 'weekly' ? renderWeeklyFlow() : renderMonthlyMood();
}

function renderWeeklyFlow() {
    weeklyChart.innerHTML = ""; let hasFlow = false;
    for (let i = 6; i >= 0; i--) {
        const d = new Date(new Date().setDate(new Date().getDate() - i));
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        let flowLvl = 0;
        if (trackerData[dateStr]?.flow) {
            const f = trackerData[dateStr].flow;
            if (f === 'light') flowLvl = 1; if (f === 'medium') flowLvl = 2; if (f === 'heavy') flowLvl = 3;
            if (flowLvl > 0) hasFlow = true;
        }
        createBar(weeklyChart, flowLvl === 0 ? 5 : (flowLvl / 3) * 100, flowLvl === 3, d.toLocaleDateString('default', { weekday: 'short' }).charAt(0));
    }
    adviceBox.innerHTML = hasFlow ? `<strong>Rest & Hydrate</strong>Your body is actively shedding. Limit caffeine and allow yourself gentle movements.` : `<strong>Follicular/Luteal Phase</strong>No flow detected recently. This is a great time to focus on steady routines.`;
}

function renderMonthlyMood() {
    const yr = currentDate.getFullYear(), mo = String(currentDate.getMonth() + 1).padStart(2, '0');
    let counts = { calm: 0, sensitive: 0, cramps: 0, fatigue: 0 };
    Object.keys(trackerData).forEach(d => { if (d.startsWith(`${yr}-${mo}`) && counts[trackerData[d].mood] !== undefined) counts[trackerData[d].mood]++; });
    
    monthlyChart.innerHTML = "";
    const max = Math.max(...Object.values(counts));
    let domMood = 'none', high = 0;
    
    Object.keys(counts).forEach(m => {
        if (counts[m] > high) { high = counts[m]; domMood = m; }
        createBar(monthlyChart, max === 0 ? 5 : Math.max(10, (counts[m] / max) * 100), counts[m] === max && max > 0, m);
    });
    
    const careInfo = careMeasures[high === 0 ? 'none' : domMood];
    adviceBox.innerHTML = `<strong>${careInfo.title}</strong>${careInfo.advice}`;
}

function createBar(container, height, isHighest, label) {
    const w = document.createElement("div"); w.className = "bar-wrapper";
    w.innerHTML = `<div class="glass-bar ${isHighest ? 'highest' : ''}" style="height: ${height}%;"></div><span class="bar-label">${label}</span>`;
    container.appendChild(w);
}

// Calendar & Logging
function renderCalendar() {
    calendarGrid.innerHTML = "";
    const yr = currentDate.getFullYear(), mo = currentDate.getMonth();
    const firstDay = new Date(yr, mo, 1).getDay(), days = new Date(yr, mo + 1, 0).getDate();
    currentMonthText.textContent = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    for (let i = 0; i < firstDay; i++) calendarGrid.innerHTML += `<div class="day-cell empty"></div>`;
    
    const today = new Date();
    for (let day = 1; day <= days; day++) {
        const cell = document.createElement("div"); cell.className = "day-cell"; cell.textContent = day;
        const dateStr = `${yr}-${String(mo + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        if (day === today.getDate() && mo === today.getMonth() && yr === today.getFullYear()) cell.classList.add("today");
        if (trackerData[dateStr]?.flow && trackerData[dateStr].flow !== 'none') cell.classList.add("has-flow");
        if (trackerData[dateStr]?.mood && trackerData[dateStr].mood !== 'none') cell.classList.add("has-mood");

        cell.addEventListener("click", () => {
            selectedDateString = dateStr;
            selectedDateText.textContent = new Date(dateStr).toLocaleDateString('default', { weekday: 'long', month: 'short', day: 'numeric' });
            currentSelections = trackerData[dateStr] || { flow: 'none', mood: 'none' };
            updateChips(); logDrawer.classList.remove("hidden"); overlay.classList.remove("hidden");
        });
        calendarGrid.appendChild(cell);
    }
    renderInsights();
}

function updateChips() {
    chips.forEach(c => c.classList.toggle("active", currentSelections[c.dataset.type] === c.dataset.val));
}

chips.forEach(c => c.addEventListener("click", e => { currentSelections[e.target.dataset.type] = e.target.dataset.val; updateChips(); }));

saveBtn.addEventListener("click", () => {
    if (selectedDateString) {
        trackerData[selectedDateString] = { ...currentSelections };
        localStorage.setItem("flowTrackerData", JSON.stringify(trackerData));
        renderCalendar(); logDrawer.classList.add("hidden"); overlay.classList.add("hidden");
        updateDailyQuote(); flipCard.classList.remove("flipped");
        for(let i=0; i<15; i++) setTimeout(spawnFlower, i*150);
    }
});

// Navigation & Effects
document.getElementById("prev-month").addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() - 1); renderCalendar(); });
document.getElementById("next-month").addEventListener("click", () => { currentDate.setMonth(currentDate.getMonth() + 1); renderCalendar(); });
overlay.addEventListener("click", () => { logDrawer.classList.add("hidden"); settingsModal.classList.add("hidden"); overlay.classList.add("hidden"); });

function spawnFlower() {
    const f = document.createElement("div"); f.className = "glitter-flower";
    f.textContent = ['🌸', '✨', '💖', '🌿', '🦋'][Math.floor(Math.random() * 5)];
    f.style.left = Math.random() * 100 + "vw"; f.style.fontSize = (Math.random() * 1 + 1) + "rem";
    const d = Math.random() * 3 + 4; f.style.animationDuration = `${d}s, 1.5s`;
    document.getElementById("flower-container").appendChild(f);
    setTimeout(() => f.remove(), d * 1000);
}
setInterval(spawnFlower, 3000);

initApp();
