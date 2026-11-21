/* ExamOptima – Dashboard extras, Seating Layout, Conflict Detection and Reports.
 * Reads the same stored data as the other modules; it never changes students,
 * classrooms, examinations, registrations or seating plans.
 */
(function () {
  "use strict";
  var E = EO, AK = "examoptima.activity.v1";
  function $(id) { return document.getElementById(id); }

  // ---------- Recent activities (logged whenever module data is saved) ----------
  var LABEL = {
    "examoptima.students.v1": "Student records updated",
    "examoptima.classrooms.v1": "Classroom records updated",
    "examoptima.exams.v1": "Examination records updated",
    "examoptima.registrations.v1": "Exam registrations updated",
    "examoptima.seating.v1": "Seating arrangements changed"
  };
  var rawSet = Storage.prototype.setItem;
  function logAct(m) {
    try {
      var a = E.read(AK); a = Array.isArray(a) ? a : [];
      if (a[0] && a[0].m === m && Date.now() - a[0].t < 2000) return;
      a.unshift({ m: m, t: Date.now() });
      rawSet.call(localStorage, AK, JSON.stringify(a.slice(0, 12)));
    } catch (e) { /* activity log is optional */ }
  }
  Storage.prototype.setItem = function (k, v) {
    rawSet.call(this, k, v);
    if (this === localStorage && LABEL[k]) logAct(LABEL[k]);
  };

  function dash() {
    var ids = {}; E.exams().forEach(function (e) { ids[e.id] = 1; });
    var n = Object.keys(E.seating()).filter(function (k) { return ids[k]; }).length;
    $("st_seated").textContent = n;
    $("st_seated_sub").textContent = "of " + E.exams().length + " examinations";
    var a = E.read(AK); a = Array.isArray(a) ? a : [];
    $("recentAct").innerHTML = a.length ? a.map(function (x) {
      return "<li><span>" + E.esc(x.m) + "</span><time>" + E.esc(new Date(x.t).toLocaleString()) + "</time></li>";
    }).join("") : "<li><span>No activity recorded yet.</span></li>";
  }

  // ---------- shared lookups ----------
  function studentMap() {
    var m = {}; E.students().forEach(function (s) { m[String(s.usn).toUpperCase()] = s; }); return m;
  }
  function sortedExams() {
    return E.exams().slice().sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
  }
  function fillExamSelect(sel, allLabel) {
    var cur = sel.value, ex = sortedExams();
    sel.innerHTML = (allLabel ? '<option value="">' + allLabel + "</option>" : "") + ex.map(function (e) {
      return '<option value="' + E.esc(e.id) + '">' + E.esc(E.examLabel(e)) + "</option>";
    }).join("");
    if (!ex.length && !allLabel) sel.innerHTML = '<option value="">No examinations available</option>';
    if (cur && ex.some(function (e) { return e.id === cur; })) sel.value = cur;
  }

  // ---------- Conflict detection ----------
  function detect() {
    var out = [], exams = E.exams(), regs = E.regs(), plans = E.seating(), studs = studentMap(), rooms = {}, ex = {}, regSet = {}, seenReg = {};
    E.classrooms().forEach(function (c) { rooms[c.id] = c; });
    exams.forEach(function (e) { ex[e.id] = e; });
    function add(sev, e, title, detail, fix) {
      out.push({ sev: sev, eid: e ? e.id : "", exam: e ? e.name + " (" + e.subjectCode + ")" : "—", title: title, detail: detail, fix: fix });
    }
    regs.forEach(function (r) {
      var e = ex[r.examId], key = r.examId + "|" + r.usn;
      if (!e) { add("Error", null, "Registration for a missing examination", r.usn + " is registered for " + r.examId + ", which no longer exists.", "Re-create the examination or reset this browser's ExamOptima data."); return; }
      if (seenReg[key]) add("Error", e, "Duplicate registration", r.usn + " is registered more than once for this examination.", "Remove the extra registration in Registrations.");
      seenReg[key] = 1;
      (regSet[r.examId] = regSet[r.examId] || {})[r.usn] = 1;
      if (!studs[r.usn]) add("Error", e, "Registered student missing in Student Management", r.usn + " is registered but no longer exists in Students.", "Re-add the student in Students, or remove the registration.");
    });
    Object.keys(plans).forEach(function (id) {
      var p = plans[id], e = ex[id], used = {};
      if (!e) { add("Error", null, "Seating plan for a deleted examination", "A saved seating plan exists for " + id + ".", "Re-create the examination and clear its seating, or reset this browser's ExamOptima data."); return; }
      (p.halls || []).forEach(function (h) {
        var c = rooms[h.classroomId], cap = c ? Math.min(c.available, c.capacity) : 0, seatNo = {};
        if (!c) add("Error", e, "Hall no longer exists", h.name + " was deleted from Classroom Management after seating.", "Regenerate the seating.");
        else if (h.seats.length > cap) add("Error", e, "Classroom capacity violation", h.name + " holds " + h.seats.length + " students but only " + cap + " seats are available now.", "Restore the classroom's available seats or regenerate the seating.");
        h.seats.forEach(function (s) {
          if (seatNo[s.seat]) add("Error", e, "Duplicate seat assignment", h.name + " seat " + s.seat + " is given to both " + seatNo[s.seat] + " and " + s.usn + ".", "Regenerate the seating.");
          seatNo[s.seat] = s.usn;
          if (c && c.blocked && c.blocked.indexOf(s.seat) !== -1) add("Error", e, "Blocked seat allocated", s.usn + " is on blocked seat " + s.seat + " of " + h.name + ".", "Regenerate the seating.");
          else if (c && s.seat > (c.rows && c.columns ? c.capacity : cap)) add("Error", e, "Seat in unavailable area", s.usn + " sits on seat " + s.seat + " of " + h.name + " but only seats 1–" + cap + " are available.", "Regenerate the seating.");
          if (used[s.usn]) add("Error", e, "Student assigned multiple seats", s.usn + " has more than one seat in this examination.", "Regenerate the seating.");
          used[s.usn] = 1;
          if (!(regSet[id] && regSet[id][s.usn])) add("Error", e, "Student without registration", s.usn + " has a seat but is not registered for this examination.", "Register the student, or regenerate the seating.");
          if (!studs[s.usn]) add("Error", e, "Missing student record", s.usn + " has a seat but is not in Student Management.", "Re-add the student, or regenerate the seating.");
        });
      });
      var listed = {}, missing;
      (p.unallocated || []).forEach(function (u) { listed[u.usn] = 1; });
      missing = Object.keys(regSet[id] || {}).filter(function (u) { return !used[u] && !listed[u]; });
      if (missing.length) add("Warning", e, "Seating out of date", missing.length + " registered student(s) have no seat and no unallocated reason: " + missing.slice(0, 8).join(", ") + (missing.length > 8 ? "…" : "") + ".", "Open Seating and click Regenerate seating.");
      if ((p.unallocated || []).length) add("Warning", e, "Unallocated students", p.unallocated.length + " student(s) could not be seated.", "Add classrooms or seats, then regenerate the seating.");
    });
    exams.forEach(function (a, i) {
      exams.slice(i + 1).forEach(function (b) {
        if (!E.overlaps(a, b)) return;
        var shared = Object.keys(regSet[a.id] || {}).filter(function (u) { return regSet[b.id] && regSet[b.id][u]; });
        if (shared.length) add("Warning", a, "Student timetable clash", shared.slice(0, 8).join(", ") + (shared.length > 8 ? "…" : "") + " also registered for " + b.name + " (" + b.subjectCode + ") at an overlapping time.", "Reschedule one examination or remove the registration.");
        var pa = plans[a.id], pb = plans[b.id];
        if (pa && pb) {
          var ha = {}; pa.halls.forEach(function (h) { ha[h.classroomId] = h.name; });
          pb.halls.forEach(function (h) {
            if (ha[h.classroomId]) add("Error", a, "Classroom double-booked", h.name + " is used by " + a.name + " and " + b.name + " at an overlapping time.", "Regenerate the later examination's seating.");
          });
        }
      });
    });
    return out;
  }

  function renderConflicts() {
    var list = detect(), errs = list.filter(function (c) { return c.sev === "Error"; }).length;
    $("conSummary").innerHTML = list.length
      ? '<div class="notice ' + (errs ? "error" : "warn") + '">' + errs + " error(s), " + (list.length - errs) + " warning(s) found.</div>"
      : '<div class="notice ok">No conflicts found. Checked: duplicate seats, multiple seats per student, unregistered or missing students, classroom capacity and unavailable seats, classroom double-booking, timetable clashes and out-of-date seating.</div>';
    $("conBody").innerHTML = list.map(function (c) {
      return '<tr><td><span class="badge ' + (c.sev === "Error" ? "full" : "warn") + '">' + c.sev + "</span></td><td>" + E.esc(c.exam) +
        "</td><td><strong>" + E.esc(c.title) + "</strong><br>" + E.esc(c.detail) + "</td><td>" + E.esc(c.fix) + "</td></tr>";
    }).join("");
    $("conTable").hidden = !list.length;
  }

  // ---------- Seating layout (grid) ----------
  var layHalls = [];
  function renderLayout() {
    fillExamSelect($("layExam"));
    var id = $("layExam").value, plan = E.seating()[id], host = $("layHalls"), hs = $("layHall");
    $("layDetail").hidden = true;
    if (!plan) {
      hs.innerHTML = '<option value="">All halls</option>';
      host.innerHTML = ""; layHalls = [];
      $("layInfo").textContent = E.exams().length ? "No seating arrangement has been generated for this examination. Generate it in Seating." : "No examinations exist yet.";
      return;
    }
    var keep = hs.value;
    hs.innerHTML = '<option value="">All halls</option>' + plan.halls.map(function (h, i) {
      return '<option value="' + i + '">' + E.esc(h.name) + " – Room " + E.esc(h.room) + "</option>";
    }).join("");
    if (keep !== "" && plan.halls[+keep]) hs.value = keep;
    layHalls = plan.halls;
    var rooms = {}; E.classrooms().forEach(function (c) { rooms[c.id] = c; });
    var allocated = 0; plan.halls.forEach(function (h) { allocated += h.seats.length; });
    $("layInfo").textContent = allocated + " allocated seat(s) in " + plan.halls.length + " hall(s)." + (plan.sameDeptPairs === undefined ? "" : " Same-department neighbours: " + plan.sameDeptPairs + (plan.optimal ? " (optimal: 0 is the lower bound)." : " (valid allocation, not proven optimal)."));
    host.innerHTML = plan.halls.map(function (h, i) {
      if (hs.value !== "" && +hs.value !== i) return "";
      var c = rooms[h.classroomId], total = Math.max(c ? c.capacity : 0, h.capacity), cols = c && c.columns ? c.columns : Math.ceil(Math.sqrt(total)), by = {}, cells = "";
      h.seats.forEach(function (s) { by[s.seat] = s; });
      for (var n = 1; n <= total; n++) {
        var blk = c && c.blocked ? c.blocked.indexOf(n) !== -1 : n > h.capacity, cls = by[n] ? "seat alloc" : blk ? "seat blocked" : "seat";
        cells += '<button type="button" class="' + cls + '" data-h="' + i + '" data-n="' + n + '" title="Seat ' + n + '">' + n + "</button>";
      }
      return '<section class="hall"><header class="hall-head"><div><h3>' + E.esc(h.name) + "</h3><p>Room " + E.esc(h.room) + " · " + E.esc(h.building) +
        '</p></div><span class="badge ok">' + h.seats.length + " / " + h.capacity + ' seats filled</span></header><div class="seat-grid" style="grid-template-columns:repeat(' + cols + ',42px)">' + cells + "</div></section>";
    }).join("");
  }

  // ---------- Reports ----------
  var report = null;
  function reportData(type, examId) {
    var exams = sortedExams().filter(function (e) { return !examId || e.id === examId; }), plans = E.seating(), studs = studentMap(), regs = E.regs(), head, rows = [], title;
    if (type === "hall") {
      title = "Hall-wise seating report"; head = ["Exam", "Subject code", "Date", "Hall", "Room", "Building", "Seat", "USN", "Name", "Department"];
      exams.forEach(function (e) { var p = plans[e.id]; if (p) p.halls.forEach(function (h) { h.seats.forEach(function (s) { rows.push([e.name, e.subjectCode, E.fmtDate(e.date), h.name, h.room, h.building, s.seat, s.usn, s.name, s.department]); }); }); });
    } else if (type === "student") {
      title = "Student-wise seating report"; head = ["USN", "Name", "Department", "Exam", "Subject code", "Date", "Start", "Hall", "Room", "Seat"];
      exams.forEach(function (e) {
        var seat = {}, p = plans[e.id];
        if (p) p.halls.forEach(function (h) { h.seats.forEach(function (s) { seat[s.usn] = [h.name, h.room, s.seat]; }); });
        regs.filter(function (r) { return r.examId === e.id; }).forEach(function (r) {
          var s = studs[r.usn], k = seat[r.usn] || ["Not allocated", "", ""];
          rows.push([r.usn, s ? s.name : "(missing)", s ? s.department : "", e.name, e.subjectCode, E.fmtDate(e.date), E.fmtTime(e.start), k[0], k[1], k[2]]);
        });
      });
      rows.sort(function (a, b) { return String(a[0]).localeCompare(String(b[0]), undefined, { numeric: true }); });
    } else if (type === "exam") {
      title = "Examination-wise report"; head = ["Exam", "Subject", "Subject code", "Date", "Start", "End", "Duration (min)", "Registered", "Allocated", "Unallocated", "Halls used"];
      exams.forEach(function (e) {
        var p = plans[e.id], n = regs.filter(function (r) { return r.examId === e.id; }).length, a = 0;
        if (p) p.halls.forEach(function (h) { a += h.seats.length; });
        rows.push([e.name, e.subjectName, e.subjectCode, E.fmtDate(e.date), E.fmtTime(e.start), E.fmtTime(e.end), E.duration(e.start, e.end), n, p ? a : "No seating", p ? p.unallocated.length : "", p ? p.halls.length : ""]);
      });
    } else if (type === "occupancy") {
      title = "Classroom occupancy report"; head = ["Exam", "Hall", "Room", "Building", "Seats offered", "Seats filled", "Empty", "Occupancy %"];
      exams.forEach(function (e) { var p = plans[e.id]; if (p) p.halls.forEach(function (h) { rows.push([e.name, h.name, h.room, h.building, h.capacity, h.seats.length, h.capacity - h.seats.length, h.capacity ? Math.round(h.seats.length * 100 / h.capacity) : 0]); }); });
    } else if (type === "unalloc") {
      title = "Unallocated student report"; head = ["Exam", "USN", "Name", "Department", "Reason"];
      exams.forEach(function (e) { var p = plans[e.id]; if (p) p.unallocated.forEach(function (u) { rows.push([e.name, u.usn, u.name, u.department, u.reason]); }); });
    } else {
      title = "Conflict report"; head = ["Severity", "Exam", "Issue", "Details", "How to resolve"];
      detect().filter(function (c) { return !examId || c.eid === examId; }).forEach(function (c) { rows.push([c.sev, c.exam, c.title, c.detail, c.fix]); });
    }
    return { title: title, head: head, rows: rows };
  }
  function renderReport() {
    fillExamSelect($("repExam"), "All examinations");
    report = reportData($("repType").value, $("repExam").value);
    var has = report.rows.length > 0;
    ["repCsv", "repXls", "repPdf"].forEach(function (b) { $(b).disabled = !has; });
    $("repTitle").textContent = report.title;
    $("repHead").innerHTML = "<tr>" + report.head.map(function (h) { return "<th>" + E.esc(h) + "</th>"; }).join("") + "</tr>";
    $("repBody").innerHTML = report.rows.map(function (r) { return "<tr>" + r.map(function (v) { return "<td>" + E.esc(v) + "</td>"; }).join("") + "</tr>"; }).join("");
    $("repEmpty").hidden = has;
    $("repEmpty").textContent = "No data for this report yet. " + (E.exams().length ? "Register students and generate seating first." : "Add an examination first.");
  }
  function csvCell(v) {
    v = String(v == null ? "" : v);
    if (/^[=+\-@]/.test(v)) v = "'" + v;
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function download(name, mime, text) {
    var a = document.createElement("a"), url = URL.createObjectURL(new Blob([text], { type: mime }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function fileBase() { return "examoptima-" + $("repType").value + "-report"; }
  function csv() {
    var lines = [report.head].concat(report.rows).map(function (r) { return r.map(csvCell).join(","); });
    download(fileBase() + ".csv", "text/csv;charset=utf-8", "\ufeff" + lines.join("\r\n"));
  }
  function xls() {
    var rows = [report.head].concat(report.rows).map(function (r) {
      return "<Row>" + r.map(function (v) { return '<Cell><Data ss:Type="String">' + E.esc(v) + "</Data></Cell>"; }).join("") + "</Row>";
    }).join("");
    download(fileBase() + ".xls", "application/vnd.ms-excel",
      '<?xml version="1.0"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Report"><Table>' + rows + "</Table></Worksheet></Workbook>");
  }
  function pdf() {
    document.body.classList.add("printing-report");
    window.print();
    document.body.classList.remove("printing-report");
  }

  // ---------- Events ----------
  $("layExam").addEventListener("change", function () { $("layHall").value = ""; renderLayout(); });
  $("layHall").addEventListener("change", renderLayout);
  $("layHalls").addEventListener("click", function (e) {
    var b = e.target.closest("button.seat"); if (!b) return;
    var h = layHalls[+b.dataset.h], n = +b.dataset.n, s = h.seats.filter(function (x) { return x.seat === n; })[0], d = $("layDetail");
    d.hidden = false;
    d.className = "notice " + (s ? "ok" : "warn");
    d.innerHTML = s ? E.esc(h.name) + " · Seat " + n + ": <strong>" + E.esc(s.name) + "</strong> (" + E.esc(s.usn) + "), " + E.esc(s.department)
      : E.esc(h.name) + " · Seat " + n + (n <= h.capacity ? " is empty." : " is unavailable (not offered for examinations).");
  });
  $("conScan").addEventListener("click", function () { renderConflicts(); E.toast("Scan complete."); });
  $("repType").addEventListener("change", renderReport);
  $("repExam").addEventListener("change", renderReport);
  $("repCsv").addEventListener("click", csv);
  $("repXls").addEventListener("click", xls);
  $("repPdf").addEventListener("click", pdf);
  function show(name) {
    if (name === "dashboard") dash();
    else if (name === "layout") renderLayout();
    else if (name === "conflicts") renderConflicts();
    else if (name === "reports") renderReport();
  }
  document.addEventListener("eo:view", function (e) { show(e.detail); });
  dash();
  show((location.hash || "").replace("#", ""));   // the first view event fired before this file loaded
})();
