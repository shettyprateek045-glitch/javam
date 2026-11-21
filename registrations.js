/* ExamOptima – Student Exam Registration.
 * Registers students for an examination by USN. Every USN must exist in
 * Student Management, and a student can be registered only once per exam.
 */
(function () {
  "use strict";

  var selected = "";
  var query = "";

  function $(id) { return document.getElementById(id); }
  function examById(id) { return EO.exams().filter(function (e) { return e.id === id; })[0]; }

  function studentMap() {
    var m = {};
    EO.students().forEach(function (s) { m[String(s.usn).toUpperCase()] = s; });
    return m;
  }

  // ---------- Exam picker ----------
  function renderPicker() {
    var exams = EO.exams().slice().sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
    var sel = $("regExam");
    if (!exams.length) {
      sel.innerHTML = '<option value="">No examinations available</option>';
      sel.disabled = true; selected = "";
    } else {
      sel.disabled = false;
      if (!examById(selected)) selected = "";
      sel.innerHTML = '<option value="">Select an examination…</option>' + exams.map(function (e) {
        return '<option value="' + EO.esc(e.id) + '">' + EO.esc(EO.examLabel(e)) + "</option>";
      }).join("");
      sel.value = selected;
    }
    render();
  }

  // ---------- Registered table ----------
  function registered() {
    return EO.regs().filter(function (r) { return r.examId === selected; })
      .sort(function (a, b) { return a.usn.localeCompare(b.usn); });
  }
  function render() {
    var exam = examById(selected);
    var hasExams = EO.exams().length > 0;
    $("regPanel").hidden = !exam;
    $("regListWrap").hidden = !exam;
    $("regNotice").hidden = true;

    if (!hasExams) {
      $("regInfo").textContent = "No examinations exist yet. Add an examination first, then come back to register students.";
      return;
    }
    if (!exam) { $("regInfo").textContent = "Select an examination to view or register students."; return; }

    $("regInfo").textContent = exam.subjectName + " (" + exam.subjectCode + ") · " + EO.fmtDate(exam.date) +
      " · " + EO.fmtTime(exam.start) + " – " + EO.fmtTime(exam.end);

    var map = studentMap();
    var all = registered();
    var q = query.trim().toLowerCase();
    var rows = all.filter(function (r) {
      if (!q) return true;
      var s = map[r.usn];
      return [r.usn, s ? s.name : "", s ? s.department : ""].join(" ").toLowerCase().indexOf(q) !== -1;
    });

    $("regBody").innerHTML = rows.map(function (r, i) {
      var s = map[r.usn];
      return "<tr><td>" + (i + 1) + '</td><td class="mono">' + EO.esc(r.usn) + "</td>" +
        (s ? "<td>" + EO.esc(s.name) + "</td><td>" + EO.esc(s.department) + "</td><td>" + EO.esc(s.semester) +
             "</td><td>" + EO.esc(s.email) + "</td>"
           : '<td colspan="4"><span class="badge full">Student no longer exists in Student Management</span></td>') +
        '<td class="col-actions"><button class="btn btn-danger btn-sm" data-raction="remove" data-usn="' +
        EO.esc(r.usn) + '">Remove</button></td></tr>';
    }).join("");

    var empty = $("regEmpty");
    if (!all.length) { empty.hidden = false; empty.textContent = "No students are registered for this examination yet."; }
    else if (!rows.length) { empty.hidden = false; empty.textContent = "No registered students match your search."; }
    else empty.hidden = true;

    $("regSummary").textContent = all.length === 0 ? "" :
      (rows.length === all.length ? all.length : rows.length + " of " + all.length) + " registered student" + (all.length === 1 ? "" : "s");
  }

  // ---------- Notices ----------
  function notice(kind, html) {
    var n = $("regNotice");
    n.className = "notice " + kind;
    n.innerHTML = html;
    n.hidden = false;
  }
  function list(arr) { return "<strong>" + arr.map(EO.esc).join(", ") + "</strong>"; }

  // ---------- Register ----------
  function register() {
    var exam = examById(selected);
    if (!exam) { notice("error", "Select an examination first."); return; }

    var tokens = $("regUsns").value.split(/[\s,;]+/).map(function (t) { return t.trim().toUpperCase(); })
      .filter(Boolean);
    if (!tokens.length) { notice("error", "Enter at least one USN."); return; }

    // unique USNs from the input; remember repeats
    var seen = {}, unique = [], repeated = [];
    tokens.forEach(function (t) {
      if (seen[t]) { if (repeated.indexOf(t) === -1) repeated.push(t); return; }
      seen[t] = true; unique.push(t);
    });

    // 1) every USN must exist in Student Management
    var map = studentMap();
    var missing = unique.filter(function (u) { return !map[u]; });
    if (missing.length) {
      notice("error", "These USNs do not exist in Student Management: " + list(missing) +
        ". No students were registered. Correct them and try again.");
      return;
    }

    // 2) no duplicate registrations for this examination
    var regs = EO.regs();
    var already = {};
    regs.forEach(function (r) { if (r.examId === exam.id) already[r.usn] = true; });
    var skipped = unique.filter(function (u) { return already[u]; });
    var toAdd = unique.filter(function (u) { return !already[u]; });

    if (!toAdd.length) {
      notice("warn", "Nothing to register: " + list(skipped) + (skipped.length === 1 ? " is" : " are") +
        " already registered for this examination.");
      return;
    }
    toAdd.forEach(function (u) { regs.push({ examId: exam.id, usn: u }); });
    if (!EO.write(EO.KEYS.regs, regs)) return;

    var msg = "Registered " + toAdd.length + " student" + (toAdd.length === 1 ? "" : "s") + ": " + list(toAdd) + ".";
    if (skipped.length) msg += " Skipped (already registered): " + list(skipped) + ".";
    if (repeated.length) msg += " Entered more than once and counted once: " + list(repeated) + ".";
    // warn (do not block) if a student is already registered for another exam at an overlapping time
    var clashes = [];
    EO.exams().forEach(function (o) {
      if (o.id === exam.id || !EO.overlaps(o, exam)) return;
      var theirs = {};
      regs.forEach(function (r) { if (r.examId === o.id) theirs[r.usn] = true; });
      var hit = toAdd.filter(function (u) { return theirs[u]; });
      if (hit.length) clashes.push(list(hit) + " also registered for " + EO.esc(o.name + " (" + o.subjectCode + ")") + " at an overlapping time");
    });
    if (clashes.length) msg += " Timetable clash: " + clashes.join("; ") + ".";
    $("regUsns").value = "";
    render();                       // re-render clears the notice, so show it after
    notice(skipped.length || repeated.length || clashes.length ? "warn" : "ok", msg);
    document.dispatchEvent(new CustomEvent("eo:data", { detail: "regs" }));
  }

  function remove(usn) {
    if (!window.confirm("Remove " + usn + " from this examination?")) return;
    EO.write(EO.KEYS.regs, EO.regs().filter(function (r) { return !(r.examId === selected && r.usn === usn); }));
    render();
    EO.toast("Registration removed.");
    document.dispatchEvent(new CustomEvent("eo:data", { detail: "regs" }));
  }

  // ---------- Events ----------
  $("regExam").addEventListener("change", function (e) { selected = e.target.value; query = ""; $("regSearch").value = ""; render(); });
  $("regBtn").addEventListener("click", register);
  $("regSearch").addEventListener("input", function (e) { query = e.target.value; render(); });
  $("regBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-raction]");
    if (b) remove(b.dataset.usn);
  });
  document.addEventListener("eo:view", function (e) { if (e.detail === "registrations") renderPicker(); });
  document.addEventListener("eo:data", function (e) { if (e.detail === "exams") renderPicker(); });

  renderPicker();
})();
