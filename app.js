/* ExamOptima – Student Management
 * Original data lives in data.js (ORIGINAL_STUDENTS) and is never modified.
 * Add / Edit / Delete changes are saved in the browser (localStorage).
 * "Reset data" restores the original CSV data.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "examoptima.students.v1";

  // ---------- State ----------
  var students = load();
  var state = { query: "", dept: "ALL", pageSize: "all", page: 1 };
  var editingId = null;   // null => adding
  var deletingId = null;

  // ---------- Helpers ----------
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function $(id) { return document.getElementById(id); }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { /* fall through to original data */ }
    return clone(ORIGINAL_STUDENTS);
  }

  function save() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(students)); }
    catch (e) { toast("Changes could not be saved in this browser."); }
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function departments() {
    var seen = {};
    students.forEach(function (s) { seen[s.department] = true; });
    return Object.keys(seen).sort();
  }

  function nextId() {
    var max = 0;
    students.forEach(function (s) {
      var m = /^STU(\d+)$/i.exec(s.id);
      if (m) max = Math.max(max, parseInt(m[1], 10));
    });
    return "STU" + String(max + 1).padStart(3, "0");
  }

  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2400);
  }

  // ---------- Filtering ----------
  function filtered() {
    var q = state.query.trim().toLowerCase();
    return students.filter(function (s) {
      if (state.dept !== "ALL" && s.department !== state.dept) return false;
      if (!q) return true;
      return [s.id, s.usn, s.name, s.department, s.semester, s.email, s.subject]
        .join(" ").toLowerCase().indexOf(q) !== -1;
    });
  }

  // ---------- Rendering ----------
  function renderDeptFilter() {
    var sel = $("deptFilter");
    var current = state.dept;
    var depts = departments();
    if (current !== "ALL" && depts.indexOf(current) === -1) current = state.dept = "ALL";
    var html = '<option value="ALL">All departments</option>';
    depts.forEach(function (d) {
      var count = students.filter(function (s) { return s.department === d; }).length;
      html += '<option value="' + esc(d) + '">' + esc(d) + " (" + count + ")</option>";
    });
    sel.innerHTML = html;
    sel.value = current;

    $("deptList").innerHTML = depts.map(function (d) {
      return '<option value="' + esc(d) + '"></option>';
    }).join("");
  }

  function render() {
    var list = filtered();
    var total = list.length;
    var size = state.pageSize === "all" ? total || 1 : parseInt(state.pageSize, 10);
    var pages = Math.max(1, Math.ceil(total / size));
    if (state.page > pages) state.page = pages;
    if (state.page < 1) state.page = 1;
    var start = (state.page - 1) * size;
    var slice = state.pageSize === "all" ? list : list.slice(start, start + size);

    $("tbody").innerHTML = slice.map(function (s) {
      return "<tr>" +
        '<td class="mono">' + esc(s.id) + "</td>" +
        '<td class="mono">' + esc(s.usn) + "</td>" +
        "<td>" + esc(s.name) + "</td>" +
        "<td>" + esc(s.department) + "</td>" +
        "<td>" + esc(s.semester) + "</td>" +
        "<td>" + esc(s.email) + "</td>" +
        '<td><span class="badge">' + esc(s.subject) + "</span></td>" +
        '<td class="col-actions">' +
          '<button class="btn btn-ghost btn-sm" data-action="edit" data-id="' + esc(s.id) + '">Edit</button>' +
          '<button class="btn btn-danger btn-sm" data-action="delete" data-id="' + esc(s.id) + '">Delete</button>' +
        "</td></tr>";
    }).join("");

    $("emptyState").hidden = total !== 0;

    var shown = slice.length;
    $("summary").textContent = total === students.length
      ? "Showing " + shown + " of " + students.length + " students"
      : "Showing " + shown + " of " + total + " matching students (" + students.length + " total)";

    var showPager = state.pageSize !== "all" && pages > 1;
    $("pager").hidden = !showPager;
    $("pageInfo").textContent = "Page " + state.page + " of " + pages;
    $("prevBtn").disabled = state.page <= 1;
    $("nextBtn").disabled = state.page >= pages;
  }

  // ---------- Form (Add / Edit) ----------
  var FIELDS = ["id", "usn", "name", "department", "semester", "email", "subject"];

  function field(name) { return $("f_" + name); }

  function clearErrors() {
    FIELDS.forEach(function (f) { field(f).classList.remove("invalid"); });
    Array.prototype.forEach.call(document.querySelectorAll(".error"), function (e) { e.textContent = ""; });
  }

  function showError(name, msg) {
    field(name).classList.add("invalid");
    document.querySelector('.error[data-for="' + name + '"]').textContent = msg;
  }

  function openForm(id) {
    editingId = id || null;
    clearErrors();
    var s = id ? students.filter(function (x) { return x.id === id; })[0] : null;
    $("formTitle").textContent = s ? "Edit Student" : "Add Student";
    FIELDS.forEach(function (f) {
      field(f).value = s ? s[f] : "";
    });
    if (!s) {
      field("id").value = nextId();
      field("semester").value = 3;
      field("subject").value = "25BCSIC302";
    }
    field("id").readOnly = !!s;   // ID is the record key; not editable
    $("formModal").hidden = false;
    field(s ? "name" : "usn").focus();
  }

  function closeForm() { $("formModal").hidden = true; editingId = null; }

  function readForm() {
    var v = {};
    FIELDS.forEach(function (f) { v[f] = field(f).value.trim(); });
    return v;
  }

  function validate(v) {
    clearErrors();
    var ok = true;
    function bad(f, m) { showError(f, m); ok = false; }

    FIELDS.forEach(function (f) { if (!v[f]) bad(f, "This field is required."); });

    if (v.id && students.some(function (s) { return s.id.toLowerCase() === v.id.toLowerCase() && s.id !== editingId; }))
      bad("id", "This Student ID already exists.");
    if (v.usn && students.some(function (s) { return s.usn.toLowerCase() === v.usn.toLowerCase() && s.id !== editingId; }))
      bad("usn", "This USN already exists.");
    if (v.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email))
      bad("email", "Enter a valid email address.");
    if (v.email && students.some(function (s) { return s.email.toLowerCase() === v.email.toLowerCase() && s.id !== editingId; }))
      bad("email", "This email already exists.");
    if (v.semester) {
      var n = Number(v.semester);
      if (!/^\d+$/.test(v.semester) || n < 1 || n > 8) bad("semester", "Semester must be a whole number from 1 to 8.");
    }
    return ok;
  }

  function onSubmit(e) {
    e.preventDefault();
    var v = readForm();
    if (!validate(v)) return;
    v.semester = parseInt(v.semester, 10);

    if (editingId) {
      var idx = students.findIndex(function (s) { return s.id === editingId; });
      if (idx === -1) { closeForm(); return; }
      v.id = students[idx].id;
      students[idx] = v;
      toast("Student updated.");
    } else {
      students.push(v);
      toast("Student added.");
    }
    save();
    closeForm();
    renderDeptFilter();
    render();
  }

  // ---------- Delete ----------
  function openDelete(id) {
    var s = students.filter(function (x) { return x.id === id; })[0];
    if (!s) return;
    deletingId = id;
    $("delText").textContent = "This will remove " + s.name + " (" + s.usn + ") from the list.";
    $("deleteModal").hidden = false;
  }

  function closeDelete() { $("deleteModal").hidden = true; deletingId = null; }

  function confirmDelete() {
    var id = deletingId;
    students = students.filter(function (s) { return s.id !== id; });
    save();
    closeDelete();
    renderDeptFilter();
    render();
    toast("Student deleted.");
  }

  // ---------- Events ----------
  $("searchInput").addEventListener("input", function (e) { state.query = e.target.value; state.page = 1; render(); });
  $("deptFilter").addEventListener("change", function (e) { state.dept = e.target.value; state.page = 1; render(); });
  $("pageSize").addEventListener("change", function (e) { state.pageSize = e.target.value; state.page = 1; render(); });
  $("clearBtn").addEventListener("click", function () {
    state.query = ""; state.dept = "ALL"; state.page = 1;
    $("searchInput").value = ""; $("deptFilter").value = "ALL";
    render();
  });
  $("resetBtn").addEventListener("click", function () {
    if (!window.confirm("Discard all changes and restore the original " + ORIGINAL_STUDENTS.length + " students?")) return;
    students = clone(ORIGINAL_STUDENTS);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
    state.query = ""; state.dept = "ALL"; state.page = 1;
    $("searchInput").value = "";
    renderDeptFilter(); render();
    toast("Original data restored.");
  });
  $("prevBtn").addEventListener("click", function () { state.page--; render(); });
  $("nextBtn").addEventListener("click", function () { state.page++; render(); });

  $("addBtn").addEventListener("click", function () { openForm(null); });
  $("cancelBtn").addEventListener("click", closeForm);
  $("studentForm").addEventListener("submit", onSubmit);

  $("delCancel").addEventListener("click", closeDelete);
  $("delConfirm").addEventListener("click", confirmDelete);

  $("tbody").addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-action]");
    if (!btn) return;
    if (btn.dataset.action === "edit") openForm(btn.dataset.id);
    else if (btn.dataset.action === "delete") openDelete(btn.dataset.id);
  });

  // Close modals on backdrop click / Escape
  ["formModal", "deleteModal"].forEach(function (id) {
    $(id).addEventListener("mousedown", function (e) {
      if (e.target === $(id)) { id === "formModal" ? closeForm() : closeDelete(); }
    });
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeForm(); closeDelete(); }
  });

  window.ExamOptimaStudentsSet = function (list) { students = list; save(); renderDeptFilter(); render(); };

  // ---------- Init ----------
  renderDeptFilter();
  render();
})();
