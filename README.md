# ExamOptima – Admin Console

Open `index.html` in any modern browser (no server or install needed).

Pages (top navigation):
- Dashboard      – classroom capacity, seats, classroom / student / examination / registration counts
- Students       – Student Management (original CSV data, 50 students)
- Classrooms     – Classroom Management
- Examinations   – add / view / edit / delete exams; search + status and date filters (starts empty)
- Registrations  – pick an exam, register students by USN (validated against Students, no duplicates)
- Seating        – automatic hall-wise seating for an exam, plus unallocated students

Seating rules
- Uses each classroom's "Available Seats" (never more than its seating capacity).
- One seat per student per exam; a hall is never filled beyond its seats.
- Students are interleaved by department so neighbours differ where possible.
- A classroom already used by another exam at an overlapping time is skipped.
- A saved seating plan shows a warning if registrations, classrooms or the exam schedule changed after it was generated.
- Registering a student who already has another exam at an overlapping time shows a timetable-clash warning (not blocked).

Files
- data.js           original student CSV data, never modified by the app
- common.js         shared helpers
- app.js            Student Management
- classrooms.js     Classroom Management, dashboard, navigation
- exams.js / registrations.js / seating.js   the new modules

All changes are saved in your browser (localStorage). No example exam records are included.

Added in this version
- Dashboard: completed seating arrangements and recent activities.
- Layout: seat grid per hall (green allocated, white empty, grey unavailable); click a seat for the student.
- Conflicts: duplicate seats, multiple seats per student, unregistered/missing students, capacity, unavailable seats, double-booked classrooms, timetable clashes, out-of-date seating, each with a fix.
- Reports: hall-wise, student-wise, examination-wise, occupancy, unallocated, conflicts as CSV, Excel (.xls, SpreadsheetML; Excel may show a format warning) and PDF (browser Print > Save as PDF).

Added in version 3
- Login: the first run asks you to create the Admin account (no default password). Roles: Admin (everything) and Exam Coordinator (view, register students, generate seating, conflicts, reports; cannot add/edit/delete students, classrooms or examinations, or manage users). Profile page: change name/password; Admin adds and deletes users. Passwords are stored as salted SHA-256 hashes.
- Students: Import CSV (Student ID, USN, Name, Department, Semester, Email, Subject; bad rows are listed and skipped) and Export CSV. Registrations: Import USNs from CSV for the selected examination (same validation as typing USNs).
- Layout page: classroom editor for rows, columns and blocked seats (capacity = rows x columns; available = capacity - blocked). Seating never uses blocked seats.
- Seating optimiser: swaps students inside each hall to reduce same-department neighbours (left/right/front/back). 0 neighbours = proven optimal; otherwise the plan is valid but not proven optimal.

Limitations
- Login is checked in the browser only; it is not server-side security.
- Data is stored in the browser (localStorage), not a server database.
- Excel (.xls) and PDF (browser print) downloads were not opened in Excel or a PDF viewer.
