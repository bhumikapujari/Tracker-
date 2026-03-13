/**
 * 60-Day Progress Tracker - App Logic
 * Handlers for tasks, XP, levels, and charts.
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    let state = {
        currentDay: 1,
        userXP: 0,
        userLevel: 1,
        streak: 0,
        lastCompletedDate: null,
        completedTaskIds: [], // Store IDs of completed tasks
        taskNotes: {}, // Map of taskId -> string
        taskTitles: {}, // Map of taskId -> custom title
        dsaSolved: { easy: 0, medium: 0, hard: 0 },
        // Study plan data is in window.STUDY_PLAN_SKELETON
    };

    // Load from LocalStorage
    const savedState = localStorage.getItem('mastery_tracker_state');
    if (savedState) {
        state = { ...state, ...JSON.parse(savedState) };
    }

    // --- DOM Elements ---
    const trackerLink = document.querySelector('[data-view="tracker"]');
    const dashboardLink = document.querySelector('[data-view="dashboard"]');
    const trackerView = document.getElementById('tracker-view');
    const dashboardView = document.getElementById('dashboard-view');
    const tasksContainer = document.getElementById('tasks-container');
    const currentDayTitle = document.getElementById('current-day-title');
    const currentWeekNum = document.getElementById('current-week-num');
    const prevDayBtn = document.getElementById('prev-day');
    const nextDayBtn = document.getElementById('next-day');
    const dsaCountDisplay = document.getElementById('dsa-solved-count');
    const xpProgressBar = document.getElementById('xp-progress');
    const xpText = document.getElementById('current-xp');
    const userLevelDisplay = document.getElementById('user-level');
    const userRankDisplay = document.getElementById('user-rank');
    const streakDisplay = document.getElementById('streak-number');

    // --- Core Functions ---

    function saveState() {
        localStorage.setItem('mastery_tracker_state', JSON.stringify(state));
        updateSidebarStats();
        updateTopStats();
    }

    function updateSidebarStats() {
        userLevelDisplay.textContent = state.userLevel;
        streakDisplay.textContent = state.streak;
        
        // XP Progress
        const levelThresholds = [0, 200, 500, 1000, 2000, 5000];
        const currentThreshold = levelThresholds[state.userLevel - 1];
        const nextThreshold = levelThresholds[state.userLevel] || 10000;
        const progress = ((state.userXP - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
        
        xpProgressBar.style.width = `${Math.min(100, progress)}%`;
        xpText.textContent = `${state.userXP} / ${nextThreshold} XP`;

        // Update Rank
        const ranks = ["Beginner", "Consistent Learner", "Problem Solver", "Advanced Coder", "Placement Ready"];
        userRankDisplay.textContent = ranks[Math.min(ranks.length - 1, state.userLevel - 1)];
    }

    function updateTopStats() {
        const totalSolved = state.dsaSolved.easy + state.dsaSolved.medium + state.dsaSolved.hard;
        dsaCountDisplay.textContent = `${totalSolved} / 120`;
        
        // Productivity score for current day
        const dayPlan = window.STUDY_PLAN_SKELETON.find(d => d.day === state.currentDay);
        const doneInDay = dayPlan.tasks.filter(t => state.completedTaskIds.includes(t.id)).length;
        const score = (doneInDay / dayPlan.tasks.length) * 100;
        document.getElementById('productivity-score').textContent = `${Math.round(score)}%`;
        
        // Ensure accurate label
        const statCards = document.querySelectorAll('.mini-stat-card .stat-title');
        if (statCards[1]) statCards[1].textContent = "Today's Efficiency";
    }

    function renderTasks() {
        tasksContainer.innerHTML = '';
        const dayPlan = window.STUDY_PLAN_SKELETON.find(d => d.day === state.currentDay);
        
        currentDayTitle.textContent = `Day ${state.currentDay}: ${dayPlan.tasks[0].title.split('-')[0]}`;
        currentWeekNum.textContent = dayPlan.week;

        dayPlan.tasks.forEach(task => {
            const isCompleted = state.completedTaskIds.includes(task.id);
            const card = document.createElement('div');
            card.className = `task-card ${isCompleted ? 'completed' : ''}`;
            
            card.innerHTML = `
                <span class="category-tag tag-${task.category.toLowerCase().replace(' ', '')}">${task.category}</span>
                <input class="task-title" value="${state.taskTitles[task.id] || task.title}" data-id="${task.id}">
                <div class="task-footer">
                    <span class="difficulty ${task.difficulty ? task.difficulty.toLowerCase() : ''}">${task.difficulty || ''}</span>
                    <button class="complete-btn" data-id="${task.id}">${isCompleted ? 'Completed' : 'Complete'}</button>
                </div>
                <textarea class="edit-notes" placeholder="Add learnings..." data-id="${task.id}">${state.taskNotes[task.id] || ''}</textarea>
            `;

            const btn = card.querySelector('.complete-btn');
            btn.onclick = () => toggleTask(task, card);

            const titleInput = card.querySelector('.task-title');
            titleInput.onchange = (e) => {
                if (!state.taskTitles) state.taskTitles = {};
                state.taskTitles[task.id] = e.target.value;
                saveState();
            };

            const notes = card.querySelector('.edit-notes');
            notes.onchange = (e) => {
                state.taskNotes[task.id] = e.target.value;
                saveState();
            };

            tasksContainer.appendChild(card);
        });

        updateProgressRing();
    }

    function toggleTask(task, card) {
        const index = state.completedTaskIds.indexOf(task.id);
        if (index === -1) {
            // Complete
            state.completedTaskIds.push(task.id);
            state.userXP += 10;
            if (task.category === 'DSA') {
                const diff = (task.difficulty || 'Easy').toLowerCase();
                state.dsaSolved[diff]++;
                
                // Refined achievement logic
                const totalSolved = state.dsaSolved.easy + state.dsaSolved.medium + state.dsaSolved.hard;
                if (totalSolved === 1) showAchievement("First Step!", "You solved your first DSA problem!");
                if (totalSolved === 10) showAchievement("Getting Serious", "10 problems solved. Keep going!");
                if (totalSolved === 50) showAchievement("Problem Solver", "50 DSA problems solved. Huge milestone!");
                if (totalSolved === 120) showAchievement("Placement Ready!", "120 DSA problems solved. Master status!");
            }
            
            // Check for bonus
            const dayPlan = window.STUDY_PLAN_SKELETON.find(d => d.day === state.currentDay);
            const allDone = dayPlan.tasks.every(t => state.completedTaskIds.includes(t.id));
            if (allDone) {
                state.userXP += 20;
                showAchievement("Daily Champion!", "You finished all tasks for Day " + state.currentDay);
            }

            const today = new Date().toDateString();
            if (state.lastCompletedDate !== today) {
                if (state.lastCompletedDate === new Date(Date.now() - 86400000).toDateString()) {
                    state.streak++;
                    if (state.streak === 7) showAchievement("Week on Fire!", "7-day study streak achieved!");
                } else if (!state.lastCompletedDate) {
                    state.streak = 1;
                }
                state.lastCompletedDate = today;
            }

            const thresholds = [0, 200, 500, 1000, 2000, 5000];
            if (state.userXP >= thresholds[state.userLevel]) {
                state.userLevel++;
                showAchievement("Level Up!", `Reached level ${state.userLevel}`);
            }
        } else {
            // Undo
            state.completedTaskIds.splice(index, 1);
            state.userXP = Math.max(0, state.userXP - 10);
            if (task.category === 'DSA') {
                const diff = (task.difficulty || 'Easy').toLowerCase();
                state.dsaSolved[diff] = Math.max(0, state.dsaSolved[diff] - 1);
            }
        }

        saveState();
        renderTasks();
    }

    function updateProgressRing() {
        const dayPlan = window.STUDY_PLAN_SKELETON.find(d => d.day === state.currentDay);
        const done = dayPlan.tasks.filter(t => state.completedTaskIds.includes(t.id)).length;
        const total = dayPlan.tasks.length;
        
        document.getElementById('tasks-done').textContent = done;
        document.getElementById('tasks-total').textContent = total;

        const circle = document.getElementById('day-progress-ring');
        const radius = circle.r.baseVal.value;
        const circumference = radius * 2 * Math.PI;
        const offset = circumference - (done / total) * circumference;
        circle.style.strokeDashoffset = offset;
    }

    function renderHeatmap() {
        const grid = document.getElementById('heatmap-grid');
        grid.innerHTML = '';
        
        for (let i = 1; i <= 60; i++) {
            const cell = document.createElement('div');
            const dayPlan = window.STUDY_PLAN_SKELETON.find(d => d.day === i);
            const doneCount = dayPlan.tasks.filter(t => state.completedTaskIds.includes(t.id)).length;
            
            let level = 0;
            if (doneCount > 0) level = 1;
            if (doneCount > 2) level = 2;
            if (doneCount > 3) level = 3;
            if (doneCount === dayPlan.tasks.length) level = 4;
            
            cell.className = `heatmap-cell level-${level}`;
            cell.title = `Day ${i}: ${doneCount} tasks`;
            grid.appendChild(cell);
        }
    }

    function showAchievement(title, desc) {
        const toast = document.getElementById('achievement-toast');
        document.getElementById('toast-title').textContent = title;
        document.getElementById('toast-desc').textContent = desc;
        toast.classList.remove('hidden');
        setTimeout(() => toast.classList.add('hidden'), 5000);
    }

    // --- Charting ---
    let progressChart, categoryChart, productivityChart;

    function initDashboard() {
        const ctx1 = document.getElementById('weeklyProgressChart').getContext('2d');
        const ctx2 = document.getElementById('categoryPieChart').getContext('2d');
        const ctx3 = document.getElementById('productivityLineChart').getContext('2d');

        // Weekly progress
        const weeklyData = [];
        for (let w = 1; w <= 8; w++) {
            const weekTasks = window.STUDY_PLAN_SKELETON.filter(d => d.week === w).flatMap(d => d.tasks);
            const done = weekTasks.filter(t => state.completedTaskIds.includes(t.id)).length;
            weeklyData.push(Math.round((done / weekTasks.length) * 100));
        }

        progressChart = new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
                datasets: [{
                    label: 'Completion %',
                    data: weeklyData,
                    backgroundColor: 'rgba(0, 210, 255, 0.5)',
                    borderColor: '#00d2ff',
                    borderWidth: 2,
                    borderRadius: 10
                }]
            },
            options: { responsive: true, scales: { y: { beginAtZero: true, max: 100 } } }
        });

        // Category Pie
        const categories = ["DSA", "Core CS", "AI/ML", "Aptitude", "Projects"];
        const catData = categories.map(cat => {
            const allOfCat = window.STUDY_PLAN_SKELETON.flatMap(d => d.tasks).filter(t => t.category === cat);
            return allOfCat.filter(t => state.completedTaskIds.includes(t.id)).length;
        });

        categoryChart = new Chart(ctx2, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: catData,
                    backgroundColor: ['#00d2ff', '#9d50bb', '#ff9a00', '#39ff14', '#ff3131'],
                    borderWidth: 0
                }]
            }
        });

        // Productivity Trend
        const productivityData = window.STUDY_PLAN_SKELETON.slice(Math.max(0, state.currentDay - 7), state.currentDay).map(day => {
            const done = day.tasks.filter(t => state.completedTaskIds.includes(t.id)).length;
            return (done / day.tasks.length) * 100;
        });

        productivityChart = new Chart(ctx3, {
            type: 'line',
            data: {
                labels: Array.from({length: productivityData.length}, (_, i) => `Day ${state.currentDay - (productivityData.length - 1) + i}`),
                datasets: [{
                    label: 'Efficiency',
                    data: productivityData,
                    borderColor: '#39ff14',
                    tension: 0.4,
                    fill: true,
                    backgroundColor: 'rgba(57, 255, 20, 0.1)'
                }]
            }
        });

        // DSA breakdown
        document.getElementById('easy-count').textContent = state.dsaSolved.easy;
        document.getElementById('medium-count').textContent = state.dsaSolved.medium;
        document.getElementById('hard-count').textContent = state.dsaSolved.hard;
        const totalSolved = state.dsaSolved.easy + state.dsaSolved.medium + state.dsaSolved.hard;
        document.getElementById('dsa-full-progress').style.width = `${(totalSolved / 120) * 100}%`;

        // Update productivity score label
        const currentDayPlan = window.STUDY_PLAN_SKELETON.find(d => d.day === state.currentDay);
        const doneToday = currentDayPlan.tasks.filter(t => state.completedTaskIds.includes(t.id)).length;
        const totalToday = currentDayPlan.tasks.length;
        const efficiencyToday = totalToday > 0 ? Math.round((doneToday / totalToday) * 100) : 0;
        document.getElementById('productivity-score').textContent = `${efficiencyToday}%`;
    }

    // --- Event Listeners ---
    trackerLink.onclick = () => {
        trackerLink.classList.add('active');
        dashboardLink.classList.remove('active');
        trackerView.classList.add('active');
        dashboardView.classList.remove('active');
        renderHeatmap();
    };

    dashboardLink.onclick = () => {
        dashboardLink.classList.add('active');
        trackerLink.classList.remove('active');
        dashboardView.classList.add('active');
        trackerView.classList.remove('active');
        if (progressChart) progressChart.destroy();
        if (categoryChart) categoryChart.destroy();
        if (productivityChart) productivityChart.destroy();
        initDashboard();
    };

    prevDayBtn.onclick = () => {
        if (state.currentDay > 1) {
            state.currentDay--;
            saveState();
            renderTasks();
        }
    };

    nextDayBtn.onclick = () => {
        if (state.currentDay < 60) {
            state.currentDay++;
            saveState();
            renderTasks();
        }
    };

    // --- Export / Import ---
    const exportBtn = document.getElementById('export-btn');
    const importBtn = document.getElementById('import-btn');
    const importFile = document.getElementById('import-file');

    exportBtn.onclick = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", `tracker_backup_${new Date().toLocaleDateString().replace(/\//g, '-')}.json`);
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        showAchievement("Backup Created!", "Transfer this file to your other device.");
    };

    importBtn.onclick = () => importFile.click();

    importFile.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const newState = JSON.parse(event.target.result);
                // Simple validation
                if (newState.hasOwnProperty('userXP') && newState.hasOwnProperty('completedTaskIds')) {
                    state = newState;
                    saveState();
                    location.reload(); // Refresh to apply all data
                } else {
                    alert("Invalid backup file!");
                }
            } catch (err) {
                alert("Error reading file!");
            }
        };
        reader.readAsText(file);
    };

    // --- Init ---
    updateSidebarStats();
    updateTopStats();
    renderTasks();
    renderHeatmap();
});
