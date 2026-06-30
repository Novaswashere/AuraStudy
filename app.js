/* ==========================================================================
   AuraStudy Main JavaScript - State, Clocks, Drag Layout, Real Audio, Videos
   ========================================================================== */

// --------------------------------------------------------------------------
// 1. Initial State & Configuration
// --------------------------------------------------------------------------

let state = {
    onboarded: false,
    goal: "consistency",
    struggle: "distractions",
    theme: "aesthetic",
    dailyGoalMins: 60,
    streak: 0,
    lastActiveDate: "", // YYYY-MM-DD
    sessions: [], // { id, subject, duration, date, timestamp }
    clockFormat12: true,
    clockModeDigital: true,
    widgetsVisibility: {
        "widget-pomodoro": true,
        "widget-stopwatch": true,
        "widget-clocks": true,
        "widget-tracker": true,
        "widget-streak": true,
        "widget-analytics": true,
        "widget-music": true
    },
    pomo: {
        focus: 25,
        short: 5,
        long: 15
    },
    backgroundVideo: "none", 
    alarmSound: "aesthetic",  
    musicCollapsed: false,
    ambientVolSettings: {    
        rain: 0,
        fireplace1: 0,
        fireplace2: 0,
        rainy_town: 0
    },
    widgetOrder: [
        "widget-pomodoro",
        "widget-stopwatch",
        "widget-clocks",
        "widget-tracker",
        "widget-streak",
        "widget-analytics",
        "widget-music"
    ],
    pomoSessionsCompleted: 0,
    auraXp: 0,
    auraLevel: 1,
    gardenJournal: [],
    synthVolume: 0
};

// Application Timers State
let pomoTimerInterval = null;
let pomoTimeRemaining = 0; 
let pomoActiveMode = "focus"; 
let pomoIsRunning = false;

let stopwatchInterval = null;
let stopwatchStartTime = 0;
let stopwatchElapsed = 0; // ms
let stopwatchIsRunning = false;
let stopwatchLaps = [];

let ytIsPlaying = false;

// Chart.js instance
let analyticsChartInstance = null;
let activeChartRange = "week"; // week, month

// Web Audio API context for Synth Alarms
let audioCtx = null;

// Available Audio Streams
let activeAmbientStreams = {
    rain: false,
    fireplace1: false,
    fireplace2: false,
    rainy_town: false
};

// Edit Mode Drag state
let draggedWidgetId = null;
let isEditMode = false;

// --------------------------------------------------------------------------
// 2. Application Init & Lifecycle
// --------------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    loadStateFromStorage();
    initTheme();
    initVideoBackground();
    initOnboarding();
    initClocks();
    applyWidgetOrder();
    initWidgetsVisibility();
    initPomodoro();
    renderStreaks();
    renderRecentSessions();
    renderStats();
    renderCharts();
    initMusicPanel();
    renderTodoList();
    setDailyQuote();
    renderAuraStatus();
    updateFloraGrowth(0);
    renderGardenJournal();

    // Check if music was saved as collapsed
    if (state.musicCollapsed) {
        document.getElementById("widget-music").classList.add("collapsed");
        document.getElementById("music-collapse-icon").setAttribute("data-lucide", "maximize-2");
        
        // Ensure it restores the docked state position
        const musicWidget = document.getElementById("widget-music");
        if(musicWidget) {
            const rect = musicWidget.getBoundingClientRect();
            const centerX = rect.left + (rect.width / 2);
            if (centerX < window.innerWidth / 2) {
                musicWidget.classList.add("collapsed-docked-left");
            } else {
                musicWidget.classList.add("collapsed-docked-right");
            }
        }
    }
    
    // Initialize Lucide Icons
    if (window.lucide) {
        lucide.createIcons();
    }

    // Check if date changed since last load to roll over daily goals
    checkDateRollover();
});

// --------------------------------------------------------------------------
// 2.5 Daily Motivational Quote
// --------------------------------------------------------------------------

const MOTIVATIONAL_QUOTES = [
    "“The secret of getting ahead is getting started.” — Mark Twain",
    "“It always seems impossible until it's done.” — Nelson Mandela",
    "“Don’t let what you cannot do interfere with what you can do.” — John Wooden",
    "“Strive for progress, not perfection.” — Unknown",
    "“There are no shortcuts to any place worth going.” — Beverly Sills",
    "“Success is the sum of small efforts, repeated day in and day out.” — Robert Collier",
    "“You don’t have to be great to start, but you have to start to be great.” — Zig Ziglar",
    "“The expert in anything was once a beginner.” — Helen Hayes",
    "“Focus on being productive instead of busy.” — Tim Ferriss",
    "“Do what you can, with what you have, where you are.” — Theodore Roosevelt"
];

function setDailyQuote() {
    const quoteContainer = document.getElementById('header-motivational-quote');
    if (quoteContainer) {
        const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
        quoteContainer.innerText = MOTIVATIONAL_QUOTES[randomIndex];
    }
}

function loadStateFromStorage() {
    const saved = localStorage.getItem("aurastudy_state");
    if (saved) {
        try {
            state = { ...state, ...JSON.parse(saved) };
            
            // Ensure volume setting cache exists
            if (!state.ambientVolSettings || state.ambientVolSettings.white !== undefined || state.ambientVolSettings.brown !== undefined || state.ambientVolSettings.ocean !== undefined) {
                state.ambientVolSettings = { rain: 0, fireplace1: 0, fireplace2: 0, rainy_town: 0 };
            }
            
            // Ensure widgetOrder structure exists
            if (!state.widgetOrder || state.widgetOrder.length === 0) {
                state.widgetOrder = [
                    "widget-pomodoro",
                    "widget-stopwatch",
                    "widget-clocks",
                    "widget-tracker",
                    "widget-streak",
                    "widget-analytics",
                    "widget-music"
                ];
            }

            // Ensure Aura Flora variables exist
            if (typeof state.auraXp !== "number" || isNaN(state.auraXp)) {
                state.auraXp = 0;
            }
            if (typeof state.auraLevel !== "number" || isNaN(state.auraLevel) || state.auraLevel < 1) {
                state.auraLevel = 1;
            }
            if (!Array.isArray(state.gardenJournal)) {
                state.gardenJournal = [];
            }
            if (typeof state.synthVolume !== "number" || isNaN(state.synthVolume)) {
                state.synthVolume = 0;
            }
        } catch (e) {
            console.error("Failed to parse saved state, using defaults", e);
        }
    }
}

function saveStateToStorage() {
    localStorage.setItem("aurastudy_state", JSON.stringify(state));
}

function checkDateRollover() {
    const today = getTodayDateString();
    if (state.lastActiveDate !== today) {
        verifyStreakValidity();
        state.lastActiveDate = today;
        saveStateToStorage();
    }
}

function getTodayDateString() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
}

// --------------------------------------------------------------------------
// 3. Onboarding & Welcome Back Check-in
// --------------------------------------------------------------------------

let currentOnboardingStep = 1;

function initOnboarding() {
    const modal = document.getElementById("onboarding-modal");
    
    if (state.onboarded) {
        showStep(6);
        
        document.getElementById("back-streak-count").textContent = `${calculateConsecutiveStreak()} Days`;
        document.getElementById("back-goal-mins").textContent = `${state.dailyGoalMins} Mins`;
        
        const todayStr = getTodayDateString();
        const minsToday = getDailyStudyMinutes(todayStr);
        const welcomeMsg = document.getElementById("welcome-back-message");
        
        if (minsToday >= state.dailyGoalMins) {
            welcomeMsg.textContent = "Congrats! You've achieved your study goal today. Ready to study more?";
        } else if (minsToday > 0) {
            welcomeMsg.textContent = `You've logged ${minsToday} minutes so far today. Let's finish the remaining ${state.dailyGoalMins - minsToday} minutes!`;
        } else {
            welcomeMsg.textContent = "Welcome back! Let's check in and start your first study block.";
        }
        modal.classList.add("active");
    } else {
        modal.classList.add("active");
        showStep(1);
    }
}

function showStep(stepNum) {
    document.querySelectorAll(".onboarding-step").forEach(el => {
        el.classList.remove("active");
    });
    
    let stepId = `step-${stepNum}`;
    if (stepNum === 6) stepId = "welcome-back-step";
    
    const stepEl = document.getElementById(stepId);
    if (stepEl) {
        stepEl.classList.add("active");
    }
    currentOnboardingStep = stepNum;
}

function nextOnboardingStep() {
    if (currentOnboardingStep < 5) {
        showStep(currentOnboardingStep + 1);
    }
}

function prevOnboardingStep() {
    if (currentOnboardingStep > 1 && currentOnboardingStep < 6) {
        showStep(currentOnboardingStep - 1);
    }
}

const layoutPresets = {
    consistency: [
        "widget-pomodoro",
        "widget-stopwatch",
        "widget-streak",
        "widget-clocks",
        "widget-tracker",
        "widget-music",
        "widget-analytics"
    ],
    focus: [
        "widget-pomodoro",
        "widget-music",
        "widget-clocks",
        "widget-stopwatch",
        "widget-tracker",
        "widget-streak",
        "widget-analytics"
    ],
    exams: [
        "widget-analytics",
        "widget-tracker",
        "widget-pomodoro",
        "widget-clocks",
        "widget-streak",
        "widget-stopwatch",
        "widget-music"
    ]
};

