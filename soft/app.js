// /soft/app.js
// Use a single React/ReactDOM, and let framer-motion build against them.
// IMPORTANT: do NOT use ?external for framer-motion; use ?deps=... instead.
import React, { useEffect, useMemo, useRef, useState } from 'https://esm.sh/react@18.3.1';
import { createRoot } from 'https://esm.sh/react-dom@18.3.1/client?deps=react@18.3.1';
import { motion, AnimatePresence } from 'https://esm.sh/framer-motion@11.3.30?deps=react@18.3.1';
import confetti from 'https://esm.sh/canvas-confetti@1';

/** Tailwind class helpers (dark teal theme) */
const chipBase =
  "inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs text-slate-200";
const cardBase =
  "rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl shadow-black/20 focus-within:ring-2 focus-within:ring-teal-500/60";
const btnBase =
  "px-3 py-2 rounded-xl bg-slate-800 text-slate-100 border border-slate-700 hover:bg-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/70 disabled:opacity-40 disabled:cursor-not-allowed";
const toggleBase =
  "px-3 py-2 rounded-xl border border-slate-700 bg-slate-800/80 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/70";

/** Utils */
const fmtLong = (d) =>
  d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" });
const fmtShort = (d) => d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
const iso = (d) => d.toISOString().slice(0, 10);

function getNextMonday(base = new Date()) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const day = d.getDay(); // 0..6
  const delta = (8 - day) % 7 || 7; // next Monday (1..7 days ahead)
  d.setDate(d.getDate() + delta);
  return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function isThursday(d) { return d.getDay() === 4; }
function workoutHelp(d) {
  const wd = d.getDay();
  if (wd === 1 || wd === 3 || wd === 5) return "Suggested: Strength";
  if (wd === 2 || wd === 4) return "Suggested: Cardio/Recovery";
  return "Optional: Light activity";
}
function storageKey(startISO, lengthDays) { return `seventyfive-soft-${startISO}-${lengthDays}`; }
function makeDayEntry(d) { return { date: iso(d), exercise: false, glutenFree: false, noAlcohol: false, reading: false, waterOz: 0 }; }

function completedTaskCount(day) {
  let c = 0;
  if (day.exercise) c++;
  if (day.glutenFree) c++;
  if (day.noAlcohol) c++;
  if (day.reading) c++;
  if (day.waterOz >= 100) c++;
  return c;
}
function isPerfectDay(day) { return (day.exercise && day.glutenFree && day.noAlcohol && day.reading && day.waterOz >= 100); }

function computeStreaks(days) {
  const todayISO = iso(new Date());
  // Longest
  let longest = 0, run = 0;
  for (let i = 0; i < days.length; i++) {
    if (isPerfectDay(days[i])) { run += 1; if (run > longest) longest = run; }
    else run = 0;
  }
  // Current (ending at today or the most recent day <= today)
  let current = 0;
  let lastIdx = -1;
  for (let i = days.length - 1; i >= 0; i--) { if (days[i].date <= todayISO) { lastIdx = i; break; } }
  if (lastIdx >= 0) {
    for (let j = lastIdx; j >= 0; j--) { if (isPerfectDay(days[j])) current += 1; else break; }
  }
  return { current, longest };
}

/** Toggle (full-button color when pressed) */
function Toggle({ label, help, pressed, onToggle, id }) {
  return (
    React.createElement(motion.button, {
      id, type: "button",
      onClick: () => onToggle(!pressed),
      "aria-pressed": pressed,
      "aria-describedby": help ? `${id}-help` : undefined,
      className: `${toggleBase} inline-flex items-center gap-2 ${pressed ? "bg-teal-700/30 border-teal-500 text-teal-100" : ""}`,
      whileTap: { scale: 0.98 },
      whileHover: { y: -1 },
      transition: { type: "spring", stiffness: 400, damping: 20 }
    },
      React.createElement("span", {
        "aria-hidden": true,
        className: `h-3 w-3 rounded-full border ${pressed ? "bg-teal-300 border-teal-200 shadow-[0_0_0.25rem_#2dd4bf80]" : "border-slate-500"}`
      }),
      React.createElement("span", { className: "text-sm font-medium" }, label),
      help ? React.createElement("span", { id: `${id}-help`, className: "sr-only" }, help) : null
    )
  );
}

