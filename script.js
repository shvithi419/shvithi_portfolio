
const $ = (selector) => document.querySelector(selector);

const taskForm = $("#taskForm");
const taskList = $("#taskList");
const emptyState = $("#emptyState");
const searchInput = $("#searchInput");
const toast = $("#toast");

const STORAGE_KEY = "studyRoomTasks";
const today = getLocalDate();

let tasks = loadTasks();
let activeFilter = "all";
let activeView = "all";
let toastTimeout;
let timerInterval = null;
let selectedMinutes = 25;
let remainingSeconds = selectedMinutes * 60;
let timerRunning = false;
let deferredInstallPrompt = null;

function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function loadTasks() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    const parsed = stored ? JSON.parse(stored) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch {
    showToast("Could not save tasks in this browser.");
    return false;
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove("show"), 2600);
}

function formatDate(dateString) {
  if (!dateString) return "No due date";
  const date = new Date(`${dateString}T12:00:00`);
  if (Number.isNaN(date.getTime())) return dateString;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });
}

function updateDateLabels() {
  const now = new Date();

  $("#todayLabel").textContent = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric"
  });

  $("#dayNumber").textContent = now.getDate();
  $("#monthName").textContent = now
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();
  $("#yearNumber").textContent = now.getFullYear();
  $("#footerYear").textContent = now.getFullYear();

  const hour = now.getHours();
  let greeting = "GOOD EVENING";
  if (hour < 12) greeting = "GOOD MORNING";
  else if (hour < 17) greeting = "GOOD AFTERNOON";

  $("#greeting").textContent = `${greeting}, WELCOME TO YOUR STUDY SPACE`;
}

function getVisibleTasks() {
  const query = searchInput.value.trim().toLowerCase();

  return tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(query) ||
      task.subject.toLowerCase().includes(query);

    let matchesView = true;

    if (activeView === "today") {
      matchesView = task.dueDate === today && !task.completed;
    } else if (activeView === "upcoming") {
      matchesView = task.dueDate > today && !task.completed;
    } else if (activeView === "completed") {
      matchesView = task.completed;
    }

    let matchesFilter = true;

    if (activeFilter === "pending") {
      matchesFilter = !task.completed;
    } else if (activeFilter === "completed") {
      matchesFilter = task.completed;
    }

    return matchesSearch && matchesView && matchesFilter;
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;

    const priorityRank = { high: 0, medium: 1, low: 2 };
    const priorityDifference =
      priorityRank[a.priority] - priorityRank[b.priority];

    if (!a.completed && priorityDifference !== 0) {
      return priorityDifference;
    }

    return a.dueDate.localeCompare(b.dueDate);
  });
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  $("#totalCount").textContent = total;
  $("#completedCount").textContent = completed;
  $("#progressPercent").textContent = `${percent}%`;
  $("#progressFill").style.width = `${percent}%`;
}

