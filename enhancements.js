/* ExamOptima – Futuristic 3D UI & Interactive Enhancements
 * Adds high-tech 3D visualizers, animated counters, background particle canvas,
 * perspective controls for seating layout, floating student HUD, and sidebar controls.
 * Preserves 100% of underlying application logic and data models.
 */
(function () {
  "use strict";

  // ================= 1. Background Particle Engine =================
  function initBackgroundParticles() {
    var canvas = document.createElement("canvas");
    canvas.id = "bgParticles";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "-1";
    document.body.prepend(canvas);

    var ctx = canvas.getContext("2d");
    var particles = [];
    var count = 30;
    var w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    window.addEventListener("resize", resize);
    resize();

    var colors = [
      "rgba(168, 85, 247, ",  // Light Purple / Violet
      "rgba(192, 132, 252, ", // Soft Lavender
      "rgba(139, 92, 246, ",  // Rich Violet
      "rgba(216, 180, 254, "  // Lilac
    ];

    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        radius: Math.random() * 2.5 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: Math.random() * 0.4 + 0.15,
        speedX: (Math.random() - 0.5) * 0.35,
        speedY: (Math.random() - 0.5) * 0.35,
        pulseSpeed: Math.random() * 0.02 + 0.005,
        pulseVal: Math.random() * Math.PI
      });
    }

    var running = true;
    document.addEventListener("visibilitychange", function () {
      running = !document.hidden;
      if (running) requestAnimationFrame(loop);
    });

    function loop() {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (var j = 0; j < particles.length; j++) {
        var p = particles[j];
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulseVal += p.pulseSpeed;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        var currentAlpha = p.alpha + Math.sin(p.pulseVal) * 0.15;
        if (currentAlpha < 0.05) currentAlpha = 0.05;

        // Glow
        var rad = p.radius * (1 + Math.sin(p.pulseVal) * 0.3);
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, rad * 3);
        grad.addColorStop(0, p.color + currentAlpha + ")");
        grad.addColorStop(0.5, p.color + (currentAlpha * 0.4) + ")");
        grad.addColorStop(1, p.color + "0)");

        ctx.beginPath();
        ctx.arc(p.x, p.y, rad * 3, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(p.x, p.y, rad, 0, Math.PI * 2);
        ctx.fillStyle = p.color + (currentAlpha + 0.2) + ")";
        ctx.fill();
      }

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  // ================= 2. Animated Number Counters =================
  var animatedElements = {};
  function animateValue(el, start, end, duration) {
    if (isNaN(end)) return;
    if (start === end) {
      el.textContent = end.toLocaleString();
      return;
    }
    var startTime = null;
    function step(timestamp) {
      if (!startTime) startTime = timestamp;
      var progress = Math.min((timestamp - startTime) / duration, 1);
      // Ease out cubic
      var ease = 1 - Math.pow(1 - progress, 3);
      var current = Math.floor(start + (end - start) * ease);
      el.textContent = current.toLocaleString();
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = end.toLocaleString();
      }
    }
    requestAnimationFrame(step);
  }

  function setupStatCounters() {
    var statIds = [
      "st_capacity", "st_available", "st_rooms",
      "st_students", "st_exams", "st_regs", "st_seated"
    ];

    statIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;

      var observer = new MutationObserver(function () {
        var text = el.textContent.replace(/,/g, "").trim();
        var num = parseInt(text, 10);
        if (isNaN(num)) return;
        var prev = animatedElements[id] !== undefined ? animatedElements[id] : 0;
        if (prev !== num) {
          animatedElements[id] = num;
          observer.disconnect();
          animateValue(el, 0, num, 800);
          setTimeout(function () {
            observer.observe(el, { childList: true, characterData: true, subtree: true });
          }, 850);
        }
      });

      observer.observe(el, { childList: true, characterData: true, subtree: true });
    });
  }

  // ================= 3. 3D Stat Cards Icons & Decoration =================
  var STAT_ICONS = [
    // Capacity
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"></path><path d="M6 6h10"></path><path d="M6 10h10"></path></svg>',
    // Available
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M7 11V7a5 5 0 0 1 10 0v4"></path><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><circle cx="12" cy="16" r="1.5"></circle></svg>',
    // Classrooms
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><path d="M3 9h18"></path><path d="M9 21V9"></path></svg>',
    // Students
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    // Exams
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>',
    // Registrations
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
    // Seating
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>'
  ];

  var STAT_COLORS = [
    "cyan", "emerald", "blue", "purple", "indigo", "violet", "amber"
  ];

  function decorateStatCards() {
    var cards = document.querySelectorAll("#view-dashboard .stats .stat");
    cards.forEach(function (card, idx) {
      if (card.querySelector(".stat-icon-badge")) return;
      var icon = STAT_ICONS[idx % STAT_ICONS.length];
      var color = STAT_COLORS[idx % STAT_COLORS.length];

      var badge = document.createElement("div");
      badge.className = "stat-icon-badge color-" + color;
      badge.innerHTML = icon;

      var topRow = document.createElement("div");
      topRow.className = "stat-top-row";
      var label = card.querySelector(".stat-label");
      if (label) {
        card.insertBefore(topRow, label);
        topRow.appendChild(label);
        topRow.appendChild(badge);
      } else {
        card.prepend(badge);
      }

      // Add 3D sheen overlay
      var sheen = document.createElement("div");
      sheen.className = "card-3d-sheen";
      card.appendChild(sheen);

      // Mousemove 3D subtle tilt effect
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        var rotX = -(y / rect.height) * 10;
        var rotY = (x / rect.width) * 10;
        card.style.transform = "perspective(1000px) rotateX(" + rotX.toFixed(2) + "deg) rotateY(" + rotY.toFixed(2) + "deg) translateY(-6px)";
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
      });
    });
  }

  // ================= 4. 3D Dashboard Insights Visualizer =================
  function renderDashboard3DVisualizers() {
    var dashView = document.getElementById("view-dashboard");
    if (!dashView) return;

    var container = document.getElementById("dash3dAnalytics");
    if (!container) {
      container = document.createElement("div");
      container.id = "dash3dAnalytics";
      container.className = "dash-analytics-grid";
      var stats = dashView.querySelector(".stats");
      if (stats) stats.after(container);
      else dashView.appendChild(container);
    }

    var classrooms = typeof window.ExamOptimaClassrooms === "function" ? window.ExamOptimaClassrooms() : [];
    var students = typeof window.EO !== "undefined" && typeof window.EO.students === "function" ? window.EO.students() : [];
    var exams = typeof window.EO !== "undefined" && typeof window.EO.exams === "function" ? window.EO.exams() : [];

    // 1. Department Distribution Stats
    var deptCounts = {};
    students.forEach(function (s) {
      deptCounts[s.department] = (deptCounts[s.department] || 0) + 1;
    });
    var deptList = Object.keys(deptCounts).sort();

    var deptBarsHtml = deptList.map(function (d, i) {
      var c = deptCounts[d];
      var pct = students.length ? Math.round((c / students.length) * 100) : 0;
      var hue = (i * 55) % 360;
      return '<div class="dept-bar-row">' +
        '<div class="dept-info"><span class="dept-name">' + d + '</span><span class="dept-count">' + c + ' students (' + pct + '%)</span></div>' +
        '<div class="dept-track"><div class="dept-fill" style="width:' + pct + '%; background: linear-gradient(90deg, hsl(' + hue + ', 85%, 60%), hsl(' + (hue + 40) + ', 90%, 65%)); box-shadow: 0 0 10px hsla(' + hue + ', 85%, 60%, 0.4)"></div></div>' +
        '</div>';
    }).join("");

    // 2. Classroom Capacity Utilization 3D Bars
    var roomBarsHtml = classrooms.slice(0, 5).map(function (r) {
      var occupied = Math.max(0, r.capacity - r.available);
      var occPct = r.capacity ? Math.round((occupied / r.capacity) * 100) : 0;
      var availPct = 100 - occPct;
      return '<div class="room-isometric-item">' +
        '<div class="room-iso-head">' +
        '<strong>' + r.name + '</strong>' +
        '<span class="room-subtext">' + r.building + ' · Room ' + r.room + '</span>' +
        '<span class="badge ' + (availPct > 20 ? 'ok' : availPct > 0 ? 'warn' : 'full') + '">' + r.available + ' / ' + r.capacity + ' free</span>' +
        '</div>' +
        '<div class="room-bar-wrapper">' +
        '<div class="room-bar-occ" style="width:' + occPct + '%" title="' + occupied + ' occupied"></div>' +
        '<div class="room-bar-free" style="width:' + availPct + '%" title="' + r.available + ' available"></div>' +
        '</div>' +
        '</div>';
    }).join("");

    container.innerHTML =
      '<div class="panel glass-3d-card">' +
        '<div class="panel-header-row">' +
          '<div class="title-with-glow">' +
            '<span class="glow-bullet cyan"></span>' +
            '<h3>Campus Hall Occupancy & Allocation Matrix</h3>' +
          '</div>' +
          '<span class="telemetry-pill">3D Telemetry Active</span>' +
        '</div>' +
        '<div class="room-iso-list">' + (roomBarsHtml || '<p class="summary">No classroom telemetry available.</p>') + '</div>' +
      '</div>' +
      '<div class="panel glass-3d-card">' +
        '<div class="panel-header-row">' +
          '<div class="title-with-glow">' +
            '<span class="glow-bullet violet"></span>' +
            '<h3>Student Department Distribution</h3>' +
          '</div>' +
          '<span class="telemetry-pill">' + students.length + ' Registered</span>' +
        '</div>' +
        '<div class="dept-bars-list">' + (deptBarsHtml || '<p class="summary">No student records loaded.</p>') + '</div>' +
      '</div>';
  }

  // ================= 5. Seating Arrangement 3D Classroom View & HUD =================
  var is3DMode = true;
  var currentTilt = 24;

  function injectLayout3DControls() {
    var layView = document.getElementById("view-layout");
    if (!layView) return;

    var existingCtrl = document.getElementById("lay3DControls");
    if (existingCtrl) return;

    var ctrl = document.createElement("div");
    ctrl.id = "lay3DControls";
    ctrl.className = "layout-3d-controls-bar";
    ctrl.innerHTML =
      '<div class="controls-left">' +
        '<span class="controls-label">Classroom Visualization:</span>' +
        '<button type="button" id="btnToggle3D" class="view-mode-pill active">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>' +
          '3D Perspective' +
        '</button>' +
        '<button type="button" id="btnToggle2D" class="view-mode-pill">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="9" y1="21" x2="9" y2="9"></line></svg>' +
          '2D Plan' +
        '</button>' +
      '</div>' +
      '<div class="controls-right">' +
        '<span class="controls-label">3D Tilt:</span>' +
        '<div class="tilt-presets">' +
          '<button type="button" class="tilt-btn" data-tilt="15">Low (15°)</button>' +
          '<button type="button" class="tilt-btn active" data-tilt="24">Isometric (24°)</button>' +
          '<button type="button" class="tilt-btn" data-tilt="35">High (35°)</button>' +
        '</div>' +
      '</div>';

    var toolbar = layView.querySelector(".toolbar");
    if (toolbar) toolbar.after(ctrl);

    var btn3D = document.getElementById("btnToggle3D");
    var btn2D = document.getElementById("btnToggle2D");
    var tiltBtns = ctrl.querySelectorAll(".tilt-btn");

    function applyPerspective() {
      var grids = document.querySelectorAll(".seat-grid");
      grids.forEach(function (g) {
        if (is3DMode) {
          g.classList.add("perspective-3d");
          g.style.transform = "perspective(1100px) rotateX(" + currentTilt + "deg)";
        } else {
          g.classList.remove("perspective-3d");
          g.style.transform = "none";
        }
      });
      var halls = document.querySelectorAll("#layHalls .hall");
      halls.forEach(function (h) {
        if (!h.querySelector(".classroom-podium")) {
          var podium = document.createElement("div");
          podium.className = "classroom-podium";
          podium.innerHTML =
            '<div class="podium-line"></div>' +
            '<div class="podium-badge">' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>' +
              'FRONT / BLACKBOARD & INSTRUCTOR PODIUM' +
            '</div>' +
            '<div class="podium-line"></div>';
          var head = h.querySelector(".hall-head");
          if (head) head.after(podium);
        }
      });
    }

    btn3D.addEventListener("click", function () {
      is3DMode = true;
      btn3D.classList.add("active");
      btn2D.classList.remove("active");
      applyPerspective();
    });

    btn2D.addEventListener("click", function () {
      is3DMode = false;
      btn2D.classList.add("active");
      btn3D.classList.remove("active");
      applyPerspective();
    });

    tiltBtns.forEach(function (tb) {
      tb.addEventListener("click", function () {
        tiltBtns.forEach(function (b) { b.classList.remove("active"); });
        tb.classList.add("active");
        currentTilt = parseInt(tb.dataset.tilt, 10);
        if (is3DMode) applyPerspective();
      });
    });

    // Observer on layHalls to apply 3D whenever re-rendered by extras.js
    var layHalls = document.getElementById("layHalls");
    if (layHalls) {
      var hallObs = new MutationObserver(function () {
        applyPerspective();
      });
      hallObs.observe(layHalls, { childList: true });
    }
  }

  // ================= 6. Floating 3D Student HUD =================
  function setupFloatingStudentHUD() {
    var hud = document.createElement("div");
    hud.id = "floatingStudentHud";
    hud.className = "floating-hud-panel";
    hud.hidden = true;
    hud.innerHTML =
      '<div class="hud-content-card">' +
        '<button type="button" id="hudCloseBtn" class="hud-close">&times;</button>' +
        '<div class="hud-header">' +
          '<div class="hud-avatar" id="hudAvatar">ST</div>' +
          '<div class="hud-titles">' +
            '<h3 id="hudName">Student Name</h3>' +
            '<div class="hud-badge-row">' +
              '<span class="hud-pill cyan" id="hudUsn">1RN26CS001</span>' +
              '<span class="hud-pill violet" id="hudDept">CSE</span>' +
              '<span class="hud-pill emerald" id="hudStatus">Allocated</span>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="hud-details-grid">' +
          '<div class="hud-detail-cell">' +
            '<span class="hud-cell-label">Assigned Hall</span>' +
            '<span class="hud-cell-value" id="hudHall">Main Exam Hall</span>' +
          '</div>' +
          '<div class="hud-detail-cell">' +
            '<span class="hud-cell-label">Room / Building</span>' +
            '<span class="hud-cell-value" id="hudRoom">Room 101 · Block A</span>' +
          '</div>' +
          '<div class="hud-detail-cell">' +
            '<span class="hud-cell-label">Seat Number</span>' +
            '<span class="hud-cell-value highlight" id="hudSeat">Seat #14</span>' +
          '</div>' +
          '<div class="hud-detail-cell">' +
            '<span class="hud-cell-label">Status</span>' +
            '<span class="hud-cell-value" id="hudCondition">Ready for Examination</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(hud);

    document.getElementById("hudCloseBtn").addEventListener("click", function () {
      hud.classList.remove("active");
      setTimeout(function () { hud.hidden = true; }, 200);
    });

    // Intercept clicks on seats in layHalls
    var layHalls = document.getElementById("layHalls");
    if (layHalls) {
      layHalls.addEventListener("click", function (e) {
        var btn = e.target.closest("button.seat");
        if (!btn) return;

        // Deselect previous
        document.querySelectorAll("button.seat.selected-seat").forEach(function (s) {
          s.classList.remove("selected-seat");
        });
        btn.classList.add("selected-seat");

        // Wait a tick for extras.js to populate layDetail
        setTimeout(function () {
          var layDetail = document.getElementById("layDetail");
          if (!layDetail) return;

          var text = layDetail.textContent || "";
          var seatNo = btn.dataset.n || "";
          var hallSec = btn.closest(".hall");
          var hallTitle = hallSec ? (hallSec.querySelector(".hall-head h3") ? hallSec.querySelector(".hall-head h3").textContent : "") : "";
          var roomSub = hallSec ? (hallSec.querySelector(".hall-head p") ? hallSec.querySelector(".hall-head p").textContent : "") : "";

          if (btn.classList.contains("alloc")) {
            // Allocated student info
            var match = /Seat \d+:\s*(.+?)\s*\((.+?)\),\s*(.+?)\s*·/.exec(text);
            var name = match ? match[1] : "Allocated Student";
            var usn = match ? match[2] : "USN Verified";
            var dept = match ? match[3] : "Department";

            document.getElementById("hudAvatar").textContent = name.substring(0, 2).toUpperCase();
            document.getElementById("hudName").textContent = name;
            document.getElementById("hudUsn").textContent = usn;
            document.getElementById("hudDept").textContent = dept;
            document.getElementById("hudStatus").className = "hud-pill emerald";
            document.getElementById("hudStatus").textContent = "ALLOCATED";
            document.getElementById("hudHall").textContent = hallTitle || "Assigned Hall";
            document.getElementById("hudRoom").textContent = roomSub || "Room Assigned";
            document.getElementById("hudSeat").textContent = "Seat #" + seatNo;
            document.getElementById("hudCondition").textContent = "Verified Desk Position";
          } else if (btn.classList.contains("blocked")) {
            document.getElementById("hudAvatar").textContent = "✕";
            document.getElementById("hudName").textContent = "Blocked / Unavailable Seat";
            document.getElementById("hudUsn").textContent = "N/A";
            document.getElementById("hudDept").textContent = "Maintenance / Defect";
            document.getElementById("hudStatus").className = "hud-pill error";
            document.getElementById("hudStatus").textContent = "BLOCKED";
            document.getElementById("hudHall").textContent = hallTitle || "Classroom";
            document.getElementById("hudRoom").textContent = roomSub || "";
            document.getElementById("hudSeat").textContent = "Seat #" + seatNo;
            document.getElementById("hudCondition").textContent = "Excluded from Examination Seating";
          } else {
            document.getElementById("hudAvatar").textContent = "○";
            document.getElementById("hudName").textContent = "Empty Available Seat";
            document.getElementById("hudUsn").textContent = "Vacant";
            document.getElementById("hudDept").textContent = "Open";
            document.getElementById("hudStatus").className = "hud-pill warn";
            document.getElementById("hudStatus").textContent = "UNOCCUPIED";
            document.getElementById("hudHall").textContent = hallTitle || "Classroom";
            document.getElementById("hudRoom").textContent = roomSub || "";
            document.getElementById("hudSeat").textContent = "Seat #" + seatNo;
            document.getElementById("hudCondition").textContent = "Available for Allocation";
          }

          hud.hidden = false;
          // Force layout
          void hud.offsetWidth;
          hud.classList.add("active");
        }, 30);
      });
    }
  }

  // ================= 7. Sidebar Collapse & Mobile Drawer =================
  function setupSidebar() {
    var sidebar = document.getElementById("appSidebar");
    var toggleBtn = document.getElementById("sidebarToggle");
    var mobileBtn = document.getElementById("mobileMenuBtn");
    var overlay = document.getElementById("sidebarOverlay");

    if (!sidebar) return;

    var isCollapsed = localStorage.getItem("examoptima.sidebar.collapsed") === "true";
    if (isCollapsed) sidebar.classList.add("collapsed");

    if (toggleBtn) {
      toggleBtn.addEventListener("click", function () {
        var collapsed = sidebar.classList.toggle("collapsed");
        localStorage.setItem("examoptima.sidebar.collapsed", collapsed ? "true" : "false");
      });
    }

    if (mobileBtn && overlay) {
      mobileBtn.addEventListener("click", function () {
        sidebar.classList.toggle("mobile-open");
        overlay.classList.toggle("active");
      });
      overlay.addEventListener("click", function () {
        sidebar.classList.remove("mobile-open");
        overlay.classList.remove("active");
      });
    }

    // Close mobile drawer when clicking nav link
    sidebar.addEventListener("click", function (e) {
      if (e.target.closest("a[data-nav]")) {
        sidebar.classList.remove("mobile-open");
        if (overlay) overlay.classList.remove("active");
      }
    });

    // Update active view breadcrumb on navigation
    var bc = document.getElementById("currentViewName");
    var VIEW_TITLES = {
      dashboard: "Dashboard Overview",
      students: "Student Management",
      classrooms: "Classroom Management",
      exams: "Examination Management",
      registrations: "Exam Registrations",
      seating: "Seating Allocation",
      layout: "3D Classroom Layout",
      conflicts: "Conflict Diagnostics",
      reports: "Reports & Analytics",
      profile: "Security & Profile"
    };

    document.addEventListener("eo:view", function (e) {
      var v = e.detail;
      if (bc) bc.textContent = VIEW_TITLES[v] || v.charAt(0).toUpperCase() + v.slice(1);
      if (v === "dashboard") {
        setTimeout(function () {
          decorateStatCards();
          renderDashboard3DVisualizers();
        }, 50);
      }
      if (v === "layout") {
        setTimeout(function () {
          injectLayout3DControls();
        }, 50);
      }
    });

    // Style dynamically appended Profile link
    var nav = document.querySelector(".nav");
    if (nav) {
      var obs = new MutationObserver(function () {
        var profLink = nav.querySelector('a[data-nav="profile"]');
        if (profLink && !profLink.querySelector(".nav-icon")) {
          var text = profLink.textContent;
          profLink.innerHTML =
            '<span class="nav-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>' +
            '<span class="nav-text">' + text + '</span>';
        }
      });
      obs.observe(nav, { childList: true });
    }
  }

  // ================= 8. Login Page 3D Emblems & Enhancements =================
  function enhanceLoginPage() {
    var checkAuth = setInterval(function () {
      var authOverlay = document.getElementById("authOverlay");
      var authForm = document.getElementById("authForm");
      if (authOverlay && authForm) {
        clearInterval(checkAuth);

        if (!authForm.querySelector(".auth-3d-header")) {
          var header = document.createElement("div");
          header.className = "auth-3d-header";
          header.innerHTML =
            '<div class="auth-emblem-ring">' +
              '<div class="emblem-core">EO</div>' +
              '<div class="emblem-pulse-ring"></div>' +
              '<div class="emblem-pulse-ring outer"></div>' +
            '</div>' +
            '<div class="auth-platform-tag">NEXT-GEN EXAM SEATING SUITE</div>';
          authForm.prepend(header);
        }

        // Add animated ambient backdrop spheres inside overlay
        if (!authOverlay.querySelector(".auth-ambient-glow")) {
          var glow1 = document.createElement("div");
          glow1.className = "auth-ambient-glow glow-cyan";
          var glow2 = document.createElement("div");
          glow2.className = "auth-ambient-glow glow-violet";
          authOverlay.prepend(glow1);
          authOverlay.prepend(glow2);
        }
      }
    }, 50);
  }

  // ================= 9. Quick Search / Command Palette =================
  function setupQuickNav() {
    var input = document.getElementById("globalQuickSearch");
    if (!input) return;

    var navMap = [
      { key: "dashboard", label: "Dashboard" },
      { key: "students", label: "Students" },
      { key: "classrooms", label: "Classrooms" },
      { key: "exams", label: "Examinations" },
      { key: "registrations", label: "Registrations" },
      { key: "seating", label: "Seating" },
      { key: "layout", label: "Layout" },
      { key: "conflicts", label: "Conflicts" },
      { key: "reports", label: "Reports" },
      { key: "profile", label: "Profile" }
    ];

    document.addEventListener("keydown", function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        var target = prompt("Quick Jump: (dashboard, students, classrooms, exams, registrations, seating, layout, conflicts, reports, profile)");
        if (target) {
          var match = navMap.filter(function (n) {
            return n.key.indexOf(target.toLowerCase()) !== -1;
          })[0];
          if (match) location.hash = "#" + match.key;
        }
      }
    });

    input.addEventListener("click", function () {
      var evt = new KeyboardEvent("keydown", { key: "k", ctrlKey: true });
      document.dispatchEvent(evt);
    });
  }

  // ================= Initialization =================
  function init() {
    initBackgroundParticles();
    setupStatCounters();
    decorateStatCards();
    renderDashboard3DVisualizers();
    setupSidebar();
    injectLayout3DControls();
    setupFloatingStudentHUD();
    enhanceLoginPage();
    setupQuickNav();

    // Hook to redraw visualizers when data updates
    window.addEventListener("storage", function () {
      renderDashboard3DVisualizers();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();