function finishOnboarding() {
    const goalVal = document.querySelector('input[name="study-goal"]:checked').value;
    const struggleVal = document.querySelector('input[name="study-struggle"]:checked').value;
    const themeVal = document.querySelector('input[name="selected-theme"]:checked').value;
    const backdropVal = document.querySelector('input[name="selected-backdrop"]:checked').value;

    // Parse homescreen modules customization
    const modules = document.querySelectorAll('input[name="onboard-module"]');
    modules.forEach(cb => {
        state.widgetsVisibility[cb.value] = cb.checked;
        const switchEl = document.getElementById("toggle-" + cb.value.replace("widget-", ""));
        if (switchEl) switchEl.checked = cb.checked;
    });

    // Preset positions based on Goal!
    if (layoutPresets[goalVal]) {
        state.widgetOrder = JSON.parse(JSON.stringify(layoutPresets[goalVal]));
    } else {
        state.widgetOrder = JSON.parse(JSON.stringify(layoutPresets.focus));
    }

    state.goal = goalVal;
    state.struggle = struggleVal;
    state.theme = themeVal;
    state.backgroundVideo = backdropVal;
    state.onboarded = true;
    state.lastActiveDate = getTodayDateString();

    saveStateToStorage();
    setTheme(themeVal);
    setBackgroundImage(backdropVal);
    initWidgetsVisibility();
    applyWidgetOrder();
    
    closeOnboardingModal();
    triggerConfetti(0.25);
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add("active");
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        const card = modal.querySelector(".modal-card");
        if (card) card.classList.add("scale-out");
        setTimeout(() => {
            modal.classList.remove("active");
            if (card) card.classList.remove("scale-out");
        }, 300);
    }
}

function closeWelcomeBack() {
    closeModal("onboarding-modal");
    initAudioContext(); 
}

function closeOnboardingModal() {
    closeModal("onboarding-modal");
}

// --------------------------------------------------------------------------
// 4. Dynamic Theme & Background Videos
// --------------------------------------------------------------------------

function initTheme() {
    setTheme(state.theme, false);
}

function setTheme(themeName, shouldSave = true) {
    state.theme = themeName;
    document.body.setAttribute("data-theme", themeName);
    
    const labels = {
        aesthetic: "Cozy Aesthetic",
        minimalist: "Minimalist",
        cyberpunk: "Cyberpunk",
        anime: "Cute Anime",
        watercolour: "Watercolour"
    };
    
    const labelEl = document.getElementById("active-theme-label");
    if (labelEl) {
        labelEl.textContent = labels[themeName] || "Cozy";
    }

    // Clear and redraw the Flora SVG structure to match the new vibe theme!
    const container = document.getElementById("aura-flora-svg-container");
    if (container) {
        container.innerHTML = "";
        let progress = 0;
        if (pomoIsRunning) {
            progress = (pomoTotalDuration - pomoTimeRemaining) / pomoTotalDuration;
        } else if (stopwatchIsRunning) {
            progress = Math.min(1.0, Math.floor(stopwatchElapsed / 1000) / 3600);
        }
        updateFloraGrowth(progress);
    }

    if (analyticsChartInstance) {
        renderCharts();
    }

    if (shouldSave) {
        saveStateToStorage();
    }

    const menu = document.getElementById("theme-menu");
    if (menu) menu.classList.remove("active");
}

function toggleThemeDropdown() {
    document.getElementById("backdrop-menu")?.classList.remove("active");
    const menu = document.getElementById("theme-menu");
    menu.classList.toggle("active");
}

function toggleBackdropDropdown() {
    document.getElementById("theme-menu")?.classList.remove("active");
    const menu = document.getElementById("backdrop-menu");
    menu.classList.toggle("active");
}

// Background image options (Ken Burns animated loops)
const backgroundImages = {
    lofi: "images/lofi girl.png",
    cafe: "images/rainy cafe.png",
    fireplace: "images/cozy fireplace.png",
    cyberpunk: "images/cyberpunk rain.png"
};

function initVideoBackground() {
    setBackgroundImage(state.backgroundVideo || "none", false);
}

function setBackgroundImage(type, shouldSave = true) {
    state.backgroundVideo = type;
    const container = document.getElementById("video-bg-container");
    if (!container) return;
    
    // Sync all options with data-bg attribute
    document.querySelectorAll(".video-opt-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-bg") === type) {
            btn.classList.add("active");
        }
    });

    const backdropLabels = {
        none: "None",
        lofi: "Lofi Girl",
        cafe: "Rainy Cafe",
        fireplace: "Fireplace",
        cyberpunk: "Cyberpunk"
    };

    const labelEl = document.getElementById("active-backdrop-label");
    if (labelEl) {
        labelEl.textContent = backdropLabels[type] || "None";
    }

    // Remove previous background classes from body
    document.body.classList.remove("bg-lofi", "bg-cafe", "bg-fireplace", "bg-cyberpunk");

    if (type === "none" || !backgroundImages[type]) {
        container.innerHTML = "";
        document.body.classList.remove("video-active");
    } else {
        const imgUrl = backgroundImages[type];
        container.innerHTML = `<img src="${imgUrl}" class="backdrop-img" alt="Backdrop">`;
        document.body.classList.add("video-active");
        document.body.classList.add("bg-" + type);
    }

    // Close the quick select menu if open
    document.getElementById("backdrop-menu")?.classList.remove("active");

    if (shouldSave) {
        saveStateToStorage();
    }
}

// Legacy wrapper to prevent any uncaught exceptions
function setBackgroundVideo(type, shouldSave = true) {
    setBackgroundImage(type, shouldSave);
}

// Close dropdown when clicking outside
window.addEventListener("click", (e) => {
    // If not clicking theme dropdown container, close theme menu
    const themeContainer = document.getElementById("theme-btn")?.closest(".theme-dropdown-container");
    if (themeContainer && !themeContainer.contains(e.target)) {
        document.getElementById("theme-menu")?.classList.remove("active");
    }
    // If not clicking backdrop dropdown container, close backdrop menu
    const backdropContainer = document.getElementById("backdrop-btn")?.closest(".theme-dropdown-container");
    if (backdropContainer && !backdropContainer.contains(e.target)) {
        document.getElementById("backdrop-menu")?.classList.remove("active");
    }
});

// --------------------------------------------------------------------------
// 5. Redesigned Tabbed Settings Modal
// --------------------------------------------------------------------------

function toggleSettingsModal() {
    const modal = document.getElementById("settings-modal");
    const isActive = modal.classList.contains("active");
    
    if (isActive) {
        modal.querySelector(".modal-card").classList.add("scale-out");
        setTimeout(() => {
            modal.classList.remove("active");
            modal.querySelector(".modal-card").classList.remove("scale-out");
        }, 300);
    } else {
        document.getElementById("daily-goal-input-settings").value = state.dailyGoalMins;
        document.getElementById("settings-pomo-focus").value = state.pomo.focus;
        document.getElementById("settings-pomo-short").value = state.pomo.short;
        document.getElementById("settings-pomo-long").value = state.pomo.long;

        document.querySelectorAll(".sound-opt-btn").forEach(btn => {
            btn.classList.remove("active");
        });
        const activeSoundBtn = document.getElementById("sound-opt-" + state.alarmSound);
        if (activeSoundBtn) activeSoundBtn.classList.add("active");

        switchSettingsTab("layout");
        modal.classList.add("active");
    }
}