/** Water control with animated bar */
function WaterControl({ value, onChange, goal = 100, dayId }) {
  const increments = [8, 12, 16, 20, 24, 32];
  const pct = Math.min(100, Math.round((value / goal) * 100));
  return (
    React.createElement("div", null,
      React.createElement("div", { className: "flex items-center justify-between gap-3" },
        React.createElement("div", { className: "text-sm text-slate-300" }, "Water"),
        React.createElement("div", { className: "text-sm tabular-nums text-slate-200" }, `${value} oz`)
      ),
      React.createElement("div", {
        role: "progressbar", "aria-label": "Water progress",
        "aria-valuemin": 0, "aria-valuemax": goal, "aria-valuenow": Math.min(value, goal),
        className: "mt-2 h-3 w-full rounded-full bg-slate-800 border border-slate-700 overflow-hidden"
      },
        React.createElement(motion.div, {
          className: "h-full bg-teal-500",
          initial: { width: 0 },
          animate: { width: `${pct}%` },
          transition: { type: "spring", stiffness: 200, damping: 24 }
        })
      ),
      React.createElement("div", { className: "mt-3 flex flex-wrap gap-2" },
        increments.map((inc) =>
          React.createElement(motion.button, {
            key: `${dayId}-inc-${inc}`, type: "button", className: `${btnBase} text-xs`,
            onClick: () => onChange(Math.max(0, value + inc)),
            whileTap: { scale: 0.97 }, whileHover: { y: -1 },
            "aria-label": `Add ${inc} ounces`
          }, `+${inc}`)
        ),
        React.createElement(motion.button, {
          type: "button", className: `${btnBase} text-xs`,
          onClick: () => onChange(0),
          whileTap: { scale: 0.97 },
          "aria-label": "Reset water to 0 ounces"
        }, "Reset")
      ),
      React.createElement("div", { className: "mt-1 text-xs text-slate-400" }, `Goal: ${goal} oz (${pct}%)`)
    )
  );
}

/** Day card */
function DayCard({ day, dateObj, onUpdate, onBulk, isToday }) {
  const perfectBefore = useRef(isPerfectDay(day));
  const weekDayHelp = workoutHelp(dateObj);
  const thurs = isThursday(dateObj);
  const dayLabel = fmtShort(dateObj);
  const allComplete = isPerfectDay(day);

  useEffect(() => {
    const nowPerfect = isPerfectDay(day);
    if (!perfectBefore.current && nowPerfect) {
      confetti({ particleCount: 80, spread: 70, origin: { y: 0.2 } });
    }
    perfectBefore.current = nowPerfect;
  }, [day]);

  return (
    React.createElement(motion.div, {
      layout: true,
      className: `${cardBase} ${allComplete ? "border-teal-500/60 bg-teal-900/15" : ""} p-4 relative outline-none`,
      initial: { opacity: 0, y: 8 },
      animate: { opacity: 1, y: 0 },
      transition: { type: "spring", stiffness: 200, damping: 24 },
      tabIndex: -1,
      "aria-label": `${dayLabel} – daily tasks`
    },
      isToday && React.createElement("span", { className: "absolute -inset-1 rounded-2xl ring-2 ring-teal-400/60 pointer-events-none", "aria-hidden": true }),
      React.createElement("div", { className: "flex items-baseline justify-between gap-3" },
        React.createElement("div", null,
          React.createElement("div", { className: "text-sm text-slate-400" }, dateObj.toLocaleDateString(undefined, { weekday: "long" })),
          React.createElement("div", { className: "text-lg font-semibold text-slate-100" }, dayLabel)
        ),
        allComplete && React.createElement(motion.div, {
          initial: { scale: 0, rotate: -15, opacity: 0 },
          animate: { scale: 1, rotate: 0, opacity: 1 },
          transition: { type: "spring", stiffness: 400, damping: 15 },
          "aria-label": "Day complete", className: "text-2xl"
        }, "✨")
      ),

      React.createElement("div", { className: "mt-4 grid grid-cols-1 gap-2" },
        React.createElement(Toggle, { id: `ex-${day.date}`, label: "Exercise 45 min", help: weekDayHelp, pressed: day.exercise, onToggle: (v) => onUpdate({ ...day, exercise: v }) }),
        React.createElement(Toggle, {
          id: `gl-${day.date}`,
          label: `Gluten rule met${thurs ? " (bagel allowed)" : ""}`,
          help: thurs ? "Thursday exception: one bagel permitted while remaining compliant. Toggle if you followed the rule." : "Toggle if you were gluten-free today.",
          pressed: day.glutenFree, onToggle: (v) => onUpdate({ ...day, glutenFree: v })
        }),
        React.createElement(Toggle, { id: `al-${day.date}`, label: "No alcohol", pressed: day.noAlcohol, onToggle: (v) => onUpdate({ ...day, noAlcohol: v }) }),
        React.createElement(WaterControl, { value: day.waterOz, onChange: (v) => onUpdate({ ...day, waterOz: v }), dayId: day.date }),
        React.createElement(Toggle, { id: `rd-${day.date}`, label: "Read 10 pages", pressed: day.reading, onToggle: (v) => onUpdate({ ...day, reading: v }) })
      ),

      React.createElement("div", { className: "mt-4 flex flex-wrap gap-2" },
        React.createElement(motion.button, { type: "button", className: `${btnBase} text-xs`, onClick: () => onBulk(true), whileTap: { scale: 0.97 }, "aria-label": "Mark all tasks complete" }, "Mark all ✓"),
        React.createElement(motion.button, { type: "button", className: `${btnBase} text-xs`, onClick: () => onBulk(false), whileTap: { scale: 0.97 }, "aria-label": "Mark all tasks incomplete" }, "Clear all")
      )
    )
  );
}

