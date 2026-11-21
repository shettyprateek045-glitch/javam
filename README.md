# ExamOptima 2.0 – Next-Gen Examination Seating & Optimization Suite

ExamOptima is an enterprise-grade examination management and seating allocation platform powered by an **Advanced Java (Java 17+)** allocation engine and a futuristic, 3D-inspired glassmorphic dashboard styled in light purple and lavender.

---

## 🌟 Advanced Java Architecture & Concept Mapping

The backend is built in pure, clean Java 17+ organized into modular packages: `model`, `service`, `algorithm`, `exception`, `util`, and `controller`.

| Advanced Java Concept | Implementation File & Package | Class & Key Methods | Role & Description |
| :--- | :--- | :--- | :--- |
| **Backtracking Algorithm** | `com.examoptima.algorithm` | [`BacktrackingSeatingPlacer.java`](src/main/java/com/examoptima/algorithm/BacktrackingSeatingPlacer.java) | Recursive constraint satisfaction backtracking with MRV (Minimum Remaining Values) heuristics. Enforces strict 4-directional non-adjacency (left, right, front, back cannot share same subject or department). Respects physically blocked/broken seats. |
| **Graph Coloring (Welsh-Powell)** | `com.examoptima.algorithm` | [`WelshPowellColoring.java`](src/main/java/com/examoptima/algorithm/WelshPowellColoring.java)<br>[`ConflictGraph.java`](src/main/java/com/examoptima/algorithm/ConflictGraph.java) | Constructs an undirected conflict graph where nodes represent students. Edges join students who share a subject, department adjacency, or USN series. Uses greedy Welsh-Powell coloring ordered by vertex degree descending to partition students into independent seat groups. |
| **PriorityQueue (Min/Max Heap)** | `com.examoptima.algorithm` | [`RoomOptimizer.java`](src/main/java/com/examoptima/algorithm/RoomOptimizer.java) | Uses `PriorityQueue<Classroom>` with a custom comparator `(a, b) -> Integer.compare(b.getCapacity(), a.getCapacity())` to order examination halls by largest capacity first. Minimizes the total number of physical rooms required and reduces invigilation overhead. |
| **HashMap & HashSet Fast Lookups** | `com.examoptima.service`<br>`com.examoptima.algorithm` | [`ConflictDetectionService.java`](src/main/java/com/examoptima/service/ConflictDetectionService.java)<br>[`ConflictGraph.java`](src/main/java/com/examoptima/algorithm/ConflictGraph.java)<br>[`SeatingAllocationService.java`](src/main/java/com/examoptima/service/SeatingAllocationService.java) | Provides $O(1)$ constant-time lookup maps: `studentMap` (USN → Student), `roomMap` (ID → Classroom), `examMap` (ID → Exam), and set-based intersection `overlappingStudents.retainAll()` for rapid conflict identification. |
| **Multithreading & Concurrency** | `com.examoptima.service` | [`SeatingAllocationService.java`](src/main/java/com/examoptima/service/SeatingAllocationService.java) | Uses `ExecutorService` thread pools and `CompletableFuture` / `Future<?>` for asynchronous non-blocking allocation tasks. Supports live progress reporting (0%–100%) and graceful task cancellation via `cancelTask(taskId)`. |
| **OOP & Clean Architecture** | `com.examoptima.model`<br>`com.examoptima.controller` | Models in `com.examoptima.model` & [`ApiController.java`](src/main/java/com/examoptima/controller/ApiController.java) | Strict separation of concerns: Domain entities (`Student`, `Classroom`, `Examination`, `Registration`, `AllocationPlan`, `Conflict`), algorithm layer, service layer, and lightweight REST API controller. |
| **Custom Exception Hierarchy** | `com.examoptima.exception` | [`ExamOptimaException.java`](src/main/java/com/examoptima/exception/ExamOptimaException.java)<br>[`InsufficientCapacityException.java`](src/main/java/com/examoptima/exception/InsufficientCapacityException.java)<br>[`ConflictUnresolvableException.java`](src/main/java/com/examoptima/exception/ConflictUnresolvableException.java)<br>[`RoomUnavailableException.java`](src/main/java/com/examoptima/exception/RoomUnavailableException.java) | Strongly-typed custom runtime exceptions with machine-readable error codes and actionable recovery suggestions for client UIs. |
| **Dynamic Recalculation Flow** | `com.examoptima.service` | [`RoomRecalculationService.java`](src/main/java/com/examoptima/service/RoomRecalculationService.java) | Handles "Mark room unavailable" events. Dynamically evicts only affected candidates from the offline room and reallocates them into remaining rooms with minimal disruption, returning a before/after delta and `MovedStudent` report. |
| **Binary PDF Generator** | `com.examoptima.util` | [`PdfUtil.java`](src/main/java/com/examoptima/util/PdfUtil.java)<br>[`ExportService.java`](src/main/java/com/examoptima/service/ExportService.java) | High-performance, pure Java zero-dependency PDF 1.4 binary document generator for Seating Charts, Invigilator Checklists, and Hall Attendance Sheets. |
| **Cloud Sync & Supabase** | `com.examoptima.service` | [`SupabaseService.java`](src/main/java/com/examoptima/service/SupabaseService.java)<br>[`schema.sql`](schema.sql) | Hybrid persistence engine supporting Supabase PostgreSQL cloud sync via REST endpoints, with instant fallback to high-speed in-memory state. |