function switchSettingsTab(tabName) {
    document.querySelectorAll(".settings-tab-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    document.getElementById("settings-tab-btn-" + tabName).classList.add("active");

    document.querySelectorAll(".settings-tab-content").forEach(content => {
        content.classList.remove("active");
    });
    document.getElementById("settings-tab-content-" + tabName).classList.add("active");
}

function selectAlertSound(soundName) {
    state.alarmSound = soundName;
    document.querySelectorAll(".sound-opt-btn").forEach(btn => {
        btn.classList.remove("active");
    });
    document.getElementById("sound-opt-" + soundName).classList.add("active");
    
    synthesizeAlertSound();
}

function testSelectedAlertSound() {
    synthesizeAlertSound();
}

function saveAllSettings() {
    const goalVal = parseInt(document.getElementById("daily-goal-input-settings").value, 10);
    const pomoFocus = parseInt(document.getElementById("settings-pomo-focus").value, 10);
    const pomoShort = parseInt(document.getElementById("settings-pomo-short").value, 10);
    const pomoLong = parseInt(document.getElementById("settings-pomo-long").value, 10);

    if (goalVal && pomoFocus && pomoShort && pomoLong) {
        state.dailyGoalMins = goalVal;
        state.pomo.focus = pomoFocus;
        state.pomo.short = pomoShort;
        state.pomo.long = pomoLong;
        
        const goalEl = document.getElementById("daily-goal-input");
        if (goalEl) goalEl.value = goalVal;
        
        document.getElementById("input-focus").value = pomoFocus;
        document.getElementById("input-short-break").value = pomoShort;
        document.getElementById("input-long-break").value = pomoLong;

        saveStateToStorage();
        resetPomodoro();
        renderStreaks();
        renderStats();
        
        toggleSettingsModal();
    } else {
        alert("Please enter valid positive values for all intervals.");
    }
}

function initWidgetsVisibility() {
    for (const [widgetId, isVisible] of Object.entries(state.widgetsVisibility)) {
        const widgetEl = document.getElementById(widgetId);
        const toggleInput = document.getElementById("toggle-" + widgetId.replace("widget-", ""));
        
        if (widgetEl) {
            if (isVisible) widgetEl.classList.remove("hidden");
            else widgetEl.classList.add("hidden");
        }
        
        if (toggleInput) {
            toggleInput.checked = isVisible;
        }
    }
}

function toggleWidgetVisibility(widgetId, forcedVal = null) {
    let isVisible = false;
    
    if (forcedVal !== null) {
        isVisible = forcedVal;
    } else {
        const toggleInput = document.getElementById("toggle-" + widgetId.replace("widget-", ""));
        const drawerInput = document.querySelector(`.drawer-widget-toggle[data-widget-id="${widgetId}"]`);
        
        if (drawerInput) {
            isVisible = drawerInput.checked;
        } else if (toggleInput) {
            isVisible = toggleInput.checked;
        } else {
            isVisible = !state.widgetsVisibility[widgetId];
        }
    }
    
    state.widgetsVisibility[widgetId] = isVisible;
    saveStateToStorage();
    initWidgetsVisibility();
    
    // Keep checkboxes synced
    const settingsSwitch = document.getElementById("toggle-" + widgetId.replace("widget-", ""));
    if (settingsSwitch) settingsSwitch.checked = isVisible;
    const drawerSwitch = document.querySelector(`.drawer-widget-toggle[data-widget-id="${widgetId}"]`);
    if (drawerSwitch) drawerSwitch.checked = isVisible;
}

function resetApp() {
    if (confirm("Are you sure you want to clear all data? This will reset all your logs, streak records, goals, and visual styles.")) {
        localStorage.removeItem("aurastudy_state");
        window.location.reload();
    }
}

// 5.1 Slide-Out Layout Customizer Drawer
// --------------------------------------------------------------------------

function toggleLayoutDrawer() {
    const drawer = document.getElementById("layout-drawer");
    const editBtn = document.getElementById("edit-mode-btn");
    
    if (drawer) {
        drawer.classList.toggle("active");
        if (drawer.classList.contains("active")) {
            editBtn.classList.add("active");
            renderLayoutList();
        } else {
            editBtn.classList.remove("active");
        }
    }
}

const widgetFriendlyNames = {
    "widget-pomodoro": { name: "Pomodoro Workspace", icon: "timer" },
    "widget-stopwatch": { name: "Session Stopwatch", icon: "clock" },
    "widget-clocks": { name: "Clock Station", icon: "globe" },
    "widget-tracker": { name: "To-Do & Logger", icon: "clipboard-list" },
    "widget-streak": { name: "Gamified Streaks", icon: "award" },
    "widget-analytics": { name: "Focus Analytics", icon: "bar-chart-2" },
    "widget-music": { name: "Audio Workspace", icon: "music" }
};

function renderLayoutList() {
    const list = document.getElementById("edit-layout-list");
    if (!list) return;
    list.innerHTML = "";

    // Fallback if order is missing
    if (!state.widgetOrder || state.widgetOrder.length === 0) {
        state.widgetOrder = [
            "widget-pomodoro",
            "widget-stopwatch",
            "widget-clocks",
            "widget-tracker",
            "widget-streak",
            "widget-analytics",
            "widget-music"
        ];
    }

    state.widgetOrder.forEach(widgetId => {
        const meta = widgetFriendlyNames[widgetId];
        if (!meta) return;

        const li = document.createElement("li");
        li.className = "edit-layout-item";
        li.setAttribute("draggable", "true");
        li.setAttribute("data-widget-id", widgetId);

        const visible = state.widgetsVisibility ? state.widgetsVisibility[widgetId] !== false : true;

        li.innerHTML = `
            <div class="edit-layout-item-left">
                <i data-lucide="grip-vertical" class="drag-handle"></i>
                <i data-lucide="${meta.icon}"></i>
                <span class="item-name">${meta.name}</span>
            </div>
            <label class="toggle-switch-container" style="margin: 0;">
                <input type="checkbox" class="drawer-widget-toggle" data-widget-id="${widgetId}" ${visible ? 'checked' : ''}>
                <span class="toggle-slider"></span>
            </label>
        `;

        // Toggle checkbox change event
        const checkbox = li.querySelector(".drawer-widget-toggle");
        checkbox.addEventListener("change", (e) => {
            const id = e.target.getAttribute("data-widget-id");
            toggleWidgetVisibility(id);
            // Sync with settings switches if open
            const settingsSwitch = document.getElementById("toggle-" + id.replace("widget-", ""));
            if (settingsSwitch) settingsSwitch.checked = e.target.checked;
        });

        list.appendChild(li);
    });

    if (window.lucide) lucide.createIcons();

    // Attach drag & drop sorting listeners inside the list
    initListSorting();
}

let draggedListId = null;

function initListSorting() {
    const list = document.getElementById("edit-layout-list");
    if (!list) return;

    list.querySelectorAll("li").forEach(item => {
        item.addEventListener("dragstart", (e) => {
            draggedListId = item.getAttribute("data-widget-id");
            e.dataTransfer.effectAllowed = "move";
            item.classList.add("sorting");
        });

        item.addEventListener("dragend", () => {
            item.classList.remove("sorting");
            draggedListId = null;
        });

        item.addEventListener("dragover", (e) => {
            e.preventDefault();
            const targetItem = e.target.closest("li");
            if (targetItem && draggedListId) {
                const targetId = targetItem.getAttribute("data-widget-id");
                if (draggedListId !== targetId) {
                    const rect = targetItem.getBoundingClientRect();
                    const next = (e.clientY - rect.top) / (rect.bottom - rect.top) > 0.5;
                    const draggedItem = list.querySelector(`[data-widget-id="${draggedListId}"]`);
                    if (draggedItem) {
                        list.insertBefore(draggedItem, next ? targetItem.nextSibling : targetItem);
                    }
                }
            }
        });

        item.addEventListener("drop", (e) => {
            e.preventDefault();
            const newOrder = Array.from(list.children).map(li => li.getAttribute("data-widget-id"));
            state.widgetOrder = newOrder;
            saveStateToStorage();
            applyWidgetOrder();
        });
    });
}

function deleteWidget(event, widgetId) {
    event.stopPropagation();
    state.widgetsVisibility[widgetId] = false;
    saveStateToStorage();
    initWidgetsVisibility();
    renderLayoutList();

    const hasDeleted = localStorage.getItem("aurastudy_has_deleted_widget");
    if (!hasDeleted) {
        openModal("hidden-widget-modal");
        localStorage.setItem("aurastudy_has_deleted_widget", "true");
    }
}

function resetWidgetLayout() {
    state.widgetOrder = [
        "widget-pomodoro",
        "widget-stopwatch",
        "widget-clocks",
        "widget-tracker",
        "widget-streak",
        "widget-analytics",
        "widget-music"
    ];
    
    for (const key of Object.keys(state.widgetsVisibility)) {
        state.widgetsVisibility[key] = true;
    }

    saveStateToStorage();
    applyWidgetOrder();
    initWidgetsVisibility();
    renderLayoutList();
    
    alert("Dashboard layout positions and visibility restored to default!");
}

function applyWidgetOrder() {
    const grid = document.getElementById("main-grid");
    if (!grid) return;

    if (!state.widgetOrder || state.widgetOrder.length === 0) {
        state.widgetOrder = [
            "widget-pomodoro",
            "widget-stopwatch",
            "widget-clocks",
            "widget-tracker",
            "widget-streak",
            "widget-analytics",
            "widget-music"
        ];
        saveStateToStorage();
    }

    state.widgetOrder.forEach(widgetId => {
        const el = document.getElementById(widgetId);
        if (el) {
            // Remove any leftover inline styles from old snapping system
            el.style.removeProperty("grid-column");
            el.style.removeProperty("grid-row");
            grid.appendChild(el); 
        }
    });
}


// --------------------------------------------------------------------------
// 6. Aesthetic Clocks (Digital & Analog)
// --------------------------------------------------------------------------

function initClocks() {
    updateClocks();
    setInterval(updateClocks, 1000);
}

function updateClocks() {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    const is12Hour = state.clockFormat12;
    let ampm = "";

    if (is12Hour) {
        ampm = hours >= 12 ? "PM" : "AM";
        hours = hours % 12;
        hours = hours ? hours : 12; 
    }
    
    const formattedHours = String(hours).padStart(2, '0');

    // Update Header Clock
    document.getElementById("header-time-display").textContent = `${formattedHours}:${minutes}:${seconds}`;
    document.getElementById("header-ampm-display").textContent = ampm;

    // Update Widget Digital Clock
    const digitalClockTimeEl = document.getElementById("digital-clock-time");
    const digitalClockSecsEl = document.getElementById("digital-clock-seconds");
    const digitalClockAmpmEl = document.getElementById("digital-clock-ampm");

    if (digitalClockTimeEl) {
        digitalClockTimeEl.textContent = `${formattedHours}:${minutes}`;
        digitalClockSecsEl.textContent = seconds;
        digitalClockAmpmEl.textContent = ampm;
    }

    // Update Analog Clock Hands
    const analogHourHand = document.getElementById("analog-hour");
    const analogMinuteHand = document.getElementById("analog-minute");
    const analogSecondHand = document.getElementById("analog-second");

    if (analogHourHand) {
        const rawHours = now.getHours();
        const rawMinutes = now.getMinutes();
        const rawSeconds = now.getSeconds();

        const secDeg = (rawSeconds / 60) * 360;
        const minDeg = ((rawMinutes + rawSeconds / 60) / 60) * 360;
        const hourDeg = (((rawHours % 12) + rawMinutes / 60) / 12) * 360;

        analogSecondHand.style.transform = `translateX(-50%) rotate(${secDeg}deg)`;
        analogMinuteHand.style.transform = `translateX(-50%) rotate(${minDeg}deg)`;
        analogHourHand.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
    }
}

function setClockDisplayMode(mode) {
    const digitalDiv = document.getElementById("digital-clock-display");
    const analogDiv = document.getElementById("analog-clock-display");
    const btnDigital = document.getElementById("clock-mode-digital");
    const btnAnalog = document.getElementById("clock-mode-analog");

    if (mode === "digital") {
        digitalDiv.style.display = "flex";
        analogDiv.style.display = "none";
        btnDigital.classList.add("active");
        btnAnalog.classList.remove("active");
        state.clockModeDigital = true;
    } else {
        digitalDiv.style.display = "none";
        analogDiv.style.display = "block";
        btnDigital.classList.remove("active");
        btnAnalog.classList.add("active");
        state.clockModeDigital = false;
    }
    saveStateToStorage();
}

function toggleClockFormat() {
    state.clockFormat12 = !state.clockFormat12;
    document.getElementById("clock-format-toggle").textContent = state.clockFormat12 ? "12-Hour" : "24-Hour";
    saveStateToStorage();
    updateClocks();
}

// --------------------------------------------------------------------------
// 7. Pomodoro Timer Widget
// --------------------------------------------------------------------------

function initPomodoro() {
    setPomodoroMode("focus");
}

function setPomodoroMode(mode) {
    pomoActiveMode = mode;
    
    document.querySelectorAll(".pomodoro-modes .mode-btn").forEach(el => {
        el.classList.remove("active");
    });
    
    if (mode === "focus") {
        document.getElementById("pomo-mode-focus").classList.add("active");
        pomoTimeRemaining = state.pomo.focus * 60;
        document.getElementById("pomo-status-label").textContent = "Time to focus!";
    } else if (mode === "short-break") {
        document.getElementById("pomo-mode-short").classList.add("active");
        pomoTimeRemaining = state.pomo.short * 60;
        document.getElementById("pomo-status-label").textContent = "Take a short rest.";
    } else if (mode === "long-break") {
        document.getElementById("pomo-mode-long").classList.add("active");
        pomoTimeRemaining = state.pomo.long * 60;
        document.getElementById("pomo-status-label").textContent = "Take a well-deserved break!";
    }

    if (pomoIsRunning) {
        togglePomodoro(); 
    }

    updatePomodoroDisplay();
}

function updatePomodoroDisplay() {
    const mins = Math.floor(pomoTimeRemaining / 60);
    const secs = pomoTimeRemaining % 60;
    const formattedTime = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    
    document.getElementById("pomo-time").textContent = formattedTime;
    
    const modeEmoji = pomoActiveMode === "focus" ? "🎯" : "☕";
    document.title = `${formattedTime} ${modeEmoji} AuraStudy`;

    let maxTimeSeconds = 25 * 60;
    if (pomoActiveMode === "focus") maxTimeSeconds = state.pomo.focus * 60;
    else if (pomoActiveMode === "short-break") maxTimeSeconds = state.pomo.short * 60;
    else if (pomoActiveMode === "long-break") maxTimeSeconds = state.pomo.long * 60;

    const ratio = pomoTimeRemaining / maxTimeSeconds;
    const circumference = 2 * Math.PI * 100;
    const offset = circumference - (ratio * circumference);
    
    const circle = document.getElementById("pomodoro-progress");
    if (circle) {
        circle.style.strokeDasharray = `${circumference} ${circumference}`;
        circle.style.strokeDashoffset = offset;
    }
}

function togglePomodoro() {
    const playBtn = document.getElementById("pomo-play-btn");
    const playIcon = document.getElementById("pomo-play-icon");

    if (pomoIsRunning) {
        clearInterval(pomoTimerInterval);
        pomoIsRunning = false;
        playIcon.setAttribute("data-lucide", "play");
        playBtn.classList.remove("active");
        document.getElementById("pomo-status-label").textContent = "Session paused.";
    } else {
        pomoIsRunning = true;
        playIcon.setAttribute("data-lucide", "pause");
        playBtn.classList.add("active");
        
        if (pomoActiveMode === "focus") document.getElementById("pomo-status-label").textContent = "Keep it up!";
        else document.getElementById("pomo-status-label").textContent = "Rest mode active.";

        pomoTimerInterval = setInterval(() => {
            pomoTimeRemaining--;
            updatePomodoroDisplay();

            // Grow plant!
            const elapsed = pomoTotalDuration - pomoTimeRemaining;
            const progress = elapsed / pomoTotalDuration;
            updateFloraGrowth(progress);

            // Speed up synth tempo scale (every 10 seconds)
            if (elapsed > 0 && elapsed % 10 === 0) {
                startSynthLoop();
            }

            if (pomoTimeRemaining <= 0) {
                clearInterval(pomoTimerInterval);
                pomoTimerComplete();
            }
        }, 1000);
    }
    lucide.createIcons();
}

function resetPomodoro() {
    clearInterval(pomoTimerInterval);
    pomoIsRunning = false;
    
    const playBtn = document.getElementById("pomo-play-btn");
    const playIcon = document.getElementById("pomo-play-icon");
    playIcon.setAttribute("data-lucide", "play");
    playBtn.classList.remove("active");
    
    setPomodoroMode(pomoActiveMode);
    lucide.createIcons();
}

function pomoTimerComplete() {
    synthesizeAlertSound();

    if (pomoActiveMode === "focus") {
        const logDuration = state.pomo.focus;
        logStudySession("Pomodoro Focus Session", logDuration);
        triggerConfetti(0.4);
        
        state.pomoSessionsCompleted = (state.pomoSessionsCompleted || 0) + 1;
        saveStateToStorage();

        // Award Flora XP & Bloom plant!
        awardAuraXp(40);
        addToGardenJournal();

        if (state.pomoSessionsCompleted % 2 === 0) {
            setPomodoroMode("long-break");
            alert("2 Pomodoro focus sessions complete! Your Aura plant bloomed and you gained 90 XP in total. Starting a long break.");
        } else {
            setPomodoroMode("short-break");
            alert("Focus session complete! Your Aura plant bloomed and you gained 90 XP in total. Starting a short break.");
        }
    } else {
        setPomodoroMode("focus");
        alert("Break is over! Time to get back to focus.");
    }
    
    // Automatically chain and start the timer
    pomoIsRunning = false;
    togglePomodoro();
}

function togglePomoSettings() {
    const panel = document.getElementById("pomo-settings");
    panel.classList.toggle("active");
}

function savePomodoroSettings() {
    const f = parseInt(document.getElementById("input-focus").value, 10);
    const s = parseInt(document.getElementById("input-short-break").value, 10);
    const l = parseInt(document.getElementById("input-long-break").value, 10);

    if (f && s && l) {
        state.pomo.focus = f;
        state.pomo.short = s;
        state.pomo.long = l;
        saveStateToStorage();
        resetPomodoro();
        togglePomoSettings();
    }
}

// --------------------------------------------------------------------------
// 8. Stopwatch Widget Logic
// --------------------------------------------------------------------------

function formatMsTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60) % 60;
    const hours = Math.floor(totalSeconds / 3600);

    if (hours > 0) {
        return `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(centiseconds).padStart(2,'0')}`;
    }
    return `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}.${String(centiseconds).padStart(2,'0')}`;
}