/** Progress summary + legend */
function ProgressSummary({ days }) {
  const totalTasks = days.length * 5;
  const doneTasks = days.reduce((acc, d) => acc + completedTaskCount(d), 0);
  const pct = totalTasks ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const perfectDays = days.filter(isPerfectDay).length;
  const { current, longest } = computeStreaks(days);

  return (
    React.createElement("div", { className: `${cardBase} p-4`, "aria-label": "Progress summary" },
      React.createElement("div", { className: "flex flex-wrap items-end justify-between gap-4" },
        React.createElement("div", null,
          React.createElement("div", { className: "text-sm text-slate-400" }, "Overall completion"),
          React.createElement("div", { className: "text-2xl font-bold" }, `${pct}%`)
        ),
        React.createElement("div", { className: "flex items-center gap-4" },
          React.createElement("div", { className: "text-sm" },
            React.createElement("span", { className: "text-slate-400" }, "Perfect days:"), " ",
            React.createElement("span", { className: "font-semibold" }, perfectDays)
          ),
          React.createElement("div", { className: "text-sm" },
            React.createElement("span", { className: "text-slate-400" }, "Current streak:"), " ",
            React.createElement("span", { className: "font-semibold" }, current)
          ),
          React.createElement("div", { className: "text-sm" },
            React.createElement("span", { className: "text-slate-400" }, "Longest streak:"), " ",
            React.createElement("span", { className: "font-semibold" }, longest)
          )
        )
      ),
      React.createElement("div", {
        className: "mt-3 h-3 w-full rounded-full bg-slate-800 border border-slate-700 overflow-hidden",
        role: "progressbar", "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": pct, "aria-label": "Overall completion percent"
      },
        React.createElement(motion.div, {
          className: "h-full bg-teal-500",
          initial: { width: 0 },
          animate: { width: `${pct}%` },
          transition: { type: "spring", stiffness: 200, damping: 24 }
        })
      )
    )
  );
}

function LegendChips() {
  return React.createElement("div", { className: "flex flex-wrap gap-2", "aria-label": "Legend" },
    React.createElement("span", { className: chipBase }, "Mon/Wed/Fri: Strength"),
    React.createElement("span", { className: chipBase }, "Tue/Thu: Cardio/Recovery"),
    React.createElement("span", { className: chipBase }, "Thursday: Bagel allowed")
  );
}

/** Header */
function Header({ start, end, onOpenSettings }) {
  return React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" },
    React.createElement("div", null,
      React.createElement("h1", { className: "text-xl md:text-2xl font-semibold" }, "75 Soft Challenge"),
      React.createElement("p", { className: "text-sm text-slate-300" }, `${fmtLong(start)} → ${fmtLong(end)}`)
    ),
    React.createElement("div", { className: "flex items-center gap-2" },
      React.createElement(motion.button, { type: "button", className: btnBase, onClick: onOpenSettings, whileTap: { scale: 0.97 }, "aria-label": "Open plan settings" }, "Plan Settings")
    )
  );
}

