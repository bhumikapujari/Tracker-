/**
 * 60-Day Technical Study Plan Skeleton
 * Categories: DSA, Core CS, AI/ML, Aptitude, Projects
 */

const studyPlan = [];

const categories = ["DSA", "Core CS", "AI/ML", "Aptitude", "Projects"];
const dsTopics = [
    "Arrays", "Strings", "Linked Lists", "Stacks & Queues", 
    "Trees", "Graphs", "Recursion", "Dynamic Programming", 
    "Sliding Window", "Two Pointers", "Binary Search", "Heaps", "Tries"
];
const coreTopics = ["OOP Basics", "DBMS Normalization", "OS Scheduling", "Computer Networks", "SQL Queries", "Memory Management"];
const aiTopics = ["Intro to ML", "Regression", "Classification", "Neural Networks", "NLP Basics", "Computer Vision Basics"];
const aptTopics = ["Percentages", "Profit & Loss", "Time & Work", "Probability", "Number Systems", "Logical Reasoning"];

for (let i = 1; i <= 60; i++) {
    const dayTasks = [];
    
    // Day 1-20: Focus on Basics
    // Day 21-40: Intermediate & Projects
    // Day 41-60: Advanced & Mock Tests
    
    // Add DSA Task
    dayTasks.push({
        id: `d${i}-t1`,
        category: "DSA",
        title: dsTopics[(i - 1) % dsTopics.length] + " - Problem " + (Math.floor((i-1)/dsTopics.length) + 1),
        difficulty: i < 20 ? "Easy" : (i < 45 ? "Medium" : "Hard"),
        completed: false,
        notes: "",
        platform: "LeetCode"
    });

    // Add Core CS Task
    dayTasks.push({
        id: `d${i}-t2`,
        category: "Core CS",
        title: coreTopics[(i - 1) % coreTopics.length],
        completed: false,
        notes: ""
    });

    // Add AI/ML Task
    dayTasks.push({
        id: `d${i}-t3`,
        category: "AI/ML",
        title: aiTopics[(i - 1) % aiTopics.length],
        completed: false,
        notes: ""
    });

    // Add Aptitude Task
    dayTasks.push({
        id: `d${i}-t4`,
        category: "Aptitude",
        title: aptTopics[(i - 1) % aptTopics.length],
        completed: false,
        notes: ""
    });

    // Add Project Task (Every 2nd day)
    if (i % 2 === 0) {
        dayTasks.push({
            id: `d${i}-t5`,
            category: "Projects",
            title: i < 30 ? "House Price Prediction" : "Plant Disease Detection",
            completed: false,
            notes: ""
        });
    }

    studyPlan.push({
        day: i,
        week: Math.ceil(i / 7),
        tasks: dayTasks
    });
}

window.STUDY_PLAN_SKELETON = studyPlan;
