/* ExamOptima – Classroom Management + Dashboard + navigation.
 * Independent of the Student Management module (app.js).
 * Classrooms are saved in the browser (localStorage).
 */
(function () {
  "use strict";

  var CLASS_KEY = "examoptima.classrooms.v1";
  var STUDENT_KEY = "examoptima.students.v1";
  var MAX_CAPACITY = 1000;

  var SAMPLE = [
    { id: "CR001", name: "Main Exam Hall",  room: "101", building: "Block A", capacity: 120, available: 120 },
    { id: "CR002", name: "Lecture Hall 1",  room: "102", building: "Block A", capacity: 80,  available: 80 },
    { id: "CR003", name: "Computer Lab 1",  room: "201", building: "Block B", capacity: 60,  available: 60 },
    { id: "CR004", name: "Seminar Room",    room: "202", building: "Block B", capacity: 40,  available: 40 },
    { id: "CR005", name: "Electronics Lab", room: "301", building: "Block C", capacity: 50,  available: 50 }
  ];

  var rooms = load();
  var cState = { query: "", building: "ALL" };
  var editingId = null, deletingId = null;

  function $(id) { return document.getElementById(id); }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function load() {
    try {
      var raw = localStorage.getItem(CLASS_KEY);
      if (raw) { var p = JSON.parse(raw); if (Array.isArray(p)) return p; }
    } catch (e) {}
    return clone(SAMPLE);
  }
  function save() {
    try { localStorage.setItem(CLASS_KEY, JSON.stringify(rooms)); }
    catch (e) { toast("Changes could not be saved in this browser."); }
  }
  var tt;
  function toast(m) {
    var t = $("toast"); t.textContent = m; t.classList.add("show");
    clearTimeout(tt); tt = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }
  function nextId() {
    var max = 0;
    rooms.forEach(function (r) { var m = /^CR(\d+)$/i.exec(r.id); if (m) max = Math.max(max, +m[1]); });
    return "CR" + String(max + 1).padStart(3, "0");
  }
  function buildings() {
    var seen = {}; rooms.forEach(function (r) { seen[r.building] = true; });
    return Object.keys(seen).sort();
  }
  function studentCount() {
    try {
      var raw = localStorage.getItem(STUDENT_KEY);
      if (raw) { var p = JSON.parse(raw); if (Array.isArray(p)) return p.length; }
    } catch (e) {}
    return typeof ORIGINAL_STUDENTS !== "undefined" ? ORIGINAL_STUDENTS.length : 0;
  }

  // ---------- Dashboard ----------
  function renderDashboard() {
    var cap = 0, avail = 0;
    rooms.forEach(function (r) { cap += r.capacity; avail += r.available; });
    $("st_capacity").textContent = cap.toLocaleString();
    $("st_available").textContent = avail.toLocaleString();
    $("st_available_sub").textContent = cap ? (cap - avail).toLocaleString() + " seats occupied" : "no classrooms yet";
    $("st_rooms").textContent = rooms.length;
    var b = buildings().length;
    $("st_buildings").textContent = "in " + b + (b === 1 ? " building" : " buildings");
    $("st_students").textContent = studentCount();
  }

  // ---------- Table ----------
  function filtered() {
    var q = cState.query.trim().toLowerCase();
    return rooms.filter(function (r) {
      if (cState.building !== "ALL" && r.building !== cState.building) return false;
      if (!q) return true;
      return [r.name, r.room, r.building].join(" ").toLowerCase().indexOf(q) !== -1;
    });
  }
  function availBadge(r) {
    var cls = r.available === 0 ? "full" : (r.available / r.capacity < 0.25 ? "warn" : "ok");
    return '<span class="badge ' + cls + '">' + r.available + "</span>";
  }
  function renderBuildingFilter() {
    var sel = $("buildingFilter"), cur = cState.building, bs = buildings();
    if (cur !== "ALL" && bs.indexOf(cur) === -1) cur = cState.building = "ALL";
    sel.innerHTML = '<option value="ALL">All buildings</option>' + bs.map(function (b) {
      return '<option value="' + esc(b) + '">' + esc(b) + "</option>";
    }).join("");
    sel.value = cur;
    $("buildingList").innerHTML = bs.map(function (b) { return '<option value="' + esc(b) + '"></option>'; }).join("");
  }
  function renderTable() {
    var list = filtered();
    $("classBody").innerHTML = list.map(function (r) {
      return "<tr><td>" + esc(r.name) + '</td><td class="mono">' + esc(r.room) + "</td><td>" + esc(r.building) +
        "</td><td>" + r.capacity + "</td><td>" + availBadge(r) + '</td><td class="col-actions">' +
        '<button class="btn btn-ghost btn-sm" data-caction="edit" data-id="' + esc(r.id) + '">Edit</button>' +
        '<button class="btn btn-danger btn-sm" data-caction="delete" data-id="' + esc(r.id) + '">Delete</button></td></tr>';
    }).join("");
    $("classEmpty").hidden = list.length !== 0;
    var cap = 0; list.forEach(function (r) { cap += r.capacity; });
    $("classSummary").textContent = "Showing " + list.length + " of " + rooms.length + " classrooms · total capacity " + cap.toLocaleString() + " seats";
  }
  function renderAll() { renderBuildingFilter(); renderTable(); renderDashboard(); }

  // ---------- Form ----------
  var F = ["c_name", "c_room", "c_building", "c_capacity", "c_available"];
  function clearErrors() {
    F.forEach(function (f) { $(f).classList.remove("invalid"); });
    Array.prototype.forEach.call($("classForm").querySelectorAll(".error"), function (e) { e.textContent = ""; });
  }
  function err(f, m) {
    $(f).classList.add("invalid");
    $("classForm").querySelector('.error[data-for="' + f + '"]').textContent = m;
  }
  function openForm(id) {
    editingId = id || null; clearErrors();
    var r = id ? rooms.filter(function (x) { return x.id === id; })[0] : null;
    $("classFormTitle").textContent = r ? "Edit Classroom" : "Add Classroom";
    $("c_name").value = r ? r.name : "";
    $("c_room").value = r ? r.room : "";
    $("c_building").value = r ? r.building : "";
    $("c_capacity").value = r ? r.capacity : "";
    $("c_available").value = r ? r.available : "";
    $("classModal").hidden = false;
    $("c_name").focus();
  }
  function closeForm() { $("classModal").hidden = true; editingId = null; }

  function validate(v) {
    clearErrors();
    var ok = true;
    function bad(f, m) { err(f, m); ok = false; }
    if (!v.name) bad("c_name", "Classroom name is required.");
    if (!v.room) bad("c_room", "Room number is required.");
    if (!v.building) bad("c_building", "Building is required.");

    var capOk = false;
    if (v.capacity === "") bad("c_capacity", "Seating capacity is required.");
    else if (!/^\d+$/.test(v.capacity)) bad("c_capacity", "Capacity must be a whole number.");
    else if (+v.capacity < 1) bad("c_capacity", "Capacity must be at least 1.");
    else if (+v.capacity > MAX_CAPACITY) bad("c_capacity", "Capacity cannot exceed " + MAX_CAPACITY + ".");
    else capOk = true;

    if (v.available === "") {
      /* blank is allowed on Add (defaults to full capacity); required on Edit */
      if (editingId) bad("c_available", "Available seats is required.");
    } else if (!/^\d+$/.test(v.available)) bad("c_available", "Available seats must be a whole number (0 or more).");
    else if (capOk && +v.available > +v.capacity) bad("c_available", "Available seats cannot exceed seating capacity (" + v.capacity + ").");

    if (v.room && v.building && rooms.some(function (r) {
      return r.id !== editingId && r.room.toLowerCase() === v.room.toLowerCase() && r.building.toLowerCase() === v.building.toLowerCase();
    })) bad("c_room", "Room " + v.room + " already exists in " + v.building + ".");
    return ok;
  }

  $("classForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var v = {
      name: $("c_name").value.trim(), room: $("c_room").value.trim(), building: $("c_building").value.trim(),
      capacity: $("c_capacity").value.trim(), available: $("c_available").value.trim()
    };
    if (!validate(v)) return;
    var rec = {
      name: v.name, room: v.room, building: v.building,
      capacity: +v.capacity, available: v.available === "" ? +v.capacity : +v.available
    };
    if (editingId) {
      var i = rooms.findIndex(function (r) { return r.id === editingId; });
      if (i === -1) { closeForm(); return; }
      rec.id = rooms[i].id;
      if (rooms[i].rows && rooms[i].capacity === rec.capacity) { rec.rows = rooms[i].rows; rec.columns = rooms[i].columns; rec.blocked = rooms[i].blocked || []; rec.available = rec.capacity - rec.blocked.length; }
      rooms[i] = rec; toast("Classroom updated.");
    } else {
      rec.id = nextId(); rooms.push(rec); toast("Classroom added.");
    }
    save(); closeForm(); renderAll();
  });

  // ---------- Delete ----------
  function openDelete(id) {
    var r = rooms.filter(function (x) { return x.id === id; })[0];
    if (!r) return;
    deletingId = id;
    $("cdelText").textContent = "This will remove " + r.name + " (Room " + r.room + ", " + r.building + ").";
    $("classDeleteModal").hidden = false;
  }
  function closeDelete() { $("classDeleteModal").hidden = true; deletingId = null; }

  // ---------- Events ----------
  $("addClassBtn").addEventListener("click", function () { openForm(null); });
  $("classCancel").addEventListener("click", closeForm);
  $("cdelCancel").addEventListener("click", closeDelete);
  $("cdelConfirm").addEventListener("click", function () {
    var id = deletingId;
    rooms = rooms.filter(function (r) { return r.id !== id; });
    save(); closeDelete(); renderAll(); toast("Classroom deleted.");
  });
  $("classBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-caction]");
    if (!b) return;
    if (b.dataset.caction === "edit") openForm(b.dataset.id); else openDelete(b.dataset.id);
  });
  $("classSearch").addEventListener("input", function (e) { cState.query = e.target.value; renderTable(); });
  $("buildingFilter").addEventListener("change", function (e) { cState.building = e.target.value; renderTable(); });
  $("classClearBtn").addEventListener("click", function () {
    cState.query = ""; cState.building = "ALL"; $("classSearch").value = ""; $("buildingFilter").value = "ALL"; renderTable();
  });
  ["classModal", "classDeleteModal"].forEach(function (id) {
    $(id).addEventListener("mousedown", function (e) {
      if (e.target === $(id)) { id === "classModal" ? closeForm() : closeDelete(); }
    });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { closeForm(); closeDelete(); } });

  // ---------- Navigation ----------
  var VIEWS = ["dashboard", "students", "classrooms", "exams", "registrations", "seating", "layout", "conflicts", "reports", "profile"];
  function route() {
    var name = (location.hash || "").replace("#", "");
    if (VIEWS.indexOf(name) === -1) name = "dashboard";
    VIEWS.forEach(function (v) { var el = $("view-" + v); if (el) el.hidden = v !== name; });
    Array.prototype.forEach.call(document.querySelectorAll("[data-nav]"), function (a) {
      a.classList.toggle("active", a.dataset.nav === name);
    });
    if (name === "dashboard") renderDashboard();
    document.dispatchEvent(new CustomEvent("eo:view", { detail: name }));
  }
  window.addEventListener("hashchange", route);

  // Read-only access for the Examination / Seating modules
  window.ExamOptimaClassrooms = function () { return clone(rooms); };

  window.ExamOptimaClassroomsSet = function (list) { rooms = list; save(); renderAll(); };

  renderAll();
  route();
})();
