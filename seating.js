/* ExamOptima – Examination Seating Arrangement.
 *
 * Rules
 *  - Only students registered for the selected examination are seated.
 *  - A hall offers its "Available Seats" (never more than its seating capacity).
 *  - Each student gets exactly one seat per examination; no hall is over-filled.
 *  - Students are interleaved by department so neighbours are from different departments.
 *  - A classroom already used by another examination at an overlapping time is skipped.
 *  - Students who cannot be seated are listed as unallocated, with the reason.
 */
(function () {
  "use strict";

  var selected = "";

  function $(id) { return document.getElementById(id); }
  function examById(id) { return EO.exams().filter(function (e) { return e.id === id; })[0]; }
  function regsFor(id) {
    return EO.regs().filter(function (r) { return r.examId === id; }).map(function (r) { return r.usn; });
  }
  function signature(usns) { return usns.slice().sort().join("|"); }
  function hallSig() {
    return EO.classrooms().filter(function (c) { return c.available > 0; }).map(function (c) {
      return c.id + ":" + Math.min(c.available, c.capacity) + ":" + c.room + ":" + c.building + ":" + (c.rows || 0) + "x" + (c.columns || 0) + ":" + (c.blocked || []).join(".");
    }).sort().join("|");
  }
  function examSig(e) { return e.date + " " + e.start + "-" + e.end; }
  function natural(a, b) { return String(a).localeCompare(String(b), undefined, { numeric: true }); }

  // Usable seat numbers of a hall: blocked seats are left out; layout halls number seats row by row.
  function seatNumbers(h) {
    var nums = [], total = h.rows && h.columns ? h.rows * h.columns : Math.min(h.available, h.capacity), n;
    for (n = 1; n <= total; n++) if (!h.blocked || h.blocked.indexOf(n) === -1) nums.push(n);
    return nums.slice(0, Math.max(0, Math.min(h.available, nums.length)));
  }
  // Same-department neighbour pairs (left/right, and front/back when columns are known).
  function pairCost(seats, cols) {
    var dept = {}, c = 0;
    seats.forEach(function (s) { dept[s.seat] = s.department; });
    seats.forEach(function (s) {
      var nb = cols ? [s.seat + 1, s.seat + cols] : [s.seat + 1];
      if (cols && s.seat % cols === 0) nb.shift();
      nb.forEach(function (m) { if (dept[m] !== undefined && dept[m] === s.department) c++; });
    });
    return c;
  }
  // Local search: swap students inside a hall while the pair count does not get worse. 0 pairs is proven optimal.
  function optimize(seats, cols) {
    var best = pairCost(seats, cols), seed = 7, n = seats.length;
    function rnd(m) { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed % m; }
    function swap(a, b) {
      ["usn", "name", "department"].forEach(function (k) { var t = seats[a][k]; seats[a][k] = seats[b][k]; seats[b][k] = t; });
    }
    for (var it = 0; it < 4000 && best > 0 && n > 1; it++) {
      var a = rnd(n), b = rnd(n);
      if (a === b) continue;
      swap(a, b);
      var c = pairCost(seats, cols);
      if (c <= best) best = c; else swap(a, b);
    }
  }

  // ---------- Allocation ----------
  function allocate(exam) {
    var map = {};
    EO.students().forEach(function (s) { map[String(s.usn).toUpperCase()] = s; });

    var seenUsn = {}, seatable = [], unallocated = [];
    regsFor(exam.id).forEach(function (usn) {
      if (seenUsn[usn]) return;                       // never seat the same student twice
      seenUsn[usn] = true;
      var s = map[usn];
      if (!s) unallocated.push({ usn: usn, name: "—", department: "—", reason: "USN no longer exists in Student Management" });
      else seatable.push(s);
    });

    // order: by USN, then interleave departments round-robin
    seatable.sort(function (a, b) { return natural(a.usn, b.usn); });
    var groups = {};
    seatable.forEach(function (s) { (groups[s.department] = groups[s.department] || []).push(s); });
    var depts = Object.keys(groups).sort(), order = [], more = true;
    while (more) {
      more = false;
      depts.forEach(function (d) { if (groups[d].length) { order.push(groups[d].shift()); more = true; } });
    }

    // classrooms used by other examinations at an overlapping time
    var bookedBy = {}, saved = EO.seating();
    EO.exams().forEach(function (o) {
      if (o.id === exam.id || !saved[o.id] || !EO.overlaps(o, exam)) return;
      saved[o.id].halls.forEach(function (h) { bookedBy[h.classroomId] = o.name + " (" + o.subjectCode + ")"; });
    });

    var skippedHalls = [];
    var halls = EO.classrooms().filter(function (c) {
      if (!(c.available > 0)) return false;
      if (bookedBy[c.id]) { skippedHalls.push(c.name + " – Room " + c.room + ": in use by " + bookedBy[c.id]); return false; }
      return true;
    }).sort(function (a, b) { return natural(a.building, b.building) || natural(a.room, b.room); });

    var out = [], idx = 0;
    halls.forEach(function (h) {
      if (idx >= order.length) return;
      var nums = seatNumbers(h), seats = [];
      for (var k = 0; k < nums.length && idx < order.length; k++, idx++) {
        seats.push({ seat: nums[k], usn: order[idx].usn, name: order[idx].name, department: order[idx].department });
      }
      optimize(seats, h.columns || 0);
      out.push({ classroomId: h.id, name: h.name, room: h.room, building: h.building, capacity: nums.length, columns: h.columns || 0, seats: seats });
    });
    for (; idx < order.length; idx++) {
      unallocated.push({ usn: order[idx].usn, name: order[idx].name, department: order[idx].department,
        reason: "No seats left in the available classrooms" });
    }

    // safety net: verify the rules before anything is saved
    var used = {};
    out.forEach(function (h) {
      if (h.seats.length > h.capacity) throw new Error("Hall capacity exceeded: " + h.name);
      h.seats.forEach(function (s) {
        if (used[s.usn]) throw new Error("Student seated twice: " + s.usn);
        used[s.usn] = true;
      });
    });

    var pairs = 0;
    out.forEach(function (h) { pairs += pairCost(h.seats, h.columns); });
    return {
      sameDeptPairs: pairs, optimal: pairs === 0,
      generatedAt: new Date().toISOString(),
      signature: signature(regsFor(exam.id)),
      hallSig: hallSig(), examSig: examSig(exam),
      halls: out, unallocated: unallocated, skippedHalls: skippedHalls
    };
  }

  // ---------- Rendering ----------
  function renderPicker() {
    var exams = EO.exams().slice().sort(function (a, b) { return (a.date + a.start).localeCompare(b.date + b.start); });
    var sel = $("seatExam");
    if (!exams.length) {
      sel.innerHTML = '<option value="">No examinations available</option>'; sel.disabled = true; selected = "";
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

  function stat(label, value, sub) {
    return '<div class="stat"><span class="stat-label">' + label + '</span><span class="stat-value">' + value +
      "</span>" + (sub ? '<span class="stat-sub">' + sub + "</span>" : "") + "</div>";
  }
  function notice(kind, html) {
    var n = $("seatNotice"); n.className = "notice " + kind; n.innerHTML = html; n.hidden = false;
  }

  function render() {
    var exam = examById(selected);
    var plan = exam ? EO.seating()[exam.id] : null;
    $("seatNotice").hidden = true;
    $("seatGenerate").disabled = !exam;
    $("seatClear").disabled = !plan;
    $("seatGenerate").textContent = plan ? "Regenerate seating" : "Generate seating";

    if (!EO.exams().length) {
      $("seatInfo").textContent = "No examinations exist yet. Add an examination and register students first.";
    } else if (!exam) {
      $("seatInfo").textContent = "Select an examination to generate or view its seating arrangement.";
    } else {
      var n = regsFor(exam.id).length;
      $("seatInfo").textContent = exam.subjectName + " (" + exam.subjectCode + ") · " + EO.fmtDate(exam.date) + " · " +
        EO.fmtTime(exam.start) + " – " + EO.fmtTime(exam.end) + " · " + n + " registered student" + (n === 1 ? "" : "s");
    }

    if (!plan) {
      $("seatStats").hidden = true; $("seatHalls").innerHTML = ""; $("seatUnalloc").innerHTML = "";
      return;
    }

    var allocated = 0, seats = 0;
    plan.halls.forEach(function (h) { allocated += h.seats.length; seats += h.capacity; });
    var statsEl = $("seatStats");
    statsEl.hidden = false;
    statsEl.innerHTML = stat("Allocated students", allocated) +
      stat("Unallocated students", plan.unallocated.length, plan.unallocated.length ? "need more seats" : "everyone has a seat") +
      stat("Halls used", plan.halls.length) +
      stat("Seats in halls used", seats, (seats - allocated) + " empty") +
      (plan.sameDeptPairs === undefined ? "" : stat("Same-department neighbours", plan.sameDeptPairs,
        plan.optimal ? "optimal (0 is the lower bound)" : "valid, not proven optimal"));

    // warnings about the saved plan
    var warns = [];
    if (plan.signature !== signature(regsFor(exam.id))) {
      warns.push("The registrations for this examination have changed since this seating was generated. Click “Regenerate seating” to update it.");
    }
    if (plan.hallSig !== hallSig() || plan.examSig !== examSig(exam)) {
      warns.push("Classrooms or the examination schedule have changed since this seating was generated, so it may be out of date. Click “Regenerate seating” to update it.");
    }
    if (plan.skippedHalls && plan.skippedHalls.length) {
      warns.push("Classrooms skipped because another examination uses them at an overlapping time: " +
        plan.skippedHalls.map(EO.esc).join("; ") + ".");
    }
    if (plan.unallocated.length) {
      warns.push(plan.unallocated.length + " student" + (plan.unallocated.length === 1 ? " is" : "s are") +
        " unallocated. Add classrooms or increase capacity, then regenerate.");
    }
    if (warns.length) notice("warn", warns.join("<br>"));

    $("seatHalls").innerHTML = plan.halls.length ? plan.halls.map(function (h) {
      return '<section class="hall"><header class="hall-head"><div><h3>' + EO.esc(h.name) + "</h3><p>Room " +
        EO.esc(h.room) + " · " + EO.esc(h.building) + '</p></div><span class="badge ok">' + h.seats.length + " / " +
        h.capacity + ' seats filled</span></header><div class="table-wrap"><table class="seat-table"><thead><tr>' +
        "<th>Seat</th><th>USN</th><th>Name</th><th>Department</th></tr></thead><tbody>" +
        h.seats.map(function (s) {
          return '<tr><td class="mono">' + s.seat + '</td><td class="mono">' + EO.esc(s.usn) + "</td><td>" +
            EO.esc(s.name) + "</td><td>" + EO.esc(s.department) + "</td></tr>";
        }).join("") + "</tbody></table></div></section>";
    }).join("") : '<div class="empty card">No hall could be used. Check that classrooms have available seats.</div>';

    $("seatUnalloc").innerHTML = plan.unallocated.length ? '<section class="hall unalloc"><header class="hall-head"><div><h3>Unallocated students</h3>' +
      "<p>Registered but without a seat</p></div>" + '<span class="badge full">' + plan.unallocated.length + '</span></header>' +
      '<div class="table-wrap"><table class="seat-table"><thead><tr><th>USN</th><th>Name</th><th>Department</th><th>Reason</th></tr></thead><tbody>' +
      plan.unallocated.map(function (u) {
        return '<tr><td class="mono">' + EO.esc(u.usn) + "</td><td>" + EO.esc(u.name) + "</td><td>" + EO.esc(u.department) +
          "</td><td>" + EO.esc(u.reason) + "</td></tr>";
      }).join("") + "</tbody></table></div></section>" : "";
  }

  // ---------- Actions ----------
  function generate() {
    var exam = examById(selected);
    if (!exam) return;
    if (!regsFor(exam.id).length) {
      render();
      notice("error", "No students are registered for this examination. Register students first.");
      return;
    }
    var plan;
    try { plan = allocate(exam); }
    catch (e) { render(); notice("error", "Seating was not saved: " + EO.esc(e.message)); return; }
    var all = EO.seating(); all[exam.id] = plan;
    if (!EO.write(EO.KEYS.seating, all)) return;
    render();
    EO.toast(plan.unallocated.length ? "Seating generated – some students are unallocated." : "Seating generated.");
  }
  function clearPlan() {
    var exam = examById(selected);
    if (!exam || !window.confirm("Clear the seating arrangement for this examination?")) return;
    var all = EO.seating(); delete all[exam.id]; EO.write(EO.KEYS.seating, all);
    render(); EO.toast("Seating cleared.");
  }

  $("seatExam").addEventListener("change", function (e) { selected = e.target.value; render(); });
  $("seatGenerate").addEventListener("click", generate);
  $("seatClear").addEventListener("click", clearPlan);
  document.addEventListener("eo:view", function (e) { if (e.detail === "seating") renderPicker(); });
  document.addEventListener("eo:data", function (e) { if (e.detail === "exams") renderPicker(); });

  renderPicker();
})();
