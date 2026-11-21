/* Shared helpers for the Examination, Registration and Seating modules. */
window.EO = (function () {
  "use strict";
  var KEYS = {
    students: "examoptima.students.v1",
    exams: "examoptima.exams.v1",
    regs: "examoptima.registrations.v1",
    seating: "examoptima.seating.v1"
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function read(key) {
    try { var r = localStorage.getItem(key); return r ? JSON.parse(r) : null; } catch (e) { return null; }
  }
  function write(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); return true; }
    catch (e) { toast("Changes could not be saved in this browser."); return false; }
  }

  // Student Management data: saved list if present, otherwise the original CSV data.
  function students() {
    var s = read(KEYS.students);
    if (Array.isArray(s)) return s;
    return typeof ORIGINAL_STUDENTS !== "undefined" ? clone(ORIGINAL_STUDENTS) : [];
  }
  function classrooms() {
    return typeof window.ExamOptimaClassrooms === "function" ? window.ExamOptimaClassrooms() : [];
  }
  function exams() { var e = read(KEYS.exams); return Array.isArray(e) ? e : []; }
  function regs() { var r = read(KEYS.regs); return Array.isArray(r) ? r : []; }
  function seating() {
    var s = read(KEYS.seating);
    return s && typeof s === "object" && !Array.isArray(s) ? s : {};
  }

  var tt;
  function toast(m) {
    var t = document.getElementById("toast"); if (!t) return;
    t.textContent = m; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  // ---- dates & times ("YYYY-MM-DD", "HH:MM") ----
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function validDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
    if (!m) return false;
    var dt = new Date(+m[1], +m[2] - 1, +m[3]);
    return dt.getFullYear() === +m[1] && dt.getMonth() === +m[2] - 1 && dt.getDate() === +m[3];
  }
  function fmtDate(d) {
    var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || "");
    return m ? (+m[3]) + " " + MONTHS[+m[2] - 1] + " " + m[1] : d;
  }
  function toMin(t) {
    var m = /^(\d{2}):(\d{2})$/.exec(t || "");
    return m ? +m[1] * 60 + +m[2] : NaN;
  }
  function fmtTime(t) {
    var m = toMin(t); if (isNaN(m)) return t;
    var h = Math.floor(m / 60), mi = m % 60, ap = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return h + ":" + String(mi).padStart(2, "0") + " " + ap;
  }
  function duration(start, end) { return toMin(end) - toMin(start); }
  function fmtDur(min) {
    if (isNaN(min) || min <= 0) return "";
    var h = Math.floor(min / 60), m = min % 60;
    return (h ? h + " h" : "") + (h && m ? " " : "") + (m ? m + " min" : "");
  }
  function status(e, now) {
    now = now || new Date();
    var d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(e.date);
    var s = toMin(e.start), en = toMin(e.end);
    var start = new Date(+d[1], +d[2] - 1, +d[3], Math.floor(s / 60), s % 60);
    var end = new Date(+d[1], +d[2] - 1, +d[3], Math.floor(en / 60), en % 60);
    return now < start ? "Upcoming" : now <= end ? "Ongoing" : "Completed";
  }
  function overlaps(a, b) {
    return a.date === b.date && toMin(a.start) < toMin(b.end) && toMin(b.start) < toMin(a.end);
  }
  function examLabel(e) { return e.name + " – " + e.subjectCode + " (" + fmtDate(e.date) + ")"; }

  return {
    KEYS: KEYS, clone: clone, esc: esc, read: read, write: write, toast: toast,
    students: students, classrooms: classrooms, exams: exams, regs: regs, seating: seating,
    validDate: validDate, fmtDate: fmtDate, fmtTime: fmtTime, toMin: toMin, duration: duration,
    fmtDur: fmtDur, status: status, overlaps: overlaps, examLabel: examLabel
  };
})();