---

## 🚀 Quick Start & Build Instructions

### Prerequisites
- **Java Development Kit**: JDK 17 or higher (tested with OpenJDK 25 LTS).
- **Maven**: Apache Maven 3.9+ (bundled wrapper `mvnw.cmd` / `mvn.cmd` included).

### 1. Run Unit Test Suite
To execute all JUnit 5 test cases covering Welsh-Powell coloring, backtracking, room optimization, recalculation, and conflict detection:

```bash
# Using Maven Wrapper
.\mvnw.cmd test

# Or using Maven offline
.\mvnw.cmd test -o
```

**Test Suite Coverage**:
- `WelshPowellColoringTest`: Validates degree ordering and zero-adjacent color conflicts.
- `BacktrackingSeatingPlacerTest`: Validates 4-way non-adjacency, blocked seat skip, and capacity bounds.
- `RoomOptimizerTest`: Validates PriorityQueue capacity ordering and `InsufficientCapacityException`.
- `ConflictDetectionTest`: Validates duplicate registrations, timetable clashes, room double-booking, and over-capacity.
- `RoomRecalculationTest`: Validates partial room evacuation and undisturbed seating preservation.

### 2. Package the Application
```bash
.\mvnw.cmd package -DskipTests=false
```

### 3. Start the Java Backend & UI Server
Run the built lightweight server:
```bash
java -cp target/classes com.examoptima.ExamOptimaServer 8080
```
Open [http://localhost:8080](http://localhost:8080) in your browser.

---

## 📡 REST API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/seed` | Generates 220+ demo students across 4 departments (CSE, ECE, EEE, ISE, Sem 1-4), 6 rooms, and 5 exams. |
| `POST` | `/api/allocate` | Starts asynchronous seating allocation in background thread with conflict graph and Welsh-Powell + backtracking. |
| `GET` | `/api/allocate/status?taskId={id}` | Polls real-time allocation percentage, state, and resulting plan. |
| `POST` | `/api/allocate/cancel` | Gracefully cancels an ongoing allocation. |
| `POST` | `/api/recalculate` | Marks a room unavailable and recalculates only displaced candidates. |
| `GET` | `/api/conflicts` | Detects clashes, room double-bookings, overcapacity, duplicate registrations, and unassigned students with fix tips. |
| `GET` | `/api/graph/{examId}` | Returns conflict graph JSON (nodes, colors, edges) for visual rendering. |
| `GET` | `/api/export/csv?examId={id}` | Downloads complete student seating allocation as CSV. |
| `GET` | `/api/export/pdf?examId={id}&type={chart|invigilator|attendance}` | Generates and streams PDF documents. |
| `POST` | `/api/supabase/sync` | Syncs local state to Supabase PostgreSQL cloud table. |

---

## 🎨 User Interface & Theme

The ExamOptima dashboard features a modern **light purple / lavender glassmorphic SaaS theme**:
- **Interactive 3D Seating View**: Visual classroom layout grid with green (allocated), white (empty), and grey (blocked) seats.
- **Dynamic Conflict Graph**: Interactive graph visualization displaying student clusters and edge relations colored by Welsh-Powell groups.
- **Analytics & Real-Time Metrics**: Instant visibility into seat utilization %, solver computation time, rooms utilized, and conflict resolution metrics.
- **Responsive Navigation**: Glassmorphic sidebar with instant status counters and quick-action toolbar.