function updateStopwatchDisplay() {
    const displayEl = document.getElementById("stopwatch-time");
    if (displayEl) {
        const totalSeconds = Math.floor(stopwatchElapsed / 1000);
        const centiseconds = Math.floor((stopwatchElapsed % 1000) / 10);
        const seconds = totalSeconds % 60;
        const minutes = Math.floor(totalSeconds / 60) % 60;
        const hours = Math.floor(totalSeconds / 3600);

        let timeStr;
        if (hours > 0) {
            timeStr = `${String(hours).padStart(2,'0')}:${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
        } else {
            timeStr = `${String(minutes).padStart(2,'0')}:${String(seconds).padStart(2,'0')}`;
        }

        const msSpan = displayEl.querySelector(".milliseconds");
        if (msSpan) {
            displayEl.childNodes[0].textContent = timeStr;
            msSpan.textContent = `.${String(centiseconds).padStart(2,'0')}`;
        } else {
            displayEl.textContent = timeStr;
        }
    }
}

function toggleStopwatch() {
    const playBtn = document.getElementById("stopwatch-play-btn");
    const playIcon = document.getElementById("stopwatch-play-icon");
    const lapBtn = document.getElementById("stopwatch-lap-btn");

    if (stopwatchIsRunning) {
        clearInterval(stopwatchInterval);
        stopwatchIsRunning = false;
        playIcon.setAttribute("data-lucide", "play");
        playBtn.classList.remove("active");
        lapBtn.disabled = true;
        
        const secondsRunning = Math.floor(stopwatchElapsed / 1000);
        if (secondsRunning >= 30) {
            const minutesRunning = Math.round(secondsRunning / 60);
            if (confirm(`Would you like to log this stopwatch study session? (${minutesRunning} minutes)`)) {
                logStudySession("Stopwatch Session", Math.max(1, minutesRunning));
            }
        }
    } else {
        stopwatchIsRunning = true;
        playIcon.setAttribute("data-lucide", "pause");
        playBtn.classList.add("active");
        lapBtn.disabled = false;
        
        stopwatchStartTime = Date.now() - stopwatchElapsed;
        let lastElapsedSec = Math.floor(stopwatchElapsed / 1000);
        stopwatchInterval = setInterval(() => {
            stopwatchElapsed = Date.now() - stopwatchStartTime;
            updateStopwatchDisplay();

            const currentSec = Math.floor(stopwatchElapsed / 1000);
            if (currentSec !== lastElapsedSec) {
                lastElapsedSec = currentSec;
                
                // Grows over 60 mins
                const progress = Math.min(1.0, currentSec / 3600);
                updateFloraGrowth(progress);

                if (currentSec > 0 && currentSec % 10 === 0) {
                    startSynthLoop();
                }
            }
        }, 10);
    }
    lucide.createIcons();
}

function resetStopwatch() {
    clearInterval(stopwatchInterval);
    stopwatchIsRunning = false;
    stopwatchElapsed = 0;
    stopwatchLaps = [];
    
    const playBtn = document.getElementById("stopwatch-play-btn");
    const playIcon = document.getElementById("stopwatch-play-icon");
    const lapBtn = document.getElementById("stopwatch-lap-btn");
    
    playIcon.setAttribute("data-lucide", "play");
    playBtn.classList.remove("active");
    lapBtn.disabled = true;
    
    updateStopwatchDisplay();
    document.getElementById("stopwatch-laps").style.display = "none";
    document.getElementById("laps-list-ul").innerHTML = "";
    lucide.createIcons();
}

function lapStopwatch() {
    if (!stopwatchIsRunning) return;
    
    stopwatchLaps.push(stopwatchElapsed);
    
    const lapsContainer = document.getElementById("stopwatch-laps");
    lapsContainer.style.display = "block";

    const lapsList = document.getElementById("laps-list-ul");
    const formattedLap = formatMsTime(stopwatchElapsed);
    
    const li = document.createElement("li");
    li.className = "lap-item";
    li.innerHTML = `
        <span class="lap-number">Split #${stopwatchLaps.length}</span>
        <span class="lap-value">${formattedLap}</span>
    `;
    lapsList.prepend(li);
}

// --------------------------------------------------------------------------
// 9. Study Logger & To-Do List (Session Tracker)
// --------------------------------------------------------------------------

let selectedTodoId = null;

function setTrackerTab(tabName) {
    const btnTodo = document.getElementById("tracker-tab-todo");
    const btnLog = document.getElementById("tracker-tab-log");
    const contentTodo = document.getElementById("tracker-content-todo");
    const contentLog = document.getElementById("tracker-content-log");

    if (tabName === "todo") {
        btnTodo.classList.add("active");
        btnLog.classList.remove("active");
        contentTodo.style.display = "block";
        contentLog.style.display = "none";
    } else {
        btnTodo.classList.remove("active");
        btnLog.classList.add("active");
        contentTodo.style.display = "none";
        contentLog.style.display = "block";
    }
}

function addTodoItem() {
    const todoTextInput = document.getElementById("todo-text");
    const todoDurationInput = document.getElementById("todo-duration");

    const text = todoTextInput.value.trim();
    const duration = parseInt(todoDurationInput.value, 10) || 25;

    if (!text) {
        alert("Please enter a task description.");
        return;
    }

    if (!state.todoList) state.todoList = [];

    const newItem = {
        id: "todo_" + Date.now(),
        text: text,
        duration: duration,
        completed: false
    };

    state.todoList.push(newItem);
    saveStateToStorage();

    todoTextInput.value = "";
    todoDurationInput.value = "";

    // Set as selected automatically
    selectedTodoId = newItem.id;

    renderTodoList();
    triggerConfetti(0.1);
}

function toggleTodoItem(id) {
    let justCompleted = false;
    let completedItem = null;

    state.todoList = state.todoList.map(item => {
        if (item.id === id) {
            const nextVal = !item.completed;
            if (nextVal) {
                justCompleted = true;
                completedItem = item;
            }
            return { ...item, completed: nextVal };
        }
        return item;
    });

    saveStateToStorage();
    renderTodoList();

    if (justCompleted && completedItem) {
        // 1. Grow plant to 100% instantly
        updateFloraGrowth(1.0);
        
        // 2. Play bloom confetti
        triggerConfetti(0.4);
        
        // 3. Add to Garden Journal
        addToGardenJournal();
        
        // 4. Award XP based on duration (2 XP per minute)
        awardAuraXp(completedItem.duration * 2);
        
        // 5. Notify user
        alert(`🎉 Task completed! Your Aura plant bloomed and you gained ${completedItem.duration * 2} XP!`);
        
        // 6. Reset plant to sprout/seed state after 3 seconds
        setTimeout(() => {
            updateFloraGrowth(0);
        }, 3000);
    }
}

function deleteTodoItem(id) {
    state.todoList = state.todoList.filter(item => item.id !== id);
    if (selectedTodoId === id) selectedTodoId = null;
    saveStateToStorage();
    renderTodoList();
}

function renderTodoList() {
    const listUl = document.getElementById("todo-list-ul");
    if (!listUl) return;
    listUl.innerHTML = "";
    
    if (!state.todoList) state.todoList = [];
    
    if (state.todoList.length === 0) {
        listUl.innerHTML = `
            <li class="empty-state" style="text-align: center; color: var(--text-muted); padding: 15px; display: flex; flex-direction: column; align-items: center; gap: 8px;">
                <i data-lucide="clipboard" style="width: 24px; height: 24px; opacity: 0.5;"></i>
                <span>No tasks in your list. Add one above!</span>
            </li>
        `;
        document.getElementById("start-todo-session-btn").disabled = true;
        if (window.lucide) lucide.createIcons();
        return;
    }
    
    document.getElementById("start-todo-session-btn").disabled = false;
    
    state.todoList.forEach(item => {
        const li = document.createElement("li");
        li.className = `todo-item ${item.completed ? 'completed' : ''} ${selectedTodoId === item.id ? 'selected' : ''}`;
        li.style.cssText = `
            display: flex;
            align-items: center;
            justify-content: space-between;
            background-color: var(--bg-app);
            border: var(--border-thickness) var(--border-style) ${selectedTodoId === item.id ? 'var(--primary)' : 'var(--border-color)'};
            border-radius: 8px;
            padding: 8px 12px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: ${selectedTodoId === item.id ? '0 0 10px var(--primary)' : 'none'};
        `;
        
        li.onclick = (e) => {
            if (e.target.closest('.todo-delete-btn') || e.target.closest('.todo-checkbox')) return;
            selectedTodoId = item.id;
            renderTodoList();
        };

        const leftSide = document.createElement("div");
        leftSide.style.cssText = "display: flex; align-items: center; gap: 10px;";
        
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "todo-checkbox";
        checkbox.checked = item.completed;
        checkbox.onchange = () => toggleTodoItem(item.id);
        
        const textSpan = document.createElement("span");
        textSpan.textContent = item.text;
        textSpan.style.cssText = item.completed ? "text-decoration: line-through; opacity: 0.6;" : "";
        
        leftSide.appendChild(checkbox);
        leftSide.appendChild(textSpan);
        
        const rightSide = document.createElement("div");
        rightSide.style.cssText = "display: flex; align-items: center; gap: 8px;";
        
        const durationBadge = document.createElement("span");
        durationBadge.textContent = `${item.duration}m`;
        durationBadge.style.cssText = `
            font-size: 0.85rem;
            background-color: var(--primary);
            color: #171717;
            padding: 3px 8px;
            border-radius: 6px;
            font-weight: bold;
        `;
        
        const deleteBtn = document.createElement("button");
        deleteBtn.className = "todo-delete-btn";
        deleteBtn.innerHTML = '<i data-lucide="trash-2" style="width: 14px; height: 14px; color: #ef4444;"></i>';
        deleteBtn.style.cssText = "background: none; border: none; cursor: pointer; padding: 2px;";
        deleteBtn.onclick = () => deleteTodoItem(item.id);
        
        rightSide.appendChild(durationBadge);
        rightSide.appendChild(deleteBtn);
        
        li.appendChild(leftSide);
        li.appendChild(rightSide);
        
        listUl.appendChild(li);
    });
    
    if (window.lucide) lucide.createIcons();
}

function startTodoSession() {
    let task = null;
    if (selectedTodoId) {
        task = state.todoList.find(t => t.id === selectedTodoId);
    }
    
    if (!task) {
        task = state.todoList.find(t => !t.completed);
    }
    
    if (!task) {
        alert("Please add an uncompleted task first!");
        return;
    }

    const duration = task.duration;
    
    state.pomo.focus = duration;
    document.getElementById("input-focus").value = duration;
    saveStateToStorage();

    pomoActiveMode = "focus";
    setPomodoroMode("focus");
    pomoIsRunning = false;
    togglePomodoro();

    if (!stopwatchIsRunning) {
        toggleStopwatch();
    }

    const pomoWidget = document.getElementById("widget-pomodoro");
    if (pomoWidget) {
        pomoWidget.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    triggerConfetti(0.3);
}

// --------------------------------------------------------------------------
// 9.1 Study Logger Manual Entry
// --------------------------------------------------------------------------

function manualLogSession() {
    const subjectInput = document.getElementById("session-subject");
    const durationInput = document.getElementById("session-duration");

    const subject = subjectInput.value.trim();
    const duration = parseInt(durationInput.value, 10);

    if (!subject || !duration || duration <= 0) {
        alert("Please enter a study subject and a valid positive duration in minutes.");
        return;
    }

    logStudySession(subject, duration);

    subjectInput.value = "";
    durationInput.value = "";

    triggerConfetti(0.15);
}

function logStudySession(subject, duration) {
    const today = getTodayDateString();
    const newSession = {
        id: "session_" + Date.now(),
        subject: subject,
        duration: duration,
        date: today,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    state.sessions.unshift(newSession);
    state.lastActiveDate = today;

    saveStateToStorage();
    verifyStreakValidity();

    // Award XP based on session duration (2 XP per minute focused)
    awardAuraXp(duration * 2);

    renderRecentSessions();
    renderStreaks();
    renderStats();
    renderCharts();
}

function renderRecentSessions() {
    const container = document.getElementById("session-history-list");
    const todayStr = getTodayDateString();
    const todaysSessions = state.sessions.filter(s => s.date === todayStr);

    if (todaysSessions.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i data-lucide="coffee"></i>
                <span>No study sessions logged today. Time to start!</span>
            </div>
        `;
    } else {
        container.innerHTML = todaysSessions.map(s => `
            <div class="session-item-log">
                <div class="log-details">
                    <span class="log-subject">${escapeHTML(s.subject)}</span>
                    <span class="log-time">${s.timestamp}</span>
                </div>
                <div class="log-duration-badge">${s.duration} mins</div>
            </div>
        `).join('');
    }
    lucide.createIcons();
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// --------------------------------------------------------------------------
// 10. Gamified Streaks & Progress Calculator
// --------------------------------------------------------------------------

function getDailyStudyMinutes(dateString) {
    return state.sessions
        .filter(s => s.date === dateString)
        .reduce((sum, s) => sum + s.duration, 0);
}

function verifyStreakValidity() {
    const todayStr = getTodayDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;

    const minutesToday = getDailyStudyMinutes(todayStr);
    const goalMetToday = minutesToday >= state.dailyGoalMins;

    const minutesYesterday = getDailyStudyMinutes(yesterdayStr);
    const goalMetYesterday = minutesYesterday >= state.dailyGoalMins;

    if (goalMetToday && state.streak === 0) {
        state.streak = 1;
    }
    else if (goalMetToday) {
        state.streak = calculateConsecutiveStreak();
    } else {
        if (goalMetYesterday) {
            state.streak = calculateConsecutiveStreak();
        } else {
            state.streak = 0;
        }
    }
    saveStateToStorage();
}

function calculateConsecutiveStreak() {
    let streakCount = 0;
    const todayStr = getTodayDateString();
    
    // Streak is updated as long as there is ANY study minutes (> 0) logged today
    const todayMins = getDailyStudyMinutes(todayStr);
    const todayMet = todayMins > 0;
    
    if (todayMet) {
        streakCount++;
    }
    
    let dateIndex = 1;
    while (true) {
        const d = new Date();
        d.setDate(d.getDate() - dateIndex);
        const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        
        const mins = getDailyStudyMinutes(dStr);
        if (mins > 0) {
            streakCount++;
            dateIndex++;
        } else {
            break;
        }
    }
    
    // If today is not studied yet, but yesterday was, keep the streak alive showing yesterday's count
    if (!todayMet && streakCount === 0) {
        let yesterdayIndex = 1;
        while (true) {
            const d = new Date();
            d.setDate(d.getDate() - yesterdayIndex);
            const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
            const mins = getDailyStudyMinutes(dStr);
            if (mins > 0) {
                streakCount++;
                yesterdayIndex++;
            } else {
                break;
            }
        }
    }
    
    return streakCount;
}

function renderStreaks() {
    verifyStreakValidity();
    const streakVal = calculateConsecutiveStreak();

    document.getElementById("header-streak-count").textContent = streakVal;
    document.getElementById("streak-giant-count").textContent = streakVal;

    const todayStr = getTodayDateString();
    const todayMins = getDailyStudyMinutes(todayStr);
    const progressFill = document.getElementById("daily-progress-bar");
    
    document.getElementById("daily-focus-mins").textContent = todayMins;
    document.getElementById("daily-goal-mins").textContent = state.dailyGoalMins;

    const ratio = Math.min(1, todayMins / state.dailyGoalMins);
    progressFill.style.width = `${ratio * 100}%`;

    const checklist = document.getElementById("week-checklist-container");
    checklist.innerHTML = "";

    const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        
        const mins = getDailyStudyMinutes(dStr);
        const isCompleted = mins >= state.dailyGoalMins;
        const dayLabel = daysShort[d.getDay()];

        const badge = document.createElement("div");
        badge.className = `week-day-badge ${isCompleted ? 'completed' : ''}`;
        badge.innerHTML = `
            <span class="week-day-label">${dayLabel}</span>
            <i data-lucide="${isCompleted ? 'check-circle' : 'circle'}" class="week-day-icon"></i>
        `;
        checklist.appendChild(badge);
    }
    lucide.createIcons();
}

function renderStats() {
    const totalMinutes = state.sessions.reduce((sum, s) => sum + s.duration, 0);
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    
    document.getElementById("stats-total-hours").textContent = `${hours}h ${mins}m`;
    document.getElementById("stats-session-count").textContent = state.sessions.length;

    const dates = [...new Set(state.sessions.map(s => s.date))];
    const uniqueDays = dates.length || 1;
    const avg = Math.round(totalMinutes / uniqueDays);
    document.getElementById("stats-daily-avg").textContent = `${avg}m`;
}

// --------------------------------------------------------------------------
// 11. Chart.js Data Visualizer
// --------------------------------------------------------------------------

function setChartRange(range) {
    activeChartRange = range;
    document.getElementById("chart-range-week").classList.toggle("active", range === "week");
    document.getElementById("chart-range-month").classList.toggle("active", range === "month");
    renderCharts();
}

function renderCharts() {
    const ctx = document.getElementById("analyticsChart").getContext("2d");
    if (analyticsChartInstance) {
        analyticsChartInstance.destroy();
    }

    const dataPoints = [];
    const labels = [];
    const count = activeChartRange === "week" ? 7 : 30;

    for (let i = count - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
        
        dataPoints.push(getDailyStudyMinutes(dStr));
        
        if (activeChartRange === "week") {
            const daysShort = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            labels.push(daysShort[d.getDay()]);
        } else {
            labels.push(`${d.getDate()}/${d.getMonth()+1}`);
        }
    }

    let primaryColor = "#8fa89b";
    let gridColor = "rgba(0, 0, 0, 0.05)";
    let textColor = "#8d7b70";
    
    if (state.theme === "minimalist") {
        primaryColor = "#171717";
        gridColor = "#e5e5e5";
        textColor = "#737373";
    } else if (state.theme === "cyberpunk") {
        primaryColor = "#ff007f";
        gridColor = "rgba(255, 0, 127, 0.15)";
        textColor = "#00ffff";
    } else if (state.theme === "anime") {
        primaryColor = "#ffd166";
        gridColor = "#2b2b2b";
        textColor = "#2b2b2b";
    } else if (state.theme === "watercolour") {
        primaryColor = "#9aa8e3";
        gridColor = "rgba(255,255,255,0.4)";
        textColor = "#62728f";
    }

    analyticsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Study Time (mins)',
                data: dataPoints,
                backgroundColor: primaryColor,
                borderColor: state.theme === "anime" ? "#2b2b2b" : "transparent",
                borderWidth: state.theme === "anime" ? 2 : 0,
                borderRadius: state.theme === "minimalist" ? 0 : 6,
                barPercentage: 0.6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: textColor, font: { family: 'inherit', size: 10 } }
                },
                y: {
                    grid: { color: gridColor },
                    ticks: { color: textColor, font: { family: 'inherit', size: 10 } }
                }
            }
        }
    });
}

