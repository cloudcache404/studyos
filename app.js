/* ============================================================
   StudyOS — app.js
   Vanilla JS. All data in localStorage. No backend, no login.
   ============================================================ */
(() => {
  "use strict";

  /* ---------------- storage helpers ---------------- */
  const KEY = {
    tasks: "studyos.tasks",
    exams: "studyos.exams",
    cards: "studyos.cards",
    theme: "studyos.theme",
    timerSettings: "studyos.timerSettings",
    timerStats: "studyos.timerStats",      // {date: {sessions,minutes}}
    activeDays: "studyos.activeDays",      // {date: true}
    totals: "studyos.totals",              // {sessions,minutes,tasksCompleted}
  };

  const read = (k, fallback) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : fallback;
    } catch { return fallback; }
  };
  const write = (k, v) => {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { console.error("storage failed", e); }
  };
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const todayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  /* ---------------- state ---------------- */
  let tasks = read(KEY.tasks, []);
  let exams = read(KEY.exams, []);
  let cards = read(KEY.cards, []);
  let activeDays = read(KEY.activeDays, {});
  let timerStats = read(KEY.timerStats, {});
  let totals = read(KEY.totals, { sessions: 0, minutes: 0, tasksCompleted: 0 });
  let timerSettings = read(KEY.timerSettings, { focus: 25, short: 5, long: 15, sound: true });

  /* ---------------- toast ---------------- */
  const toastStack = document.getElementById("toastStack");
  function toast(msg) {
    const el = document.createElement("div");
    el.className = "toast";
    el.textContent = msg;
    toastStack.appendChild(el);
    setTimeout(() => el.remove(), 2600);
  }

  /* ---------------- confirm dialog ---------------- */
  const confirmBackdrop = document.getElementById("confirmBackdrop");
  const confirmMessage = document.getElementById("confirmMessage");
  const confirmOk = document.getElementById("confirmOk");
  const confirmCancel = document.getElementById("confirmCancel");
  let confirmResolver = null;
  function askConfirm(message) {
    confirmMessage.textContent = message;
    confirmBackdrop.hidden = false;
    return new Promise((resolve) => { confirmResolver = resolve; });
  }
  function resolveConfirm(val) {
    confirmBackdrop.hidden = true;
    if (confirmResolver) {
      const res = confirmResolver;
      confirmResolver = null;
      res(val);
    }
  }
  confirmOk.addEventListener("click", () => resolveConfirm(true));
  confirmCancel.addEventListener("click", () => resolveConfirm(false));
  confirmBackdrop.addEventListener("click", (e) => { if (e.target === confirmBackdrop) resolveConfirm(false); });

  /* ---------------- theme ---------------- */
  const themeToggle = document.getElementById("themeToggle");
  const settingsThemeSwitch = document.getElementById("settingsThemeSwitch");
  function applyTheme(t) {
    document.documentElement.setAttribute("data-theme", t);
    write(KEY.theme, t);
    settingsThemeSwitch.checked = t === "light";
  }
  applyTheme(read(KEY.theme, "dark"));
  themeToggle.addEventListener("click", () => {
    applyTheme(document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light");
  });
  settingsThemeSwitch.addEventListener("change", () => applyTheme(settingsThemeSwitch.checked ? "light" : "dark"));

  /* ---------------- routing ---------------- */
  const views = document.querySelectorAll(".view");
  const topbarTitle = document.getElementById("topbarTitle");
  const routeTitles = {
    dashboard: "Dashboard", tasks: "Tasks", focus: "Focus", exams: "Exams",
    flashcards: "Flashcards", batches: "Batches", notes: "Notes", progress: "Progress",
    calculator: "Calculator", links: "Links", settings: "Settings"
  };
  const moreSheet = document.getElementById("moreSheet");
  const moreSheetBackdrop = document.getElementById("moreSheetBackdrop");

  function closeMoreSheet() { moreSheet.hidden = true; moreSheetBackdrop.hidden = true; }

  function goTo(route) {
    if (route === "more") {
      moreSheet.hidden = false; moreSheetBackdrop.hidden = false;
      return;
    }
    closeMoreSheet();
    views.forEach(v => v.hidden = v.dataset.view !== route);
    topbarTitle.textContent = routeTitles[route] || "StudyOS";
    document.getElementById("viewScroll").scrollTop = 0;

    document.querySelectorAll(".sidenav__item,.bottomnav__item").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.route === route);
    });
    if (route === "tasks") renderTasks();
    if (route === "exams") renderExams();
    if (route === "flashcards") renderFlashcards();
    if (route === "progress") renderProgress();
    if (route === "focus") updateTimerDisplay();
  }

  document.querySelectorAll("[data-route]").forEach(btn => {
    btn.addEventListener("click", () => goTo(btn.dataset.route));
  });
  moreSheetBackdrop.addEventListener("click", closeMoreSheet);

  document.querySelectorAll("[data-quick]").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.dataset.quick;
      if (q === "focus") goTo("focus");
      if (q === "task") { goTo("tasks"); taskForm.hidden = false; taskTitle.focus(); }
      if (q === "exam") { goTo("exams"); examForm.hidden = false; if (examName) examName.focus(); }
      if (q === "batches") goTo("batches");
      if (q === "notes") goTo("notes");
    });
  });

  /* ---------------- greeting / date ---------------- */
  function renderGreeting() {
    const h = new Date().getHours();
    const g = h < 5 ? "Still up studying?" : h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : h < 21 ? "Good evening" : "Working late";
    document.getElementById("greeting").textContent = g;
    document.getElementById("todayDate").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

    const quotes = [
      "Small steps, every day, win the year.",
      "Focus on progress, not perfection.",
      "Your future self is watching. Make it count.",
      "One task at a time. That's all it takes.",
      "Consistency beats intensity — show up today.",
      "Every rep counts, even the small ones."
    ];
    document.getElementById("motivation").textContent = quotes[new Date().getDate() % quotes.length];
  }

  /* ---------------- streak logic ---------------- */
  function markActiveToday() {
    const k = todayKey();
    if (!activeDays[k]) {
      activeDays[k] = true;
      write(KEY.activeDays, activeDays);
      renderStreak();
    }
  }
  function computeStreak() {
    let streak = 0;
    let d = new Date();
    // if today isn't active yet, still count backwards from yesterday
    if (!activeDays[todayKey(d)]) d.setDate(d.getDate() - 1);
    while (activeDays[todayKey(d)]) {
      streak++;
      d.setDate(d.getDate() - 1);
    }
    return streak;
  }
  function computeBestStreak() {
    const days = Object.keys(activeDays).sort();
    if (!days.length) return 0;
    let best = 1, cur = 1;
    for (let i = 1; i < days.length; i++) {
      const prev = new Date(days[i-1]);
      const curD = new Date(days[i]);
      const diff = Math.round((curD - prev) / 86400000);
      cur = diff === 1 ? cur + 1 : 1;
      best = Math.max(best, cur);
    }
    return Math.max(best, computeStreak());
  }
  function renderStreak() {
    const s = computeStreak();
    document.getElementById("statStreak").textContent = s;
    document.getElementById("sideStreak").textContent = `🔥 ${s} day streak`;
  }

  /* ---------------- weekbar ---------------- */
  function renderWeekBar(target) {
    target.innerHTML = "";
    const labels = ["S","M","T","W","T","F","S"];
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const active = !!activeDays[todayKey(d)];
      const el = document.createElement("div");
      el.className = "weekbar__day";
      el.innerHTML = `<div class="weekbar__dot ${active ? "is-active" : ""}"></div><div class="weekbar__label">${labels[i]}</div>`;
      target.appendChild(el);
    }
  }

  /* ================= TASKS ================= */
  const taskForm = document.getElementById("taskForm");
  const taskTitle = document.getElementById("taskTitle");
  const taskSubject = document.getElementById("taskSubject");
  const taskDue = document.getElementById("taskDue");
  const taskPriority = document.getElementById("taskPriority");
  const openTaskForm = document.getElementById("openTaskForm");
  const cancelTaskForm = document.getElementById("cancelTaskForm");
  let taskFilter = "all";

  openTaskForm.addEventListener("click", () => { taskForm.hidden = !taskForm.hidden; if (!taskForm.hidden) taskTitle.focus(); });
  cancelTaskForm.addEventListener("click", () => { taskForm.reset(); taskForm.hidden = true; });

  taskForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!taskTitle.value.trim()) return;
    tasks.push({
      id: uid(), title: taskTitle.value.trim(), subject: taskSubject.value.trim(),
      due: taskDue.value || "", priority: taskPriority.value, done: false, createdAt: Date.now()
    });
    write(KEY.tasks, tasks);
    taskForm.reset(); taskForm.hidden = true;
    toast("Task added");
    renderTasks(); renderDashboard();
  });

  document.querySelectorAll(".filter-row .chip").forEach(chip => {
    chip.addEventListener("click", () => {
      taskFilter = chip.dataset.filter;
      document.querySelectorAll(".filter-row .chip").forEach(c => { c.classList.toggle("is-active", c === chip); c.setAttribute("aria-selected", c === chip); });
      renderTasks();
    });
  });

  function isOverdue(t) {
    if (!t.due || t.done) return false;
    return new Date(t.due + "T23:59:59") < new Date();
  }

  function taskItemHTML(t) {
    const overdue = isOverdue(t);
    const prioTag = `<span class="tag tag--prio-${t.priority}">${t.priority}</span>`;
    const subjTag = t.subject ? `<span class="tag">${escapeHTML(t.subject)}</span>` : "";
    const dueTag = t.due ? `<span class="tag ${overdue ? "tag--overdue" : ""}">${overdue ? "Overdue · " : ""}${formatDate(t.due)}</span>` : "";
    return `
      <li class="task ${t.done ? "is-done" : ""} ${overdue ? "task--overdue" : ""}" data-id="${t.id}">
        <button class="task__check" data-action="toggle" aria-label="Toggle complete">
          <svg class="icon"><use href="#i-check"/></svg>
        </button>
        <div class="task__body">
          <div class="task__title">${escapeHTML(t.title)}</div>
          <div class="task__meta">${prioTag}${subjTag}${dueTag}</div>
        </div>
        <button class="task__del" data-action="delete" aria-label="Delete task"><svg class="icon"><use href="#i-trash"/></svg></button>
      </li>`;
  }

  function renderTasks() {
    const full = document.getElementById("fullTaskList");
    const emptyState = document.getElementById("taskEmptyState");
    let list = tasks.slice().sort((a,b) => (a.done - b.done) || (a.due || "9999").localeCompare(b.due || "9999"));
    if (taskFilter === "pending") list = list.filter(t => !t.done);
    if (taskFilter === "completed") list = list.filter(t => t.done);
    full.innerHTML = list.map(taskItemHTML).join("");
    emptyState.hidden = list.length > 0;

    // dashboard mini list: tasks due today or overdue, pending
    const dash = document.getElementById("dashTaskList");
    const dashEmpty = document.getElementById("dashTaskEmpty");
    const tKey = todayKey();
    const todays = tasks.filter(t => !t.done && (t.due === tKey || isOverdue(t))).slice(0, 5);
    dash.innerHTML = todays.map(taskItemHTML).join("");
    dashEmpty.hidden = todays.length > 0;

    document.getElementById("statTasksToday").textContent =
      `${tasks.filter(t => t.due === tKey && t.done).length}/${tasks.filter(t => t.due === tKey).length}`;
  }

  document.addEventListener("click", async (e) => {
    const taskEl = e.target.closest(".task[data-id]");
    if (!taskEl) return;
    const id = taskEl.dataset.id;
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (action === "toggle") {
      t.done = !t.done;
      if (t.done) { totals.tasksCompleted++; write(KEY.totals, totals); markActiveToday(); }
      write(KEY.tasks, tasks);
      renderTasks(); renderDashboard();
    } else if (action === "delete") {
      const ok = await askConfirm("Delete this task? This can't be undone.");
      if (!ok) return;
      tasks = tasks.filter(x => x.id !== id);
      write(KEY.tasks, tasks);
      renderTasks(); renderDashboard();
      toast("Task deleted");
    }
  });

  /* ================= EXAMS ================= */
  const examForm = document.getElementById("examForm");
  const examName = document.getElementById("examName");
  const examSubject = document.getElementById("examSubject");
  const examDate = document.getElementById("examDate");
  document.getElementById("openExamForm").addEventListener("click", () => { examForm.hidden = !examForm.hidden; if (!examForm.hidden) examName.focus(); });
  document.getElementById("cancelExamForm").addEventListener("click", () => { examForm.reset(); examForm.hidden = true; });

  examForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!examName.value.trim() || !examDate.value) return;
    exams.push({ id: uid(), name: examName.value.trim(), subject: examSubject.value.trim(), date: examDate.value });
    write(KEY.exams, exams);
    examForm.reset(); examForm.hidden = true;
    toast("Exam added");
    renderExams(); renderDashboard();
  });

  function nearestExam() {
    const now = Date.now();
    return exams.filter(x => new Date(x.date).getTime() > now).sort((a,b) => new Date(a.date) - new Date(b.date))[0];
  }
  function countdownText(dateStr) {
    const diff = new Date(dateStr).getTime() - Date.now();
    if (diff <= 0) return "Happening now / passed";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h left`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m left`;
  }

  function renderExams() {
    const grid = document.getElementById("examGrid");
    const emptyState = document.getElementById("examEmptyState");
    const next = nearestExam();
    const sorted = exams.slice().sort((a,b) => new Date(a.date) - new Date(b.date));
    grid.innerHTML = sorted.map(x => `
      <article class="card exam-card ${next && x.id === next.id ? "is-next" : ""}" data-id="${x.id}">
        <button class="exam-card__del" data-action="delete-exam" aria-label="Delete exam"><svg class="icon"><use href="#i-trash"/></svg></button>
        <div class="exam-card__top">
          <div>
            <div class="exam-card__name">${escapeHTML(x.name)}</div>
            ${x.subject ? `<div class="exam-card__subject">${escapeHTML(x.subject)}</div>` : ""}
          </div>
        </div>
        <div class="exam-card__count">${countdownText(x.date)}</div>
        <div class="exam-card__date">${new Date(x.date).toLocaleString(undefined, { weekday:"short", month:"short", day:"numeric", hour:"2-digit", minute:"2-digit" })}</div>
      </article>
    `).join("");
    emptyState.hidden = sorted.length > 0;

    const nextCard = document.getElementById("nextExamCard");
    if (next) {
      document.getElementById("nextExamName").textContent = next.name + (next.subject ? ` · ${next.subject}` : "");
      document.getElementById("nextExamCountdown").textContent = countdownText(next.date);
    } else {
      document.getElementById("nextExamName").textContent = "No exams yet";
      document.getElementById("nextExamCountdown").textContent = "Add one to start the countdown";
    }
    document.getElementById("pExams").textContent = exams.length;
  }

  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-action='delete-exam']")) {
      const card = e.target.closest(".exam-card");
      const id = card.dataset.id;
      const ok = await askConfirm("Delete this exam?");
      if (!ok) return;
      exams = exams.filter(x => x.id !== id);
      write(KEY.exams, exams);
      renderExams(); renderDashboard();
      toast("Exam deleted");
    }
  });

  /* ================= FLASHCARDS ================= */
  const cardForm = document.getElementById("cardForm");
  const cardCategory = document.getElementById("cardCategory");
  const cardFront = document.getElementById("cardFront");
  const cardBack = document.getElementById("cardBack");
  document.getElementById("openCardForm").addEventListener("click", () => { cardForm.hidden = !cardForm.hidden; if (!cardForm.hidden) cardFront.focus(); });
  document.getElementById("cancelCardForm").addEventListener("click", () => { cardForm.reset(); cardForm.hidden = true; });

  let deckFilter = "all";
  let cardIndex = 0;

  cardForm.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!cardFront.value.trim() || !cardBack.value.trim()) return;
    cards.push({ id: uid(), category: cardCategory.value.trim() || "General", front: cardFront.value.trim(), back: cardBack.value.trim() });
    write(KEY.cards, cards);
    cardForm.reset(); cardForm.hidden = true;
    toast("Flashcard added");
    renderFlashcards();
  });

  function currentDeck() {
    return deckFilter === "all" ? cards : cards.filter(c => c.category === deckFilter);
  }

  function renderDeckSelect() {
    const row = document.getElementById("deckSelectRow");
    const cats = ["all", ...new Set(cards.map(c => c.category))];
    row.innerHTML = cats.map(c => `<button class="chip ${c === deckFilter ? "is-active" : ""}" data-deck="${escapeHTML(c)}">${c === "all" ? "All" : escapeHTML(c)}</button>`).join("");
    row.querySelectorAll("[data-deck]").forEach(btn => btn.addEventListener("click", () => {
      deckFilter = btn.dataset.deck; cardIndex = 0; renderFlashcards();
    }));
  }

  const flashcardEl = document.getElementById("flashcard");
  const flashcardInner = document.getElementById("flashcardInner");

  function renderFlashcards() {
    if (deckFilter !== "all" && !cards.some(c => c.category === deckFilter)) {
      deckFilter = "all";
    }
    renderDeckSelect();
    const deck = currentDeck();
    if (cardIndex >= deck.length) cardIndex = 0;
    flashcardEl.classList.remove("is-flipped");
    document.getElementById("deleteCard").hidden = deck.length === 0;

    if (deck.length === 0) {
      document.getElementById("cardFrontText").textContent = "Add a flashcard to start revising";
      document.getElementById("cardBackText").textContent = "";
      document.getElementById("cardTagFront").textContent = "";
      document.getElementById("cardTagBack").textContent = "";
      document.getElementById("cardPosition").textContent = "0 / 0";
      return;
    }
    const c = deck[cardIndex];
    document.getElementById("cardFrontText").textContent = c.front;
    document.getElementById("cardBackText").textContent = c.back;
    document.getElementById("cardTagFront").textContent = c.category;
    document.getElementById("cardTagBack").textContent = c.category;
    document.getElementById("cardPosition").textContent = `${cardIndex + 1} / ${deck.length}`;
  }

  flashcardEl.addEventListener("click", () => {
    if (currentDeck().length > 0) flashcardEl.classList.toggle("is-flipped");
  });
  flashcardEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (currentDeck().length > 0) flashcardEl.classList.toggle("is-flipped");
    }
  });

  document.getElementById("cardPrev").addEventListener("click", () => {
    const deck = currentDeck(); if (!deck.length) return;
    cardIndex = (cardIndex - 1 + deck.length) % deck.length; renderFlashcards();
  });
  document.getElementById("cardNext").addEventListener("click", () => {
    const deck = currentDeck(); if (!deck.length) return;
    cardIndex = (cardIndex + 1) % deck.length; renderFlashcards();
  });
  document.getElementById("deleteCard").addEventListener("click", async () => {
    const deck = currentDeck();
    if (!deck.length) return;
    const target = deck[cardIndex];
    const ok = await askConfirm("Delete this flashcard?");
    if (!ok) return;
    cards = cards.filter(c => c.id !== target.id);
    write(KEY.cards, cards);
    toast("Flashcard deleted");
    renderFlashcards();
  });

  /* ================= FOCUS / POMODORO ================= */
  const MODE_LABEL = { focus: "Focus", short: "Short break", long: "Long break" };
  let mode = "focus";
  let sessionCount = read("studyos.sessionCount", 1);
  let remaining = timerSettings.focus * 60;
  let totalForMode = timerSettings.focus * 60;
  let running = false;
  let tickHandle = null;
  const RING_CIRC = 615.75;

  const timerDisplay = document.getElementById("timerDisplay");
  const timerRingProgress = document.getElementById("timerRingProgress");
  const timerSessionLabel = document.getElementById("timerSessionLabel");
  const timerStartPause = document.getElementById("timerStartPause");

  document.getElementById("durFocus").value = timerSettings.focus;
  document.getElementById("durShort").value = timerSettings.short;
  document.getElementById("durLong").value = timerSettings.long;
  document.getElementById("durSound").checked = timerSettings.sound;

  function durationForMode(m) { return timerSettings[m] * 60; }

  function setMode(m, resetTime = true) {
    mode = m;
    document.querySelectorAll(".focus-modes .chip").forEach(c => { c.classList.toggle("is-active", c.dataset.mode === m); c.setAttribute("aria-selected", c.dataset.mode === m); });
    if (resetTime) { remaining = durationForMode(m); totalForMode = remaining; }
    timerSessionLabel.textContent = mode === "focus" ? `Session ${sessionCount}` : MODE_LABEL[m];
    updateTimerDisplay();
  }

  document.querySelectorAll(".focus-modes .chip").forEach(chip => {
    chip.addEventListener("click", () => { pauseTimer(); setMode(chip.dataset.mode); });
  });

  function updateTimerDisplay() {
    const m = Math.floor(remaining / 60), s = remaining % 60;
    timerDisplay.textContent = `${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`;
    const frac = totalForMode > 0 ? remaining / totalForMode : 0;
    timerRingProgress.style.strokeDashoffset = String(RING_CIRC * (1 - frac));
    timerRingProgress.style.stroke = mode === "focus" ? "var(--violet)" : "var(--green)";
  }

  function playChime() {
    if (!document.getElementById("durSound").checked) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; g.gain.value = 0.0001;
      o.start();
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      o.stop(ctx.currentTime + 0.95);
    } catch {}
  }

  function notify(title, body) {
    if (window.Notification && Notification.permission === "granted") {
      try { new Notification(title, { body }); } catch {}
    }
  }

  function tick() {
    remaining--;
    if (remaining <= 0) {
      completeSession();
      return;
    }
    updateTimerDisplay();
  }

  function completeSession() {
    pauseTimer();
    playChime();
    if (mode === "focus") {
      const k = todayKey();
      const stat = timerStats[k] || { sessions: 0, minutes: 0 };
      stat.sessions++; stat.minutes += timerSettings.focus;
      timerStats[k] = stat; write(KEY.timerStats, timerStats);
      totals.sessions++; totals.minutes += timerSettings.focus; write(KEY.totals, totals);
      markActiveToday();
      notify("Focus session complete", "Nice work — take a break.");
      toast("Focus session complete 🎉");
      sessionCount++;
      write("studyos.sessionCount", sessionCount);
      setMode(sessionCount % 4 === 0 ? "long" : "short");
    } else {
      notify("Break's over", "Ready for another focus session?");
      toast("Break complete — back to it!");
      setMode("focus");
    }
    renderDashboard(); renderProgress();
  }

  function startTimer() {
    if (running) return;
    running = true;
    timerStartPause.textContent = "Pause";
    tickHandle = setInterval(tick, 1000);
  }
  function pauseTimer() {
    running = false;
    timerStartPause.textContent = "Start";
    clearInterval(tickHandle);
  }
  timerStartPause.addEventListener("click", () => running ? pauseTimer() : startTimer());
  document.getElementById("timerReset").addEventListener("click", () => { pauseTimer(); remaining = durationForMode(mode); totalForMode = remaining; updateTimerDisplay(); });
  document.getElementById("timerSkip").addEventListener("click", () => {
    pauseTimer();
    if (mode === "focus") { setMode(sessionCount % 4 === 0 ? "long" : "short"); }
    else { setMode("focus"); }
  });

  ["durFocus","durShort","durLong","durSound"].forEach(id => {
    document.getElementById(id).addEventListener("change", () => {
      timerSettings = {
        focus: Math.max(1, Number(document.getElementById("durFocus").value) || 25),
        short: Math.max(1, Number(document.getElementById("durShort").value) || 5),
        long: Math.max(1, Number(document.getElementById("durLong").value) || 15),
        sound: document.getElementById("durSound").checked
      };
      write(KEY.timerSettings, timerSettings);
      if (!running) { remaining = durationForMode(mode); totalForMode = remaining; updateTimerDisplay(); }
    });
  });

  setMode("focus");

  /* ================= CALCULATOR ================= */
  let calcExprStr = "";
  const calcExprEl = document.getElementById("calcExpr");
  const calcResultEl = document.getElementById("calcResult");

  function calcSafeEval(expr) {
    if (!expr || !expr.trim()) return 0;
    const sanitized = expr.replace(/√/g, "sqrt").replace(/\^/g, "**");
    // whitelist check
    const stripped = sanitized.replace(/sqrt/g, "");
    if (!/^[0-9+\-*/().%\s]*$/.test(stripped)) throw new Error("bad expr");
    const withSqrt = sanitized.replace(/sqrt\(([^()]*)\)/g, "Math.sqrt($1)").replace(/sqrt/g, "Math.sqrt");
    const withPercent = withSqrt.replace(/(\d+(\.\d+)?)%/g, "($1/100)");
    // eslint-disable-next-line no-new-func
    const fn = new Function(`"use strict"; return (${withPercent || "0"});`);
    const val = fn();
    if (typeof val !== "number" || !isFinite(val)) throw new Error("bad result");
    return val;
  }

  function refreshCalcScreen() {
    calcExprEl.textContent = calcExprStr || "\u00a0";
  }

  document.getElementById("calcGrid").addEventListener("click", (e) => {
    const btn = e.target.closest(".calc__key");
    if (!btn) return;
    const k = btn.dataset.k;
    if (k === "clear") { calcExprStr = ""; calcResultEl.textContent = "0"; refreshCalcScreen(); return; }
    if (k === "back") { calcExprStr = calcExprStr.slice(0, -1); refreshCalcScreen(); return; }
    if (k === "sqrt") { calcExprStr += "√("; refreshCalcScreen(); return; }
    if (k === "^") { calcExprStr += "^"; refreshCalcScreen(); return; }
    if (k === "=") {
      try {
        const val = calcSafeEval(calcExprStr);
        calcResultEl.textContent = String(Math.round(val * 1e10) / 1e10);
        calcExprStr = String(Math.round(val * 1e10) / 1e10);
      } catch { calcResultEl.textContent = "Error"; }
      refreshCalcScreen();
      return;
    }
    calcExprStr += k;
    refreshCalcScreen();
    try { calcResultEl.textContent = String(Math.round(calcSafeEval(calcExprStr) * 1e10) / 1e10); } catch {}
  });

  /* ================= NOTIFICATIONS SETTINGS ================= */
  const notifStatus = document.getElementById("notifStatus");
  function refreshNotifStatus() {
    if (!window.Notification) { notifStatus.textContent = "Notifications aren't supported on this browser."; return; }
    if (Notification.permission === "granted") notifStatus.textContent = "Notifications are enabled.";
    else if (Notification.permission === "denied") notifStatus.textContent = "Notifications are blocked in your browser settings.";
    else notifStatus.textContent = "Not enabled yet.";
  }
  refreshNotifStatus();
  document.getElementById("enableNotifs").addEventListener("click", () => {
    if (!window.Notification) { toast("Notifications aren't supported here"); return; }
    Notification.requestPermission().then(() => { refreshNotifStatus(); });
  });

  /* ================= RESET DATA ================= */
  document.getElementById("resetData").addEventListener("click", async () => {
    const ok = await askConfirm("Reset all StudyOS data? Tasks, exams, flashcards, streaks and stats will be permanently deleted.");
    if (!ok) return;
    Object.values(KEY).forEach(k => localStorage.removeItem(k));
    localStorage.removeItem("studyos.sessionCount");
    toast("All data cleared");
    setTimeout(() => location.reload(), 700);
  });

  /* ================= PROGRESS VIEW ================= */
  function renderProgress() {
    document.getElementById("pSessions").textContent = totals.sessions;
    const h = Math.floor(totals.minutes / 60), m = totals.minutes % 60;
    document.getElementById("pFocusTime").textContent = `${h}h ${m}m`;
    document.getElementById("pTasks").textContent = totals.tasksCompleted;
    document.getElementById("pStreak").textContent = computeStreak();
    document.getElementById("pBestStreak").textContent = computeBestStreak();
    document.getElementById("pExams").textContent = exams.length;
    renderWeekBar(document.getElementById("weekBarFull"));
  }

  /* ================= DASHBOARD AGGREGATE ================= */
  function renderDashboard() {
    renderGreeting();
    renderStreak();
    const k = todayKey();
    const stat = timerStats[k] || { sessions: 0, minutes: 0 };
    document.getElementById("statFocusToday").textContent = `${stat.minutes}m`;
    document.getElementById("statFocusSessions").textContent = `${stat.sessions} session${stat.sessions === 1 ? "" : "s"}`;
    document.getElementById("focusSessionsToday").textContent = stat.sessions;
    document.getElementById("focusMinutesToday").textContent = stat.minutes;
    renderTasks();
    renderExams();
    renderWeekBar(document.getElementById("weekBar"));
  }

  /* ---------------- utils ---------------- */
  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
  }
  function formatDate(iso) {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00");
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  }

  /* ---------------- keyboard shortcuts ---------------- */
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!confirmBackdrop.hidden) { resolveConfirm(false); return; }
      if (!moreSheet.hidden) { closeMoreSheet(); return; }
      if (!taskForm.hidden) { taskForm.reset(); taskForm.hidden = true; }
      if (!examForm.hidden) { examForm.reset(); examForm.hidden = true; }
      if (!cardForm.hidden) { cardForm.reset(); cardForm.hidden = true; }
      return;
    }
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;
    if (e.key === "1") goTo("dashboard");
    if (e.key === "2") goTo("tasks");
    if (e.key === "3") goTo("focus");
    if (e.key === "4") goTo("flashcards");
    if (e.key === "5") goTo("batches");
    if (e.key === "6") goTo("notes");
    if (e.key === " " && document.getElementById("view-focus").hidden === false) { e.preventDefault(); running ? pauseTimer() : startTimer(); }
  });

  /* ---------------- init ---------------- */
  renderDashboard();
  renderProgress();
  goTo("dashboard");

  // exam countdown live refresh
  setInterval(() => {
    if (!document.getElementById("view-exams").hidden) renderExams();
    if (!document.getElementById("view-dashboard").hidden) {
      const next = nearestExam();
      if (next) document.getElementById("nextExamCountdown").textContent = countdownText(next.date);
    }
  }, 30000);

})();