/** Settings modal */
function PlanSettings({ isOpen, onClose, config, onSave, onReset, soundEnabled, setSoundEnabled, onExport, onImport }) {
  const [startStr, setStartStr] = useState(config.startISO);
  const [len, setLen] = useState(config.lengthDays);
  const fileInputRef = useRef(null);

  useEffect(() => { if (isOpen) { setStartStr(config.startISO); setLen(config.lengthDays); } }, [isOpen, config.startISO, config.lengthDays]);

  function handleSave() {
    const d = new Date(startStr);
    if (isNaN(d)) return alert("Please enter a valid start date.");
    onSave({ startISO: iso(d), lengthDays: Math.max(1, Number(len) || 75) });
  }

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { const data = JSON.parse(String(reader.result)); onImport(data); } catch { alert("Invalid JSON file."); }
    };
    reader.readAsText(file);
  }

  return React.createElement(AnimatePresence, null,
    isOpen && React.createElement(motion.div, { className: "fixed inset-0 z-50 flex items-center justify-center p-4", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
      React.createElement("div", { className: "absolute inset-0 bg-black/60", onClick: onClose, "aria-hidden": true }),
      React.createElement(motion.div, {
        role: "dialog", "aria-modal": "true", "aria-label": "Plan settings",
        className: `${cardBase} w-full max-w-xl p-5 relative`,
        initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 }
      },
        React.createElement("h2", { className: "text-lg font-semibold" }, "Plan Settings"),
        React.createElement("div", { className: "mt-4 grid grid-cols-1 md:grid-cols-2 gap-4" },
          React.createElement("label", { className: "flex flex-col gap-2 text-sm" },
            React.createElement("span", null, "Start date"),
            React.createElement("input", { type: "date", className: "rounded-xl bg-slate-900 border border-slate-700 px-3 py-2", value: startStr, onChange: (e) => setStartStr(e.target.value) })
          ),
          React.createElement("label", { className: "flex flex-col gap-2 text-sm" },
            React.createElement("span", null, "Length (days)"),
            React.createElement("input", { type: "number", min: 1, className: "rounded-xl bg-slate-900 border border-slate-700 px-3 py-2", value: len, onChange: (e) => setLen(e.target.value) })
          )
        ),

        React.createElement("div", { className: "mt-4 flex flex-wrap items-center gap-3 text-sm" },
          React.createElement("button", { type: "button", className: `${toggleBase} ${soundEnabled ? "bg-teal-700/30 border-teal-500 text-teal-100" : ""}`, "aria-pressed": soundEnabled, onClick: () => setSoundEnabled(!soundEnabled) }, `Sound: ${soundEnabled ? "On" : "Muted"} (shortcut: S)`),
          React.createElement("button", { type: "button", className: `${btnBase}`, onClick: handleSave }, "Save"),
          React.createElement("button", { type: "button", className: `${btnBase}`, onClick: onClose }, "Close"),
          React.createElement("button", { type: "button", className: `${btnBase}`, onClick: onReset }, "Reset progress")
        ),

        React.createElement("div", { className: "mt-6 border-t border-slate-800 pt-4" },
          React.createElement("h3", { className: "text-sm font-semibold mb-2" }, "Backup"),
          React.createElement("div", { className: "flex flex-wrap items-center gap-3" },
            React.createElement("button", { type: "button", className: btnBase, onClick: onExport }, "Export JSON"),
            React.createElement("button", { type: "button", className: btnBase, onClick: () => fileInputRef.current?.click() }, "Import JSON"),
            React.createElement("input", { ref: fileInputRef, type: "file", accept: "application/json", className: "hidden", onChange: handleFileSelect })
          )
        ),

        React.createElement("div", { className: "mt-6 border-t border-slate-800 pt-4 text-sm text-slate-300" },
          React.createElement("p", null, React.createElement("strong", null, "Shortcuts:"), " T – focus today, C – quick-complete today, S – toggle sound")
        ),

        React.createElement("button", { type: "button", className: "absolute top-2 right-2 p-2 rounded-lg hover:bg-slate-800", onClick: onClose, "aria-label": "Close settings" }, "✕")
      )
    )
  );
}