// --------------------------------------------------------------------------
// 12. Music Panels & Collapsible Compact Player
// --------------------------------------------------------------------------

function initMusicPanel() {
    setMusicTab("ambient");
    toggleMusicCollapse(state.musicCollapsed);
}

function setMusicTab(tabName) {
    document.querySelectorAll(".music-tabs .tab-btn").forEach(el => {
        el.classList.remove("active");
    });
    document.getElementById("music-tab-btn-" + tabName).classList.add("active");

    document.querySelectorAll(".music-tab-content").forEach(el => {
        el.classList.remove("active");
    });
    document.getElementById("music-tab-content-" + tabName).classList.add("active");
    
    // Pause youtube if active tab is changed
    if (tabName !== "youtube" && ytIsPlaying) {
        const iframe = document.getElementById("youtube-iframe");
        if (iframe) {
            iframe.contentWindow.postMessage('{"event":"command","func":"pauseVideo","args":""}', '*');
        }
        ytIsPlaying = false;
    }
}

function toggleMusicCollapse(forceVal = null) {
    const musicWidget = document.getElementById("widget-music");
    const collapseIcon = document.getElementById("music-collapse-icon");

    if (forceVal !== null) {
        state.musicCollapsed = forceVal;
    } else {
        state.musicCollapsed = !state.musicCollapsed;
    }
    
    saveStateToStorage();

    if (state.musicCollapsed) {
        // Find position to determine left or right dock
        if (musicWidget && !musicWidget.classList.contains("collapsed-docked-left") && !musicWidget.classList.contains("collapsed-docked-right")) {
            const rect = musicWidget.getBoundingClientRect();
            const centerX = rect.left + (rect.width / 2);
            if (centerX < window.innerWidth / 2) {
                musicWidget.classList.add("collapsed-docked-left");
            } else {
                musicWidget.classList.add("collapsed-docked-right");
            }
        }
        
        musicWidget.classList.add("collapsed");
        if (collapseIcon) collapseIcon.setAttribute("data-lucide", "maximize-2");
    } else {
        musicWidget.classList.remove("collapsed", "collapsed-docked-left", "collapsed-docked-right");
        if (collapseIcon) collapseIcon.setAttribute("data-lucide", "minimize-2");
        setTimeout(() => {
            musicWidget.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 120);
    }
    
    if (window.lucide) {
        lucide.createIcons();
    }
}

function loadSpotifyPlaylist() {
    const input = document.getElementById("spotify-playlist-url").value.trim();
    if (!input) return;
    
    let playlistId = "";
    if (input.includes("spotify.com/playlist/")) {
        playlistId = input.split("playlist/")[1].split("?")[0];
    } else {
        playlistId = input; 
    }

    const iframe = document.getElementById("spotify-iframe");
    iframe.src = `https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0`;
}

function loadSoundCloudPlaylist() {
    const input = document.getElementById("soundcloud-playlist-url").value.trim();
    if (!input) return;

    const iframe = document.getElementById("soundcloud-iframe");
    iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(input)}&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true`;
}

function loadYoutubeVideo() {
    const input = document.getElementById("youtube-url").value.trim();
    if (!input) return;

    let videoId = "";
    if (input.includes("youtube.com/watch?v=")) {
        videoId = input.split("watch?v=")[1].split("&")[0];
    } else if (input.includes("youtu.be/")) {
        videoId = input.split("youtu.be/")[1].split("?")[0];
    } else {
        videoId = input; 
    }

    const iframe = document.getElementById("youtube-iframe");
    iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1`;
    ytIsPlaying = false; // Reset play state
}

