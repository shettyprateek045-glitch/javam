/* ExamOptima – Examination Management.
 * No example records are created: the list starts empty and only holds
 * what the admin adds. Saved in the browser (localStorage).
 */
(function () {
  "use strict";

  var KEY = EO.KEYS.exams;
  var exams = EO.exams();
  var f = { query: "", status: "ALL", from: "", to: "" };
  var editingId = null, deletingId = null;

  function $(id) { return document.getElementById(id); }
  function save() { return EO.write(KEY, exams); }
  function nextId() {
    var max = 0;
    exams.forEach(function (e) { var m = /^EX(\d+)$/i.exec(e.id); if (m) max = Math.max(max, +m[1]); });
    return "EX" + String(max + 1).padStart(3, "0");
  }

  // ---------- Table ----------
  function sorted(list) {
    return list.slice().sort(function (a, b) {
      return (a.date + a.start).localeCompare(b.date + b.start);
    });
  }
  function filtered() {
    var q = f.query.trim().toLowerCase();
    return sorted(exams).filter(function (e) {
      if (f.status !== "ALL" && EO.status(e) !== f.status) return false;
      if (f.from && e.date < f.from) return false;
      if (f.to && e.date > f.to) return false;
      if (!q) return true;
      return [e.name, e.subjectName, e.subjectCode].join(" ").toLowerCase().indexOf(q) !== -1;
    });
  }
  function statusBadge(e) {
    var s = EO.status(e);
    var cls = s === "Upcoming" ? "ok" : s === "Ongoing" ? "warn" : "muted";
    return '<span class="badge ' + cls + '">' + s + "</span>";
  }
  function render() {
    var list = filtered();
    $("examBody").innerHTML = list.map(function (e) {
      return "<tr><td>" + EO.esc(e.name) + "</td><td>" + EO.esc(e.subjectName) + '</td><td class="mono">' +
        EO.esc(e.subjectCode) + "</td><td>" + EO.fmtDate(e.date) + "</td><td>" + EO.fmtTime(e.start) +
        "</td><td>" + EO.fmtTime(e.end) + "</td><td>" + EO.fmtDur(EO.duration(e.start, e.end)) + "</td><td>" +
        statusBadge(e) + '</td><td class="col-actions">' +
        '<button class="btn btn-ghost btn-sm" data-eaction="edit" data-id="' + EO.esc(e.id) + '">Edit</button>' +
        '<button class="btn btn-danger btn-sm" data-eaction="delete" data-id="' + EO.esc(e.id) + '">Delete</button></td></tr>';
    }).join("");

    var empty = $("examEmpty");
    if (exams.length === 0) {
      empty.hidden = false;
      empty.textContent = "No examinations have been added yet. Click “Add Examination” to create the first one.";
    } else if (list.length === 0) {
      empty.hidden = false;
      empty.textContent = "No examinations match your search or filters.";
    } else {
      empty.hidden = true;
    }
    $("examSummary").textContent = exams.length === 0 ? "" :
      "Showing " + list.length + " of " + exams.length + " examinations";
  }

  // ---------- Form ----------
  var F = ["e_name", "e_subject", "e_code", "e_date", "e_start", "e_end"];
  function clearErrors() {
    F.forEach(function (id) { $(id).classList.remove("invalid"); });
    Array.prototype.forEach.call($("examForm").querySelectorAll(".error"), function (e) { e.textContent = ""; });
  }
  function err(id, m) {
    $(id).classList.add("invalid");
    $("examForm").querySelector('.error[data-for="' + id + '"]').textContent = m;
  }
  function updateDuration() {
    var d = EO.duration($("e_start").value, $("e_end").value);
    $("e_duration").value = d > 0 ? EO.fmtDur(d) : "";
  }
  function openForm(id) {
    editingId = id || null; clearErrors();
    var e = id ? exams.filter(function (x) { return x.id === id; })[0] : null;
    $("examFormTitle").textContent = e ? "Edit Examination" : "Add Examination";
    $("e_name").value = e ? e.name : "";
    $("e_subject").value = e ? e.subjectName : "";
    $("e_code").value = e ? e.subjectCode : "";
    $("e_date").value = e ? e.date : "";
    $("e_start").value = e ? e.start : "";
    $("e_end").value = e ? e.end : "";
    updateDuration();
    $("examModal").hidden = false;
    $("e_name").focus();
  }
  function closeForm() { $("examModal").hidden = true; editingId = null; }

  function validate(v) {
    clearErrors();
    var ok = true;
    function bad(id, m) { err(id, m); ok = false; }
    if (!v.name) bad("e_name", "Exam name is required.");
    if (!v.subjectName) bad("e_subject", "Subject name is required.");
    if (!v.subjectCode) bad("e_code", "Subject code is required.");
    else if (!/^[A-Za-z0-9-]{3,20}$/.test(v.subjectCode)) bad("e_code", "Use 3–20 letters, digits or hyphens (no spaces).");
    if (!v.date) bad("e_date", "Exam date is required.");
    else if (!EO.validDate(v.date)) bad("e_date", "Enter a valid date.");
    if (!v.start) bad("e_start", "Start time is required.");
    if (!v.end) bad("e_end", "End time is required.");
    if (v.start && v.end && !(EO.duration(v.start, v.end) > 0)) bad("e_end", "End time must be after the start time.");
    if (v.subjectCode && v.date && exams.some(function (e) {
      return e.id !== editingId && e.subjectCode.toLowerCase() === v.subjectCode.toLowerCase() && e.date === v.date;
    })) bad("e_code", "An examination for " + v.subjectCode + " is already scheduled on this date.");
    return ok;
  }

  $("examForm").addEventListener("submit", function (ev) {
    ev.preventDefault();
    var v = {
      name: $("e_name").value.trim(), subjectName: $("e_subject").value.trim(),
      subjectCode: $("e_code").value.trim().toUpperCase(), date: $("e_date").value,
      start: $("e_start").value, end: $("e_end").value
    };
    if (!validate(v)) return;
    v.duration = EO.duration(v.start, v.end);   // minutes
    if (editingId) {
      var i = exams.findIndex(function (e) { return e.id === editingId; });
      if (i === -1) { closeForm(); return; }
      v.id = exams[i].id; exams[i] = v;
      if (!save()) return;
      EO.toast("Examination updated.");
    } else {
      v.id = nextId(); exams.push(v);
      if (!save()) { exams.pop(); return; }
      EO.toast("Examination added.");
    }
    closeForm(); render(); renderDashboardStats();
    document.dispatchEvent(new CustomEvent("eo:data", { detail: "exams" }));
  });

  // ---------- Delete ----------
  function openDelete(id) {
    var e = exams.filter(function (x) { return x.id === id; })[0];
    if (!e) return;
    deletingId = id;
    var n = EO.regs().filter(function (r) { return r.examId === id; }).length;
    $("edelText").textContent = "This will remove " + e.name + " (" + e.subjectCode + ", " + EO.fmtDate(e.date) + ")" +
      (n ? ", its " + n + " student registration" + (n === 1 ? "" : "s") + " and any seating arrangement." : " and any seating arrangement.");
    $("examDeleteModal").hidden = false;
  }
  function closeDelete() { $("examDeleteModal").hidden = true; deletingId = null; }
  function confirmDelete() {
    var id = deletingId;
    exams = exams.filter(function (e) { return e.id !== id; });
    save();
    // remove everything that belongs to this examination
    EO.write(EO.KEYS.regs, EO.regs().filter(function (r) { return r.examId !== id; }));
    var s = EO.seating(); delete s[id]; EO.write(EO.KEYS.seating, s);
    closeDelete(); render(); renderDashboardStats();
    document.dispatchEvent(new CustomEvent("eo:data", { detail: "exams" }));
    EO.toast("Examination deleted.");
  }

  // ---------- Dashboard ----------
  function renderDashboardStats() {
    var all = EO.exams(), up = 0;
    all.forEach(function (e) { if (EO.status(e) === "Upcoming") up++; });
    $("st_exams").textContent = all.length;
    $("st_exams_sub").textContent = all.length ? up + " upcoming" : "none scheduled yet";
    $("st_regs").textContent = EO.regs().length;
  }

  // ---------- Events ----------
  $("addExamBtn").addEventListener("click", function () { openForm(null); });
  $("examCancel").addEventListener("click", closeForm);
  $("edelCancel").addEventListener("click", closeDelete);
  $("edelConfirm").addEventListener("click", confirmDelete);
  $("e_start").addEventListener("input", updateDuration);
  $("e_end").addEventListener("input", updateDuration);
  $("examBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-eaction]");
    if (!b) return;
    if (b.dataset.eaction === "edit") openForm(b.dataset.id); else openDelete(b.dataset.id);
  });
  $("examSearch").addEventListener("input", function (e) { f.query = e.target.value; render(); });
  $("examStatus").addEventListener("change", function (e) { f.status = e.target.value; render(); });
  $("examFrom").addEventListener("change", function (e) { f.from = e.target.value; render(); });
  $("examTo").addEventListener("change", function (e) { f.to = e.target.value; render(); });
  $("examClear").addEventListener("click", function () {
    f = { query: "", status: "ALL", from: "", to: "" };
    $("examSearch").value = ""; $("examStatus").value = "ALL"; $("examFrom").value = ""; $("examTo").value = "";
    render();
  });
  ["examModal", "examDeleteModal"].forEach(function (id) {
    $(id).addEventListener("mousedown", function (e) {
      if (e.target === $(id)) { id === "examModal" ? closeForm() : closeDelete(); }
    });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeForm(); closeDelete(); } });

  document.addEventListener("eo:view", function (e) {
    exams = EO.exams();            // always show what is stored
    if (e.detail === "exams") render();
    if (e.detail === "dashboard") renderDashboardStats();
  });
  document.addEventListener("eo:data", function (e) {
    if (e.detail === "regs") renderDashboardStats();
  });

  render();
  renderDashboardStats();
})();