function renderTasks() {
  const visibleTasks = getVisibleTasks();
  taskList.replaceChildren();

  $("#visibleCount").textContent =
    `${visibleTasks.length} ${visibleTasks.length === 1 ? "task" : "tasks"}`;

  emptyState.classList.toggle("visible", visibleTasks.length === 0);
  taskList.hidden = visibleTasks.length === 0;

  if (visibleTasks.length === 0) {
    const title = $("#emptyState h3");
    const message = $("#emptyState p");

    if (searchInput.value.trim()) {
      title.textContent = "Nothing found.";
      message.textContent = "Try another search term.";
    } else if (activeView === "completed" || activeFilter === "completed") {
      title.textContent = "A clean finish.";
      message.textContent = "Completed tasks will show up here.";
    } else {
      title.textContent = "A fresh page.";
      message.textContent = "Add your first task above and make today count.";
    }
  }

  for (const task of visibleTasks) {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " is-completed" : ""}`;

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-check";
    checkbox.checked = task.completed;
    checkbox.setAttribute("aria-label", `Complete ${task.title}`);
    checkbox.addEventListener("change", () => toggleTask(task.id));

    const body = document.createElement("div");
    body.className = "task-body";

    const title = document.createElement("div");
    title.className = "task-title";
    title.textContent = task.title;

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const subject = document.createElement("span");
    subject.className = "subject-tag";
    subject.textContent = task.subject || "General";

    const due = document.createElement("span");
    due.textContent = `Due ${formatDate(task.dueDate)}`;

    meta.append(subject, due);
    body.append(title, meta);

    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = task.priority;

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.className = "icon-button";
    editButton.type = "button";
    editButton.textContent = "✎";
    editButton.title = "Edit task";
    editButton.setAttribute("aria-label", `Edit ${task.title}`);
    editButton.addEventListener("click", () => editTask(task.id));

    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button";
    deleteButton.type = "button";
    deleteButton.textContent = "×";
    deleteButton.title = "Delete task";
    deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
    deleteButton.addEventListener("click", () => deleteTask(task.id));

    actions.append(editButton, deleteButton);
    item.append(checkbox, body, priority, actions);
    taskList.append(item);
  }

  updateStats();
}

function setActiveView(view) {
  activeView = view;

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === view);
  });

  const headings = {
    all: ["Make room<br>for <em>growth.</em>", "The plan <em>for today.</em>"],
    today: ["A little focus<br>for <em>today.</em>", "Today's <em>tasks.</em>"],
    upcoming: ["Look ahead.<br>Plan <em>gently.</em>", "Coming <em>up.</em>"],
    completed: ["Look how far<br>you've <em>come.</em>", "Your <em>completed tasks.</em>"]
  };

  $("#pageTitle").innerHTML = headings[view][0];
  $("#taskHeading").innerHTML = headings[view][1];

  activeFilter = "all";
  document.querySelectorAll(".filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === "all");
  });

  renderTasks();
}

function addTask(event) {
  event.preventDefault();

  const title = $("#taskTitle").value.trim();
  const subject = $("#taskSubject").value.trim();
  const dueDate = $("#taskDate").value;
  const priority = $("#taskPriority").value;

  if (!title) {
    showToast("Please enter a task name.");
    return;
  }

  if (!dueDate) {
    showToast("Please choose a due date.");
    return;
  }

  const editingId = taskForm.dataset.editingId;

  if (editingId) {
    tasks = tasks.map((task) =>
      task.id === editingId
        ? { ...task, title, subject, dueDate, priority }
        : task
    );

    delete taskForm.dataset.editingId;
    taskForm.querySelector('button[type="submit"]').textContent = "+ Add task";
    showToast("Task updated.");
  } else {
    tasks.push({
      id: makeId(),
      title,
      subject,
      dueDate,
      priority,
      completed: false,
      createdAt: new Date().toISOString()
    });

    showToast("Task added to your list.");
  }

  saveTasks();
  taskForm.reset();
  $("#taskDate").value = today;
  $("#taskPriority").value = "medium";
  renderTasks();
}

function makeId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function toggleTask(id) {
  tasks = tasks.map((task) =>
    task.id === id ? { ...task, completed: !task.completed } : task
  );

  saveTasks();
  renderTasks();
}

function deleteTask(id) {
  tasks = tasks.filter((task) => task.id !== id);
  saveTasks();
  renderTasks();
  showToast("Task deleted.");
}

function editTask(id) {
  const task = tasks.find((item) => item.id === id);
  if (!task) return;

  $("#taskTitle").value = task.title;
  $("#taskSubject").value = task.subject;
  $("#taskDate").value = task.dueDate;
  $("#taskPriority").value = task.priority;

  taskForm.dataset.editingId = task.id;
  taskForm.querySelector('button[type="submit"]').textContent = "Save changes";

  taskForm.scrollIntoView({ behavior: "smooth", block: "center" });
  $("#taskTitle").focus();
}

function setFilter(filter) {
  activeFilter = filter;

  document.querySelectorAll(".filter").forEach((button) => {
    button.classList.toggle("active", button.dataset.filter === filter);
  });

  renderTasks();
}

// Focus timer
function stopTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  timerRunning = false;
}

function updateTimerDisplay() {
  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  $("#timerDisplay").textContent =
    `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  const totalSeconds = selectedMinutes * 60;
  const progress = totalSeconds === 0
    ? 0
    : ((totalSeconds - remainingSeconds) / totalSeconds) * 100;

  $("#timerProgress").style.width = `${progress}%`;
  $("#timerToggle").textContent = timerRunning ? "Pause timer" : "Start focusing";
}

function chooseTimer(minutes) {
  stopTimer();
  selectedMinutes = minutes;
  remainingSeconds = minutes * 60;

  document.querySelectorAll(".timer-tab").forEach((button) => {
    button.classList.toggle(
      "active",
      Number(button.dataset.minutes) === minutes
    );
  });

  $("#timerCaption").textContent =
    minutes === 25 ? "25 minutes for what matters." : "Take a breath. You've earned it.";

  updateTimerDisplay();
}

function toggleTimer() {
  if (timerRunning) {
    stopTimer();
    updateTimerDisplay();
    return;
  }

  if (remainingSeconds <= 0) {
    remainingSeconds = selectedMinutes * 60;
  }

  timerRunning = true;
  updateTimerDisplay();

  timerInterval = setInterval(() => {
    remainingSeconds -= 1;

    if (remainingSeconds <= 0) {
      remainingSeconds = 0;
      stopTimer();
      updateTimerDisplay();
      $("#timerCaption").textContent =
        selectedMinutes === 25
          ? "Focus session complete. Time for a little break."
          : "Break complete. Ready when you are.";

      showToast("Timer finished!");
      return;
    }

    updateTimerDisplay();
  }, 1000);
}

function resetTimer() {
  stopTimer();
  remainingSeconds = selectedMinutes * 60;
  updateTimerDisplay();
}

// Optional PWA installation
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
  $("#installBtn").hidden = false;
});

$("#installBtn").addEventListener("click", async () => {
  if (!deferredInstallPrompt) {
    showToast("Use your browser menu to install this app.");
    return;
  }

  deferredInstallPrompt.prompt();
  await deferredInstallPrompt.userChoice;
  deferredInstallPrompt = null;
  $("#installBtn").hidden = true;
});

// Connect the interface
taskForm.addEventListener("submit", addTask);
searchInput.addEventListener("input", renderTasks);

document.querySelectorAll(".nav-item").forEach((button) => {
  button.addEventListener("click", () => setActiveView(button.dataset.view));
});

document.querySelectorAll(".filter").forEach((button) => {
  button.addEventListener("click", () => setFilter(button.dataset.filter));
});

document.querySelectorAll(".timer-tab").forEach((button) => {
  button.addEventListener("click", () => chooseTimer(Number(button.dataset.minutes)));
});

$("#timerToggle").addEventListener("click", toggleTimer);
$("#timerReset").addEventListener("click", resetTimer);

// Start the app
updateDateLabels();
$("#taskDate").value = today;
chooseTimer(25);
renderTasks();

// Register offline support when hosted on HTTPS or localhost.
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {
      // The app still works if offline support cannot be registered.
    });
  });
}