// --------------------------------------------------------------------------
// 13. Mixed Audio Playback Engine (Real Files)
// --------------------------------------------------------------------------

function initAudioContext() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
}

function adjustAmbientVolume(type, value, cache = true) {
    initAudioContext();
    const val = parseFloat(value);
    const muteBtn = document.getElementById("mute-" + type);

    if (cache) {
        state.ambientVolSettings[type] = val;
        saveStateToStorage();
    }

    const audioEl = document.getElementById("audio-" + type);
    if (audioEl) {
        if (val > 0) {
            audioEl.volume = val;
            audioEl.play().catch(err => {
                console.log("Audio play blocked by browser autoplay policy, waiting for check-in: ", err);
            });
            activeAmbientStreams[type] = true;
            if (muteBtn) {
                muteBtn.classList.add("active");
                muteBtn.innerHTML = '<i data-lucide="volume-2"></i>';
            }
        } else {
            audioEl.pause();
            activeAmbientStreams[type] = false;
            if (muteBtn) {
                muteBtn.classList.remove("active");
                muteBtn.innerHTML = '<i data-lucide="volume-x"></i>';
            }
        }
    }
    
    const isAnyActive = Object.values(activeAmbientStreams).some(v => v === true);
    const globalPlayIcon = document.getElementById("global-play-icon");
    const globalPlayBtn = document.getElementById("btn-global-play");
    if (globalPlayIcon && globalPlayBtn) {
        if (isAnyActive) {
            globalPlayIcon.setAttribute("data-lucide", "pause");
            globalPlayBtn.classList.add("active");
        } else {
            globalPlayIcon.setAttribute("data-lucide", "play");
            globalPlayBtn.classList.remove("active");
        }
    }
    lucide.createIcons();
}