/** Help modal (small) */
function HelpModal({ isOpen, onClose }) {
  return React.createElement(AnimatePresence, null,
    isOpen && React.createElement(motion.div, { className: "fixed inset-0 z-50 flex items-center justify-center p-4", initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } },
      React.createElement("div", { className: "absolute inset-0 bg-black/60", onClick: onClose, "aria-hidden": true }),
      React.createElement(motion.div, {
        role: "dialog", "aria-modal": "true", "aria-label": "Help",
        className: `${cardBase} w-full max-w-lg p-5 relative`,
        initial: { scale: 0.96, opacity: 0 }, animate: { scale: 1, opacity: 1 }, exit: { scale: 0.96, opacity: 0 }
      },
        React.createElement("h2", { className: "text-lg font-semibold" }, "Help & Shortcuts"),
        React.createElement("div", { className: "mt-3 text-sm text-slate-300 space-y-2" },
          React.createElement("p", null, React.createElement("strong", null, "Goals:"), " Exercise 45 min, Gluten rule (Thu bagel allowed), No alcohol, 100 oz water, Read 10 pages."),
          React.createElement("ul", { className: "list-disc pl-5 space-y-1" },
            React.createElement("li", null, React.createElement("strong", null, "T"), " → Scroll/focus to today"),
            React.createElement("li", null, React.createElement("strong", null, "C"), " → Quick-complete today (confirm)"),
            React.createElement("li", null, React.createElement("strong", null, "S"), " → Toggle celebration sound on/off")
          ),
          React.createElement("p", null, "Use bulk buttons on each card to mark all tasks complete/clear.")
        ),
        React.createElement("button", { type: "button", className: "absolute top-2 right-2 p-2 rounded-lg hover:bg-slate-800", onClick: onClose, "aria-label": "Close help" }, "✕")
      )
    )
  );
}

/** Filters (desktop/tablet) */
function Filters({ filter, setFilter }) {
  const filters = [
    { key: "all", label: "All" },
    { key: "incomplete", label: "Incomplete" },
    { key: "complete", label: "Complete" },
    { key: "week", label: "This Week" },
  ];
  return React.createElement("div", { className: "flex flex-wrap items-center gap-2" },
    filters.map((f) =>
      React.createElement("button", {
        key: f.key,
        className: `${toggleBase} ${filter === f.key ? "bg-teal-700/30 border-teal-500 text-teal-100" : ""}`,
        "aria-pressed": filter === f.key,
        onClick: () => setFilter(f.key)
      }, f.label)
    )
  );
}

