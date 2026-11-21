/* ExamOptima – login and roles, profile, CSV import/export, classroom layout editor.
 * Login is enforced in the browser only (see README): it keeps casual users out
 * of the admin screens but is not server-side security.
 */
(function () {
  "use strict";
  var E = EO, UK = "examoptima.users.v1", SK = "examoptima.session";
  function $(id) { return document.getElementById(id); }
  function mk(tag, html, cls) { var e = document.createElement(tag); e.innerHTML = html; if (cls) e.className = cls; return e; }

  // ================= CSV helpers =================
  function parseCsv(t) {
    var rows = [], r = [], f = "", q = false, i, c;
    t = t.replace(/^\ufeff/, "");
    for (i = 0; i < t.length; i++) {
      c = t[i];
      if (q) { if (c === '"') { if (t[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { r.push(f); f = ""; }
      else if (c === "\n" || c === "\r") { if (c === "\r" && t[i + 1] === "\n") i++; r.push(f); f = ""; rows.push(r); r = []; }
      else f += c;
    }
    if (f !== "" || r.length) { r.push(f); rows.push(r); }
    return rows.filter(function (x) { return x.some(function (y) { return y.trim() !== ""; }); });
  }
  function cell(v) {
    v = String(v == null ? "" : v);
    if (/^[=+\-@]/.test(v)) v = "'" + v;
    return /[",\r\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  }
  function norm(h) { return String(h).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function importBtn(label, id, handler) {
    var l = mk("label", label + '<input type="file" accept=".csv,text/csv" hidden>', "btn btn-ghost"), inp = l.querySelector("input");
    l.id = id; l.style.marginLeft = "8px";
    inp.addEventListener("change", function () {
      var f = inp.files[0]; inp.value = "";
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () { try { handler(parseCsv(String(rd.result))); } catch (e) { alert("Import failed: " + e.message); } };
      rd.onerror = function () { alert("The file could not be read."); };
      rd.readAsText(f);
    });
    return l;
  }

  var COLS = { id: ["studentid", "id"], usn: ["usn"], name: ["name", "studentname"], department: ["department", "dept"], semester: ["semester", "sem"], email: ["email"], subject: ["subject", "subjectcode"] };
  function importStudents(rows) {
    if (rows.length < 2) { alert("The CSV needs a header row and at least one student."); return; }
    var h = rows[0].map(norm), ix = {}, missing = [];
    Object.keys(COLS).forEach(function (k) {
      ix[k] = h.findIndex(function (x) { return COLS[k].indexOf(x) !== -1; });
      if (ix[k] < 0) missing.push(k);
    });
    if (missing.length) { alert("Missing CSV column(s): " + missing.join(", ") + ".\nExpected: Student ID, USN, Name, Department, Semester, Email, Subject."); return; }
    var cur = E.students(), ids = {}, usns = {}, mails = {}, good = [], bad = [];
    cur.forEach(function (s) { ids[s.id.toLowerCase()] = 1; usns[s.usn.toLowerCase()] = 1; mails[s.email.toLowerCase()] = 1; });
    rows.slice(1).forEach(function (r, n) {
      var s = {}, why = [];
      Object.keys(ix).forEach(function (k) { s[k] = (r[ix[k]] || "").trim(); if (!s[k]) why.push(k + " is empty"); });
      if (!why.length) {
        if (ids[s.id.toLowerCase()]) why.push("duplicate Student ID");
        if (usns[s.usn.toLowerCase()]) why.push("duplicate USN");
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.email)) why.push("invalid email");
        else if (mails[s.email.toLowerCase()]) why.push("duplicate email");
        if (!/^\d+$/.test(s.semester) || +s.semester < 1 || +s.semester > 8) why.push("semester must be 1-8");
      }
      if (why.length) { bad.push("Row " + (n + 2) + ": " + why.join(", ")); return; }
      s.semester = +s.semester; ids[s.id.toLowerCase()] = usns[s.usn.toLowerCase()] = mails[s.email.toLowerCase()] = 1; good.push(s);
    });
    if (good.length) window.ExamOptimaStudentsSet(cur.concat(good));
    alert("Imported " + good.length + " student(s). Rejected " + bad.length + "." + (bad.length ? "\n\n" + bad.slice(0, 10).join("\n") + (bad.length > 10 ? "\n…" : "") : ""));
  }
  function exportStudents() {
    var head = ["Student ID", "USN", "Name", "Department", "Semester", "Email", "Subject"];
    var lines = [head].concat(E.students().map(function (s) { return [s.id, s.usn, s.name, s.department, s.semester, s.email, s.subject]; }))
      .map(function (r) { return r.map(cell).join(","); });
    var a = document.createElement("a"), url = URL.createObjectURL(new Blob(["\ufeff" + lines.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    a.href = url; a.download = "examoptima-students.csv"; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function importRegs(rows) {
    if (!$("regExam").value) { alert("Select an examination first, then import its USN list."); return; }
    var h = rows[0] ? rows[0].map(norm) : [], col = h.indexOf("usn"), body = col >= 0 ? rows.slice(1) : rows;
    if (col < 0) col = 0;
    var usns = body.map(function (r) { return (r[col] || "").trim(); }).filter(Boolean);
    if (!usns.length) { alert("No USNs found in the CSV (use a USN column)."); return; }
    $("regUsns").value = usns.join(" ");
    $("regBtn").click();      // reuses the same validation: unknown USNs, duplicates
  }
  $("addBtn").parentNode.insertBefore(importBtn("Import CSV", "importStu", importStudents), $("addBtn").nextSibling);
  var ex = mk("button", "Export CSV", "btn btn-ghost"); ex.id = "exportStu"; ex.style.marginLeft = "8px"; ex.addEventListener("click", exportStudents);
  $("importStu").after(ex);
  $("regBtn").parentNode.appendChild(importBtn("Import USNs from CSV", "importReg", importRegs));

  // ================= Classroom layout editor =================
  var ed = { rows: 0, cols: 0, blocked: [], id: "" };
  var box = mk("section", '<h3 style="margin:0">Classroom layout: rows, columns and blocked seats</h3><div class="toolbar slim">' +
    '<div class="field grow"><label for="edRoom">Classroom</label><select id="edRoom"></select></div>' +
    '<div class="field"><label for="edRows">Rows</label><input id="edRows" type="number" min="1" max="100"></div>' +
    '<div class="field"><label for="edCols">Columns</label><input id="edCols" type="number" min="1" max="100"></div>' +
    '<div class="field actions"><button id="edApply" class="btn btn-ghost">Apply size</button><button id="edSave" class="btn btn-primary">Save layout</button></div></div>' +
    '<div id="edInfo" class="summary"></div><div id="edGrid" class="seat-grid"></div>', "panel");
  box.id = "edBox";
  $("view-layout").insertBefore(box, $("view-layout").children[1]);
  function room() { return E.classrooms().filter(function (c) { return c.id === $("edRoom").value; })[0]; }
  function edLoad() {
    var rooms = E.classrooms(), sel = $("edRoom"), keep = sel.value;
    sel.innerHTML = rooms.map(function (c) { return '<option value="' + E.esc(c.id) + '">' + E.esc(c.name + " – Room " + c.room) + "</option>"; }).join("");
    if (keep && rooms.some(function (c) { return c.id === keep; })) sel.value = keep;
    var c = room(); if (!c) { $("edGrid").innerHTML = ""; $("edInfo").textContent = "No classrooms yet."; return; }
    ed.cols = c.columns || Math.ceil(Math.sqrt(c.capacity)); ed.rows = c.rows || Math.ceil(c.capacity / ed.cols);
    ed.blocked = (c.blocked || []).slice();
    $("edRows").value = ed.rows; $("edCols").value = ed.cols; edDraw();
  }
  function edDraw() {
    var cells = "", n, total = ed.rows * ed.cols;
    for (n = 1; n <= total; n++) cells += '<button type="button" class="seat' + (ed.blocked.indexOf(n) !== -1 ? " blocked" : "") + '" data-n="' + n + '">' + n + "</button>";
    $("edGrid").style.gridTemplateColumns = "repeat(" + ed.cols + ",42px)"; $("edGrid").innerHTML = cells;
    $("edInfo").textContent = ed.rows + " × " + ed.cols + " = " + total + " seats, " + ed.blocked.length + " blocked, " + (total - ed.blocked.length) + " usable. Click a seat to block or unblock it.";
  }
  function edSize() {
    var r = +$("edRows").value, c = +$("edCols").value;
    if (!(r >= 1 && r <= 100 && c >= 1 && c <= 100 && r % 1 === 0 && c % 1 === 0) || r * c > 1000) { alert("Rows and columns must be whole numbers from 1 to 100, with at most 1000 seats in total."); return false; }
    ed.rows = r; ed.cols = c; ed.blocked = ed.blocked.filter(function (n) { return n <= r * c; }); return true;
  }
  function edSave() {
    if (!edSize()) return;
    var total = ed.rows * ed.cols;
    if (ed.blocked.length >= total) { alert("At least one seat must stay usable."); return; }
    var list = E.classrooms().map(function (c) {
      if (c.id !== $("edRoom").value) return c;
      c.rows = ed.rows; c.columns = ed.cols; c.capacity = total; c.blocked = ed.blocked.slice().sort(function (a, b) { return a - b; }); c.available = total - c.blocked.length;
      return c;
    });
    window.ExamOptimaClassroomsSet(list); edLoad(); E.toast("Layout saved. Regenerate seating for halls that use this classroom.");
  }
  $("edRoom").addEventListener("change", edLoad);
  $("edApply").addEventListener("click", function () { if (edSize()) edDraw(); });
  $("edSave").addEventListener("click", edSave);
  $("edGrid").addEventListener("click", function (e) {
    var b = e.target.closest("button.seat"); if (!b) return;
    var n = +b.dataset.n, i = ed.blocked.indexOf(n);
    if (i === -1) ed.blocked.push(n); else ed.blocked.splice(i, 1);
    edDraw();
  });
  document.addEventListener("eo:view", function (e) { if (e.detail === "layout") edLoad(); });
  if (location.hash === "#layout") edLoad();

  // ================= Login, roles, profile =================
  var RESTRICTED = "#addBtn,#resetBtn,#importStu,#tbody .btn,#addClassBtn,#classBody .btn,#addExamBtn,#examBody .btn,#edBox,#usersAdmin";
  function users() { var u = E.read(UK); return Array.isArray(u) ? u : []; }
  function save(u) { return E.write(UK, u); }
  function me() { var n = sessionStorage.getItem(SK); return users().filter(function (u) { return u.username === n; })[0]; }
  function hash(pw, salt) {
    if (!window.crypto || !crypto.subtle) return Promise.reject(new Error("This browser cannot hash passwords (open the app over https or localhost)."));
    return crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + pw)).then(function (b) {
      return Array.prototype.map.call(new Uint8Array(b), function (x) { return x.toString(16).padStart(2, "0"); }).join("");
    });
  }
  function salt() { var a = new Uint8Array(16); crypto.getRandomValues(a); return Array.prototype.map.call(a, function (x) { return x.toString(16).padStart(2, "0"); }).join(""); }
  function newUser(username, name, role, pw) {
    var s = salt();
    return hash(pw, s).then(function (h) { return { username: username, name: name, role: role, salt: s, hash: h }; });
  }
  function pwOk(p) { return p.length >= 8 ? "" : "Password must be at least 8 characters."; }

  var ov = mk("div", '<form class="modal-card small" id="authForm" novalidate><h2 id="authTitle"></h2><p id="authHint" class="summary"></p><div class="grid">' +
    '<div class="field span2"><label for="aUser">Username</label><input id="aUser" autocomplete="username"></div>' +
    '<div class="field span2" id="aNameF"><label for="aName">Full name</label><input id="aName"></div>' +
    '<div class="field span2"><label for="aPass">Password</label><input id="aPass" type="password" autocomplete="current-password"></div>' +
    '<div class="field span2" id="aPass2F"><label for="aPass2">Confirm password</label><input id="aPass2" type="password" autocomplete="new-password"></div></div>' +
    '<div id="authErr" class="notice error" hidden></div><div class="modal-actions"><button class="btn btn-primary" id="authBtn" type="submit"></button></div></form>', "modal");
  ov.id = "authOverlay"; ov.style.zIndex = 200; ov.style.background = "var(--bg)"; document.body.appendChild(ov);
  function authMode() {
    var setup = users().length === 0;
    $("authTitle").textContent = setup ? "Create the administrator account" : "ExamOptima sign in";
    $("authHint").textContent = setup ? "First run: no users exist yet. This account becomes the Admin." : "Sign in with your username and password.";
    $("authBtn").textContent = setup ? "Create admin" : "Sign in";
    $("aNameF").hidden = $("aPass2F").hidden = !setup; return setup;
  }
  function authErr(m) { $("authErr").hidden = !m; $("authErr").textContent = m || ""; }
  $("authForm").addEventListener("submit", function (ev) {
    ev.preventDefault(); authErr("");
    var setup = authMode(), un = $("aUser").value.trim(), pw = $("aPass").value;
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(un)) { authErr("Username: 3–30 letters, digits, dot, dash or underscore."); return; }
    if (setup) {
      var nm = $("aName").value.trim();
      if (!nm) { authErr("Enter your full name."); return; }
      if (pwOk(pw)) { authErr(pwOk(pw)); return; }
      if (pw !== $("aPass2").value) { authErr("Passwords do not match."); return; }
      newUser(un, nm, "admin", pw).then(function (u) { if (save([u])) enter(u); }).catch(function (e) { authErr(e.message); });
    } else {
      var u = users().filter(function (x) { return x.username === un; })[0];
      if (!u) { authErr("Incorrect username or password."); return; }
      hash(pw, u.salt).then(function (h) { if (h === u.hash) enter(u); else authErr("Incorrect username or password."); }).catch(function (e) { authErr(e.message); });
    }
  });
  function enter(u) { sessionStorage.setItem(SK, u.username); $("aPass").value = $("aPass2").value = ""; applyRole(); }
  function applyRole() {
    var u = me();
    ov.hidden = !!u;
    document.body.classList.toggle("role-coordinator", !!u && u.role !== "admin");
    document.body.classList.toggle("role-admin", !!u && u.role === "admin");
    $("whoami").textContent = u ? u.name + " (" + (u.role === "admin" ? "Admin" : "Exam Coordinator") + ")" : "";
    if (!u) authMode(); else renderProfile();
  }
  // block restricted actions for the Exam Coordinator even if a hidden control is triggered
  document.addEventListener("click", function (e) {
    var u = me();
    if (u && u.role !== "admin" && e.target.closest && e.target.closest(RESTRICTED)) { e.stopPropagation(); e.preventDefault(); E.toast("Only an Admin can do that."); }
  }, true);

  var who = mk("div", '<span id="whoami" class="summary" style="margin:0 10px 0 0"></span><button id="logoutBtn" class="btn btn-ghost btn-sm" type="button">Log out</button>');
  who.style.display = "flex"; who.style.alignItems = "center";
  document.querySelector(".topbar").appendChild(who);
  $("logoutBtn").addEventListener("click", function () { sessionStorage.removeItem(SK); applyRole(); });
  var nav = document.querySelector(".nav"); nav.appendChild(mk("a", "Profile")); nav.lastChild.href = "#profile"; nav.lastChild.dataset.nav = "profile";

  var pv = mk("section", '<div class="view-head"><h2>Profile</h2></div><section class="panel"><div class="grid">' +
    '<div class="field"><label for="pName">Full name</label><input id="pName"></div><div class="field"><label>Role</label><input id="pRole" readonly></div>' +
    '<div class="field"><label for="pNew">New password</label><input id="pNew" type="password" autocomplete="new-password"></div>' +
    '<div class="field"><label for="pCur">Current password (to change password)</label><input id="pCur" type="password" autocomplete="current-password"></div></div>' +
    '<div id="pMsg" class="notice" hidden></div><div class="panel-actions"><button id="pSave" class="btn btn-primary">Save profile</button></div></section>' +
    '<section class="panel" id="usersAdmin"><h3 style="margin:0">Users (Admin only)</h3><div class="table-wrap"><table style="min-width:520px"><thead><tr><th>Username</th><th>Name</th><th>Role</th><th></th></tr></thead><tbody id="uBody"></tbody></table></div>' +
    '<div class="toolbar slim"><div class="field"><label for="uUser">Username</label><input id="uUser"></div><div class="field"><label for="uName">Full name</label><input id="uName"></div>' +
    '<div class="field"><label for="uRole">Role</label><select id="uRole"><option value="coordinator">Exam Coordinator</option><option value="admin">Admin</option></select></div>' +
    '<div class="field"><label for="uPass">Temporary password</label><input id="uPass" type="password" autocomplete="new-password"></div>' +
    '<div class="field actions"><button id="uAdd" class="btn btn-primary">Add user</button></div></div></section>', "view");
  pv.id = "view-profile"; pv.hidden = true; document.querySelector("main, .container").appendChild(pv);
  function pmsg(kind, m) { var n = $("pMsg"); n.className = "notice " + kind; n.textContent = m; n.hidden = false; }
  function renderProfile() {
    var u = me(); if (!u) return;
    $("pName").value = u.name; $("pRole").value = u.role === "admin" ? "Admin" : "Exam Coordinator";
    $("uBody").innerHTML = users().map(function (x) {
      return "<tr><td>" + E.esc(x.username) + "</td><td>" + E.esc(x.name) + "</td><td>" + (x.role === "admin" ? "Admin" : "Exam Coordinator") + '</td><td class="col-actions">' +
        (x.username === u.username ? "" : '<button class="btn btn-danger btn-sm" data-del="' + E.esc(x.username) + '">Delete</button>') + "</td></tr>";
    }).join("");
  }
  $("pSave").addEventListener("click", function () {
    var u = me(), list = users(), rec = list.filter(function (x) { return x.username === u.username; })[0], nm = $("pName").value.trim(), np = $("pNew").value;
    if (!nm) { pmsg("error", "Name cannot be empty."); return; }
    function done() { rec.name = nm; if (save(list)) { $("pNew").value = $("pCur").value = ""; applyRole(); pmsg("ok", "Profile saved."); } }
    if (!np) { done(); return; }
    if (pwOk(np)) { pmsg("error", pwOk(np)); return; }
    hash($("pCur").value, rec.salt).then(function (h) {
      if (h !== rec.hash) { pmsg("error", "Current password is incorrect."); return; }
      var s = salt(); return hash(np, s).then(function (nh) { rec.salt = s; rec.hash = nh; done(); });
    }).catch(function (e) { pmsg("error", e.message); });
  });
  $("uAdd").addEventListener("click", function () {
    var u = me(); if (!u || u.role !== "admin") return;
    var un = $("uUser").value.trim(), nm = $("uName").value.trim(), pw = $("uPass").value;
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(un) || !nm) { alert("Enter a valid username (3–30 letters, digits, . - _) and a full name."); return; }
    if (users().some(function (x) { return x.username.toLowerCase() === un.toLowerCase(); })) { alert("That username already exists."); return; }
    if (pwOk(pw)) { alert(pwOk(pw)); return; }
    newUser(un, nm, $("uRole").value, pw).then(function (nu) { var l = users(); l.push(nu); if (save(l)) { $("uUser").value = $("uName").value = $("uPass").value = ""; renderProfile(); E.toast("User added."); } }).catch(function (e) { alert(e.message); });
  });
  $("uBody").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-del]"), u = me(); if (!b || !u || u.role !== "admin") return;
    var l = users(), t = l.filter(function (x) { return x.username === b.dataset.del; })[0];
    if (!t || !window.confirm("Delete user " + t.username + "?")) return;
    if (t.role === "admin" && l.filter(function (x) { return x.role === "admin"; }).length < 2) { alert("The last Admin cannot be deleted."); return; }
    save(l.filter(function (x) { return x !== t; })); renderProfile(); E.toast("User deleted.");
  });
  // the router in classrooms.js ran before this file loaded: show the profile page if it is the current hash
  if (location.hash === "#profile") { pv.hidden = false; document.querySelectorAll("[data-nav]").forEach(function (a) { a.classList.toggle("active", a.dataset.nav === "profile"); }); $("view-dashboard").hidden = true; }
  applyRole();
})();