function toggleAmbientSound(type) {
    const slider = document.getElementById("ambient-" + type);
    const currentVal = parseFloat(slider.value);

    if (currentVal > 0) {
        slider.value = 0;
        adjustAmbientVolume(type, 0);
    } else {
        slider.value = 0.4;
        adjustAmbientVolume(type, 0.4);
    }
}

// --------------------------------------------------------------------------
// 14. Synthesized Alert Sounds
// --------------------------------------------------------------------------

function synthesizeAlertSound() {
    initAudioContext();
    if (!audioCtx) return;

    const now = audioCtx.currentTime;
    const soundType = state.alarmSound;

    if (soundType === "cyberpunk") {
        const osc1 = audioCtx.createOscillator();
        const osc2 = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        osc1.type = "sawtooth";
        osc1.frequency.setValueAtTime(523.25, now); 
        osc1.frequency.exponentialRampToValueAtTime(880, now + 0.4);

        osc2.type = "triangle";
        osc2.frequency.setValueAtTime(659.25, now); 
        osc2.frequency.exponentialRampToValueAtTime(1046.5, now + 0.4);

        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 0.5);
        osc2.stop(now + 0.5);
    } 
    else if (soundType === "anime") {
        const notes = [523.25, 659.25, 783.99, 1046.5]; 
        notes.forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + idx * 0.1);
            
            gainNode.gain.setValueAtTime(0.15, now + idx * 0.1);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.15);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start(now + idx * 0.1);
            osc.stop(now + idx * 0.1 + 0.2);
        });
    } 
    else if (soundType === "aesthetic") {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(293.66, now); 
        
        const subOsc = audioCtx.createOscillator();
        const subGain = audioCtx.createGain();
        subOsc.type = "sine";
        subOsc.frequency.setValueAtTime(587.33, now); 
        
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 2.0); 

        subGain.gain.setValueAtTime(0.08, now);
        subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

        osc.connect(gainNode);
        subOsc.connect(subGain);
        
        gainNode.connect(audioCtx.destination);
        subGain.connect(audioCtx.destination);
        
        osc.start(now);
        subOsc.start(now);
        
        osc.stop(now + 2.0);
        subOsc.stop(now + 1.2);
    } 
    else {
        [440, 440].forEach((freq, idx) => {
            const osc = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();
            
            osc.type = "sine";
            osc.frequency.value = freq;
            
            gainNode.gain.setValueAtTime(0.1, now + idx * 0.25);
            gainNode.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.25 + 0.15);
            
            osc.connect(gainNode);
            gainNode.connect(audioCtx.destination);
            
            osc.start(now + idx * 0.25);
            osc.stop(now + idx * 0.25 + 0.2);
        });
    }
}

// --------------------------------------------------------------------------
// 15. Canvas Confetti Animations
// --------------------------------------------------------------------------

function triggerConfetti(durationSeconds) {
    const end = Date.now() + (durationSeconds * 1000);
    let colors = ['#8fa89b', '#d2b48c', '#e5d4c0'];
    if (state.theme === 'cyberpunk') colors = ['#ff007f', '#00ffff', '#bc13fe'];
    else if (state.theme === 'anime') colors = ['#ffd166', '#06d6a0', '#ff7096'];
    else if (state.theme === 'watercolour') colors = ['#9aa8e3', '#f8ad9d', '#eaeef6'];
    else if (state.theme === 'minimalist') colors = ['#171717', '#737373', '#a3a3a3'];

    (function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 }, colors: colors });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 }, colors: colors });
        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
}

// --------------------------------------------------------------------------
// 16. Aura Flora RPG & Generative Synth Engine
// --------------------------------------------------------------------------

function awardAuraXp(amount) {
    state.auraXp += amount;
    const xpNeeded = state.auraLevel * 100;
    
    if (state.auraXp >= xpNeeded) {
        state.auraXp -= xpNeeded;
        state.auraLevel += 1;
        triggerConfetti(0.5);
        alert(`✨ LEVEL UP! You reached Aura Level ${state.auraLevel}! ✨`);
    }

    saveStateToStorage();
    renderAuraStatus();
}

function renderAuraStatus() {
    const lvlEl = document.getElementById("aura-level-val");
    const xpValEl = document.getElementById("aura-xp-val");
    const barEl = document.getElementById("aura-xp-bar");
    
    if (lvlEl) lvlEl.innerText = state.auraLevel;
    
    const xpNeeded = state.auraLevel * 100;
    if (xpValEl) xpValEl.innerText = `${state.auraXp} / ${xpNeeded} XP`;
    if (barEl) {
        const pct = (state.auraXp / xpNeeded) * 100;
        barEl.style.width = `${pct}%`;
    }
}

function toggleGardenJournal() {
    const drawer = document.getElementById("garden-journal-drawer");
    if (drawer) {
        drawer.style.display = drawer.style.display === "none" ? "block" : "none";
        renderGardenJournal();
    }
}

const floraDisplayNames = {
    "cozy": "🍃 Cozy Bonsai",
    "cyberpunk": "🔮 Cyber Neon Crystal",
    "watercolour": "🌸 Watercolor Lily",
    "watercolor": "🌸 Watercolor Lily",
    "cute-anime": "🍒 Sakura Sprout",
    "anime": "🍒 Sakura Sprout",
    "minimalist": "📐 Geometric Succulent"
};

function addToGardenJournal() {
    const theme = state.theme || "cozy";
    const plantName = floraDisplayNames[theme] || "🍃 Cozy Bonsai";
    const dateStr = new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    
    if (!state.gardenJournal) state.gardenJournal = [];
    state.gardenJournal.push({
        name: plantName,
        date: dateStr
    });
    
    saveStateToStorage();
    renderGardenJournal();
}