/** Main App */
function App() {
  // Config
  const defaultStart = useMemo(() => getNextMonday(), []);
  const [config, setConfig] = useState(() => ({ startISO: iso(defaultStart), lengthDays: 75 }));

  // Sound pref (muted by default)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const s = localStorage.getItem("seventyfive-soft-sound");
    return s ? s === "on" : false;
  });
  useEffect(() => {
    localStorage.setItem("seventyfive-soft-sound", soundEnabled ? "on" : "off");
  }, [soundEnabled]);

  // Dates
  const startDate = useMemo(() => new Date(config.startISO), [config.startISO]);
  const endDate = useMemo(() => addDays(startDate, config.lengthDays - 1), [startDate, config.lengthDays]);

  // Storage key
  const lsKey = useMemo(() => storageKey(config.startISO, config.lengthDays), [config.startISO, config.lengthDays]);

  // Days state
  const [days, setDays] = useState(() => {
    const cached = localStorage.getItem(lsKey);
    if (cached) { try { return JSON.parse(cached); } catch {} }
    return Array.from({ length: config.lengthDays }, (_, i) => makeDayEntry(addDays(startDate, i)));
  });

  useEffect(() => {
    const cached = localStorage.getItem(lsKey);
    if (cached) { try { setDays(JSON.parse(cached)); return; } catch {} }
    setDays(Array.from({ length: config.lengthDays }, (_, i) => makeDayEntry(addDays(startDate, i))));
  }, [lsKey, config.lengthDays, startDate]);

  useEffect(() => { localStorage.setItem(lsKey, JSON.stringify(days)); }, [lsKey, days]);

  // Modals
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Refs & today
  const todayRef = useRef(null);
  const mobileViewerRef = useRef(null);
  const todayISO = iso(new Date());

  // Mobile single-card viewer selection
  const [mobileDateISO, setMobileDateISO] = useState(() => todayISO);
  useEffect(() => {
    const inPlan = days.some((d) => d.date === todayISO);
    if (inPlan) setMobileDateISO((prev) => prev || todayISO);
    else if (days[0]) setMobileDateISO(days[0].date);
  }, [days, todayISO]);

  function focusToday() {
    setMobileDateISO(todayISO);
    mobileViewerRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    todayRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    const el = todayRef.current?.querySelector('[tabindex="-1"]');
    el?.focus({ preventScroll: true });
  }

  function quickCompleteToday() {
    const idx = days.findIndex((d) => d.date === todayISO);
    if (idx === -1) return alert("Today is outside the current plan window.");
    if (!confirm("Quick-complete all tasks today?")) return;
    setDays((prev) => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], exercise: true, glutenFree: true, noAlcohol: true, reading: true, waterOz: 100 };
      return copy;
    });
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target.isContentEditable) return;
      if (e.key.toLowerCase() === "t") { e.preventDefault(); focusToday(); }
      else if (e.key.toLowerCase() === "c") { e.preventDefault(); quickCompleteToday(); }
      else if (e.key.toLowerCase() === "s") { e.preventDefault(); setSoundEnabled((v) => !v); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [days, soundEnabled]);

  // Filters (desktop/tablet)
  const [filter, setFilter] = useState("all");
  const filteredDays = useMemo(() => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7)); // week starts Monday
    const endOfWeek = addDays(startOfWeek, 6);

    return days.filter((d) => {
      if (filter === "all") return true;
      const perfect = isPerfectDay(d);
      if (filter === "complete") return perfect;
      if (filter === "incomplete") return !perfect;
      if (filter === "week") {
        const dd = new Date(d.date);
        return dd >= startOfWeek && dd <= endOfWeek;
      }
      return true;
    });
  }, [days, filter]);

  // Update helpers
  function updateDay(dateISO, updater) { setDays((prev) => prev.map((d) => (d.date === dateISO ? updater(d) : d))); }
  function bulkDay(dateISO, complete) {
    updateDay(dateISO, (d) => ({ ...d, exercise: complete, glutenFree: complete, noAlcohol: complete, reading: complete, waterOz: complete ? 100 : 0 }));
  }

  // Chime on newly perfect (omitted here to avoid WebAudio CSP issues)
  const lastPerfectSetRef = useRef(new Set([]));
  useEffect(() => {
    const nowPerfect = new Set(days.filter(isPerfectDay).map((d) => d.date));
    lastPerfectSetRef.current = nowPerfect;
  }, [days]);

  // Export / Import / Reset
  function handleExport() {
    const data = { version: 1, config, days };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `75-soft-${config.startISO}-${config.lengthDays}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
  function handleImport(obj) {
    if (!obj || typeof obj !== "object") return alert("Invalid JSON");
    if (!obj.config || !Array.isArray(obj.days)) return alert("Invalid JSON structure");
    try { setConfig(obj.config); setDays(obj.days); alert("Progress imported!"); } catch { alert("Failed to import JSON"); }
  }
  function handleReset() {
    if (!confirm("Reset all progress for this plan?")) return;
    setDays(Array.from({ length: config.lengthDays }, (_, i) => makeDayEntry(addDays(startDate, i))));
  }
  function handleSaveSettings(next) { setConfig(next); setShowSettings(false); }

  // Mobile nav helpers
  const mobileIndex = days.findIndex((d) => d.date === mobileDateISO);
  const atStart = mobileIndex <= 0;
  const atEnd = mobileIndex === days.length - 1 || mobileIndex === -1;
  const mobileDay = days[mobileIndex] || days[0];
  function goPrev() { if (mobileIndex > 0) setMobileDateISO(days[mobileIndex - 1].date); }
  function goNext() { if (mobileIndex < days.length - 1) setMobileDateISO(days[mobileIndex + 1].date); }

  // Render
  return (
    React.createElement("div", { className: "min-h-dvh bg-slate-950 text-slate-100" },
      React.createElement("div", { className: "mx-auto max-w-7xl px-4 py-6 space-y-6" },

        React.createElement(Header, { start: startDate, end: endDate, onOpenSettings: () => setShowSettings(true) }),

        React.createElement("div", { className: "flex flex-wrap items-center justify-between gap-3" },
          React.createElement(ProgressSummary, { days }),
          React.createElement("div", { className: "hidden sm:flex flex-col gap-3" },
            React.createElement(LegendChips, null),
            React.createElement("div", { className: "flex items-center gap-2" },
              React.createElement(Filters, { filter, setFilter }),
              React.createElement("button", { type: "button", className: btnBase, onClick: () => setShowHelp(true), "aria-label": "Open help modal" }, "Help"),
              React.createElement("button", { type: "button", className: btnBase, onClick: focusToday, "aria-label": "Scroll to today" }, "Today")
            )
          )
        ),

        /* Mobile single-card viewer */
        React.createElement("div", { className: "sm:hidden space-y-3", ref: mobileViewerRef },
          React.createElement("div", { className: `${cardBase} p-3 flex items-center justify-between gap-3` },
            React.createElement("label", { className: "text-sm flex items-center gap-2" },
              React.createElement("span", { className: "text-slate-300" }, "Day"),
              React.createElement("select", {
                className: "rounded-lg bg-slate-900 border border-slate-700 px-2 py-1 text-sm",
                "aria-label": "Select day", value: mobileDateISO, onChange: (e) => setMobileDateISO(e.target.value)
              },
                days.map((d) => React.createElement("option", { key: d.date, value: d.date }, fmtShort(new Date(d.date))))
              )
            ),
            React.createElement("div", { className: "flex items-center gap-2" },
              React.createElement("button", { type: "button", className: `${btnBase} text-xs`, onClick: goPrev, disabled: atStart, "aria-label": "Previous day" }, "◀"),
              React.createElement("button", { type: "button", className: `${btnBase} text-xs`, onClick: focusToday, "aria-label": "Go to today" }, "Today"),
              React.createElement("button", { type: "button", className: `${btnBase} text-xs`, onClick: goNext, disabled: atEnd, "aria-label": "Next day" }, "▶")
            )
          ),
          mobileDay && React.createElement(DayCard, {
            day: mobileDay, dateObj: new Date(mobileDay.date),
            isToday: mobileDay.date === todayISO,
            onUpdate: (next) => updateDay(mobileDay.date, () => next),
            onBulk: (complete) => bulkDay(mobileDay.date, complete)
          }),
          React.createElement("div", { className: "flex items-center justify-between gap-2" },
            React.createElement("button", { type: "button", className: btnBase, onClick: () => setShowHelp(true), "aria-label": "Open help modal" }, "Help"),
            React.createElement("button", { type: "button", className: btnBase, onClick: focusToday, "aria-label": "Scroll to today" }, "Today")
          )
        ),

        /* Desktop / tablet grid */
        React.createElement("div", { className: "hidden sm:grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4" },
          filteredDays.map((d) => {
            const dateObj = new Date(d.date);
            const isTodayCard = d.date === todayISO;
            return React.createElement("div", { key: d.date, ref: isTodayCard ? todayRef : null },
              React.createElement(DayCard, {
                day: d, dateObj, isToday: isTodayCard,
                onUpdate: (next) => updateDay(d.date, () => next),
                onBulk: (complete) => bulkDay(d.date, complete)
              })
            );
          })
        ),

        React.createElement(PlanSettings, {
          isOpen: showSettings, onClose: () => setShowSettings(false),
          config, onSave: handleSaveSettings, onReset: handleReset,
          soundEnabled, setSoundEnabled,
          onExport: handleExport, onImport: handleImport
        }),

        React.createElement(HelpModal, { isOpen: showHelp, onClose: () => setShowHelp(false) }),

        React.createElement("footer", { className: "pt-8 text-center text-xs text-slate-500" },
          "Built with React, Tailwind, Framer Motion & canvas-confetti. Local-only; data saved in your browser."
        )
      )
    )
  );
}

// Mount
const root = createRoot(document.getElementById('root'));
root.render(React.createElement(App));