function renderGardenJournal() {
    const container = document.getElementById("garden-journal-list");
    if (!container) return;
    
    if (!state.gardenJournal || state.gardenJournal.length === 0) {
        container.innerHTML = `<span style="color: var(--text-muted); font-style: italic;">No plants in journal yet. Complete a study session to grow!</span>`;
        return;
    }
    
    container.innerHTML = state.gardenJournal.map(item => `
        <span style="background: rgba(255, 255, 255, 0.08); border: 1px solid var(--border-color); border-radius: 6px; padding: 4px 8px; font-weight: bold; display: inline-flex; align-items: center; gap: 4px; margin-bottom: 4px;">
            ${item.name} <small style="opacity: 0.6; font-weight: normal;">(${item.date})</small>
        </span>
    `).join("");
}

function updateFloraGrowth(percentage) {
    const container = document.getElementById("aura-flora-svg-container");
    if (!container) return;

    if (!container.querySelector("svg")) {
        const theme = state.theme || "cozy";
        let svgContent = "";

        if (theme === "cyberpunk") {
            svgContent = `
                <svg width="100" height="110" viewBox="0 0 100 110" class="aura-flora-active">
                    <path class="flora-pot" d="M35,90 L65,90 L70,105 L30,105 Z" />
                    <path class="flora-stem" d="M50,90 L50,45 L50,30" style="stroke: #ff007f; stroke-dasharray: 60; stroke-dashoffset: 60;" />
                    <polygon class="flora-leaf" points="50,70 30,65 50,60" style="fill: #00f0ff;" />
                    <polygon class="flora-leaf" points="50,55 70,50 50,45" style="fill: #00f0ff;" />
                    <polygon class="flora-flower" points="50,15 35,35 50,45 65,35" style="fill: #ff007f; stroke: #00f0ff;" />
                </svg>
            `;
        } else if (theme === "watercolour" || theme === "watercolor") {
            svgContent = `
                <svg width="100" height="110" viewBox="0 0 100 110" class="aura-flora-active">
                    <path class="flora-pot" d="M30,90 L70,90 L60,105 L40,105 Z" />
                    <path class="flora-stem" d="M50,90 C45,70 55,50 50,35" style="stroke: #0d9488; stroke-dasharray: 65; stroke-dashoffset: 65;" />
                    <circle class="flora-leaf" cx="38" cy="65" r="8" style="fill: #0d9488;" />
                    <circle class="flora-leaf" cx="62" cy="52" r="8" style="fill: #0d9488;" />
                    <path class="flora-flower" d="M50,35 C42,25 35,35 50,15 C65,35 58,25 50,35" style="fill: #f43f5e;" />
                </svg>
            `;
        } else if (theme === "cute-anime" || theme === "anime") {
            svgContent = `
                <svg width="100" height="110" viewBox="0 0 100 110" class="aura-flora-active">
                    <path class="flora-pot" d="M35,90 L65,90 L60,105 L40,105 Z" />
                    <path class="flora-stem" d="M50,90 Q40,65 50,40" style="stroke: #db2777; stroke-dasharray: 60; stroke-dashoffset: 60;" />
                    <path class="flora-leaf" d="M43,65 C33,65 38,55 43,65" style="fill: #f472b6;" />
                    <path class="flora-leaf" d="M47,50 C57,50 52,40 47,50" style="fill: #f472b6;" />
                    <circle class="flora-flower" cx="50" cy="35" r="8" style="fill: #fdf2f8; stroke: #db2777;" />
                </svg>
            `;
        } else if (theme === "minimalist") {
            svgContent = `
                <svg width="100" height="110" viewBox="0 0 100 110">
                    <path class="flora-pot" d="M32,90 L68,90 L68,105 L32,105 Z" />
                    <path class="flora-stem" d="M50,90 L50,40" style="stroke: var(--text-main); stroke-dasharray: 50; stroke-dashoffset: 50;" />
                    <polygon class="flora-leaf" points="50,75 35,70 50,65" style="fill: var(--text-muted);" />
                    <polygon class="flora-leaf" points="50,60 65,55 50,50" style="fill: var(--text-muted);" />
                    <polygon class="flora-flower" points="50,40 40,25 50,15 60,25" style="fill: var(--text-main); stroke: var(--border-color);" />
                </svg>
            `;
        } else {
            // Cozy (Default)
            svgContent = `
                <svg width="100" height="110" viewBox="0 0 100 110" class="aura-flora-active">
                    <path class="flora-pot" d="M30,90 L70,90 L65,105 L35,105 Z" />
                    <path class="flora-stem" d="M50,90 Q55,60 50,30" style="stroke: #15803d; stroke-dasharray: 65; stroke-dashoffset: 65;" />
                    <path class="flora-leaf" d="M46,65 C38,60 40,50 48,55 Z" style="fill: #22c55e;" />
                    <path class="flora-leaf" d="M54,50 C62,45 60,35 52,40 Z" style="fill: #22c55e;" />
                    <circle class="flora-flower" cx="50" cy="25" r="9" style="fill: #eab308; stroke: #eab308;" />
                </svg>
            `;
        }

        container.innerHTML = svgContent;
    }

    const stem = container.querySelector(".flora-stem");
    const leaves = container.querySelectorAll(".flora-leaf");
    const flower = container.querySelector(".flora-flower");
    const statusText = document.getElementById("flora-status-text");

    if (stem) {
        const dashArray = parseFloat(stem.style.strokeDasharray);
        const newOffset = dashArray * (1 - percentage);
        stem.style.strokeDashoffset = newOffset;
    }

    if (leaves.length > 0) {
        if (percentage >= 0.3) leaves[0].classList.add("visible");
        else leaves[0].classList.remove("visible");
    }
    if (leaves.length > 1) {
        if (percentage >= 0.6) leaves[1].classList.add("visible");
        else leaves[1].classList.remove("visible");
    }

    if (flower) {
        if (percentage >= 0.95) {
            flower.classList.add("visible");
            if (statusText) statusText.innerText = "Aura Flora Bloomed!";
        } else {
            flower.classList.remove("visible");
            if (statusText) {
                if (percentage > 0) {
                    statusText.innerText = `Growing (${Math.round(percentage * 100)}%)`;
                } else {
                    statusText.innerText = "Sprout sleeping...";
                }
            }
        }
    }
}

// Generative Flow Synth Audio Engine (Now running Binaural Focus Waves)
let synthInterval = null;
let synthGain = null;
let isSynthMuted = false;
let synthVolumeLevel = 0;
let binauralNodes = null;

function initSynth() {
    if (audioCtx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    audioCtx = new AudioContextClass();
}

function startBinauralBeats(volume) {
    initSynth();
    stopBinauralBeats();
    
    if (volume === 0 || isSynthMuted) return;
    
    if (audioCtx.state === "suspended") {
        audioCtx.resume();
    }
    
    const now = audioCtx.currentTime;
    
    const oscL = audioCtx.createOscillator();
    oscL.type = "sine";
    oscL.frequency.setValueAtTime(200, now);
    
    const oscR = audioCtx.createOscillator();
    oscR.type = "sine";
    oscR.frequency.setValueAtTime(210, now);
    
    const pannerL = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    const pannerR = audioCtx.createStereoPanner ? audioCtx.createStereoPanner() : null;
    
    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(volume * 0.15, now);
    
    if (pannerL && pannerR) {
        pannerL.pan.setValueAtTime(-1, now);
        pannerR.pan.setValueAtTime(1, now);
        
        oscL.connect(pannerL);
        pannerL.connect(gainNode);
        
        oscR.connect(pannerR);
        pannerR.connect(gainNode);
    } else {
        oscL.connect(gainNode);
        oscR.connect(gainNode);
    }
    
    gainNode.connect(audioCtx.destination);
    
    oscL.start(now);
    oscR.start(now);
    
    binauralNodes = { oscL, oscR, gainNode };
}

function stopBinauralBeats() {
    if (binauralNodes) {
        try {
            binauralNodes.oscL.stop();
            binauralNodes.oscR.stop();
            binauralNodes.oscL.disconnect();
            binauralNodes.oscR.disconnect();
            binauralNodes.gainNode.disconnect();
        } catch (e) {}
        binauralNodes = null;
    }
}

function adjustSynthVolume(val) {
    synthVolumeLevel = parseFloat(val);
    state.synthVolume = synthVolumeLevel;
    saveStateToStorage();
    
    if (synthVolumeLevel > 0) {
        isSynthMuted = false;
        document.getElementById("mute-synth").innerHTML = '<i data-lucide="volume-2"></i>';
        startBinauralBeats(synthVolumeLevel);
    } else {
        stopBinauralBeats();
    }
    if (window.lucide) lucide.createIcons();
}

function toggleSynthSound() {
    isSynthMuted = !isSynthMuted;
    const muteBtn = document.getElementById("mute-synth");
    
    if (isSynthMuted) {
        stopBinauralBeats();
        muteBtn.innerHTML = '<i data-lucide="volume-x"></i>';
    } else {
        synthVolumeLevel = state.synthVolume || 0.3;
        document.getElementById("ambient-synth").value = synthVolumeLevel;
        muteBtn.innerHTML = '<i data-lucide="volume-2"></i>';
        startBinauralBeats(synthVolumeLevel);
    }
    if (window.lucide) lucide.createIcons();
}

function startSynthLoop() {
    // Blank placeholder for timer ticks compatibility
}

