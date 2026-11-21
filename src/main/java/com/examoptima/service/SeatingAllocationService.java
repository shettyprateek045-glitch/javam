package com.examoptima.service;

import com.examoptima.algorithm.BacktrackingSeatingPlacer;
import com.examoptima.algorithm.ConflictGraph;
import com.examoptima.algorithm.RoomOptimizer;
import com.examoptima.algorithm.WelshPowellColoring;
import com.examoptima.exception.InsufficientCapacityException;
import com.examoptima.model.*;

import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Advanced Java: Seating Allocation Service.
 * 
 * Coordinates:
 *  1. Fast lookup maps (student -> seat, room -> students, subject -> students).
 *  2. Conflict graph construction.
 *  3. Welsh-Powell graph coloring.
 *  4. PriorityQueue room ordering.
 *  5. Backtracking seating placement.
 *  6. Asynchronous execution via ExecutorService with cancellation and progress reporting.
 */
public class SeatingAllocationService {

    private final ExecutorService executor = Executors.newFixedThreadPool(4);
    private final Map<String, AllocationTaskStatus> taskMap = new ConcurrentHashMap<>();

    public static class AllocationTaskStatus {
        private final String taskId;
        private final String examId;
        private volatile int progress = 0;
        private volatile String status = "QUEUED"; // QUEUED, RUNNING, COMPLETED, CANCELLED, FAILED
        private volatile String message = "Task queued";
        private volatile AllocationPlan result;
        private final AtomicBoolean cancelled = new AtomicBoolean(false);

        public AllocationTaskStatus(String taskId, String examId) {
            this.taskId = taskId;
            this.examId = examId;
        }

        public String getTaskId() { return taskId; }
        public String getExamId() { return examId; }
        public int getProgress() { return progress; }
        public String getStatus() { return status; }
        public String getMessage() { return message; }
        public AllocationPlan getResult() { return result; }
        public boolean isCancelled() { return cancelled.get(); }
        public void cancel() { cancelled.set(true); this.status = "CANCELLED"; this.message = "Cancelled by user"; }
    }

    public String submitAllocation(
            Examination exam,
            List<Student> allStudents,
            List<Classroom> allClassrooms,
            List<Registration> allRegistrations) {

        String taskId = UUID.randomUUID().toString();
        AllocationTaskStatus task = new AllocationTaskStatus(taskId, exam.getId());
        taskMap.put(taskId, task);

        executor.submit(() -> {
            try {
                task.status = "RUNNING";
                task.progress = 10;
                task.message = "Resolving student registrations...";

                if (task.isCancelled()) return;

                AllocationPlan plan = executeAllocationPipeline(exam, allStudents, allClassrooms, allRegistrations, task);
                if (!task.isCancelled()) {
                    task.result = plan;
                    task.progress = 100;
                    task.status = "COMPLETED";
                    task.message = "Allocation completed successfully";
                }
            } catch (Exception ex) {
                task.status = "FAILED";
                task.message = ex.getMessage();
            }
        });

        return taskId;
    }

    public AllocationTaskStatus getTaskStatus(String taskId) {
        return taskMap.get(taskId);
    }

    public boolean cancelTask(String taskId) {
        AllocationTaskStatus task = taskMap.get(taskId);
        if (task != null) {
            task.cancel();
            return true;
        }
        return false;
    }

    /**
     * Executes the full pipeline synchronously (or from a worker thread).
     */
    public AllocationPlan executeAllocationPipeline(
            Examination exam,
            List<Student> allStudents,
            List<Classroom> allClassrooms,
            List<Registration> allRegistrations,
            AllocationTaskStatus taskProgress) throws InsufficientCapacityException {

        long startTime = System.currentTimeMillis();

        // 1. Fast Hash Lookups: student map, subject map
        Map<String, Student> studentLookup = new HashMap<>();
        Map<String, List<Student>> subjectToStudents = new HashMap<>();
        for (Student s : allStudents) {
            studentLookup.put(s.getUsn().toUpperCase(), s);
            subjectToStudents.computeIfAbsent(s.getSubject(), k -> new ArrayList<>()).add(s);
        }

        // 2. Identify registered students for this exam
        Set<String> registeredUsns = new HashSet<>();
        List<Student> registeredStudents = new ArrayList<>();
        List<UnallocatedStudent> unallocated = new ArrayList<>();

        for (Registration r : allRegistrations) {
            if (r.getExamId().equals(exam.getId())) {
                String usn = r.getUsn().toUpperCase();
                if (!registeredUsns.contains(usn)) {
                    registeredUsns.add(usn);
                    Student s = studentLookup.get(usn);
                    if (s != null) {
                        registeredStudents.add(s);
                    } else {
                        unallocated.add(new UnallocatedStudent(usn, "—", "—", "Student record missing in database"));
                    }
                }
            }
        }

        if (taskProgress != null) {
            taskProgress.progress = 25;
            taskProgress.message = "Building conflict graph & Welsh-Powell coloring...";
        }

        // 3. Build Conflict Graph
        ConflictGraph graph = ConflictGraph.buildFrom(registeredStudents);

        // 4. Welsh-Powell Graph Coloring
        Map<String, Integer> colorMap = WelshPowellColoring.colorGraph(graph);

        if (taskProgress != null) {
            taskProgress.progress = 50;
            taskProgress.message = "Selecting optimal classrooms via PriorityQueue...";
        }

        // 5. Room Ordering via PriorityQueue
        List<Classroom> selectedRooms = RoomOptimizer.selectMinimalRooms(allClassrooms, registeredStudents.size());

        if (taskProgress != null) {
            taskProgress.progress = 70;
            taskProgress.message = "Running backtracking seating placement...";
        }

        // 6. Partition students across selected rooms & run Backtracking placement
        List<HallAllocation> halls = new ArrayList<>();
        Map<String, SeatAllocation> studentToSeat = new HashMap<>();
        Map<String, List<Student>> roomToStudents = new HashMap<>();

        int studentPointer = 0;
        int totalNeighborConflicts = 0;
        int totalCapacity = 0;
        int totalSeated = 0;

        for (Classroom room : selectedRooms) {
            if (taskProgress != null && taskProgress.isCancelled()) return null;

            int roomCapacity = room.getEffectiveAvailableSeats();
            totalCapacity += room.getCapacity();

            int sliceEnd = Math.min(studentPointer + roomCapacity, registeredStudents.size());
            List<Student> roomSlice = new ArrayList<>(registeredStudents.subList(studentPointer, sliceEnd));
            studentPointer = sliceEnd;

            // Place students in room using backtracking
            BacktrackingSeatingPlacer.PlacementResult placement =
                BacktrackingSeatingPlacer.placeStudentsInRoom(room, roomSlice, colorMap);

            HallAllocation hall = new HallAllocation(
                room.getId(),
                room.getName(),
                room.getRoom(),
                room.getBuilding(),
                room.getCapacity(),
                room.getRows(),
                room.getColumns()
            );
            hall.setSeats(placement.getAllocations());
            halls.add(hall);

            totalSeated += placement.getAllocations().size();
            totalNeighborConflicts += placement.getNeighborConflictCount();

            // Track lookups
            for (SeatAllocation seat : placement.getAllocations()) {
                studentToSeat.put(seat.getUsn(), seat);
                Student s = studentLookup.get(seat.getUsn());
                if (s != null) {
                    roomToStudents.computeIfAbsent(room.getId(), k -> new ArrayList<>()).add(s);
                }
            }

            // Any unplaced from this room
            for (Student unplacedStudent : placement.getUnplacedStudents()) {
                unallocated.add(new UnallocatedStudent(
                    unplacedStudent.getUsn(),
                    unplacedStudent.getName(),
                    unplacedStudent.getDepartment(),
                    "Hall filled to capacity"
                ));
            }
        }

        // If any remaining registered students could not be seated
        while (studentPointer < registeredStudents.size()) {
            Student remaining = registeredStudents.get(studentPointer++);
            unallocated.add(new UnallocatedStudent(
                remaining.getUsn(),
                remaining.getName(),
                remaining.getDepartment(),
                "No additional room capacity available"
            ));
        }

        long elapsedTime = System.currentTimeMillis() - startTime;
        double utilization = totalCapacity > 0 ? ((double) totalSeated / totalCapacity) * 100.0 : 0.0;

        AllocationPlan plan = new AllocationPlan(exam.getId(), exam.getName(), exam.getSubjectCode());
        plan.setAllocationTimeMs(elapsedTime);
        plan.setSeatUtilizationPct(Math.round(utilization * 10.0) / 10.0);
        plan.setTotalRegistered(registeredUsns.size());
        plan.setTotalSeated(totalSeated);
        plan.setUnallocatedCount(unallocated.size());
        plan.setRoomsUsed(halls.size());
        plan.setSameDeptNeighbors(totalNeighborConflicts);
        plan.setOptimal(totalNeighborConflicts == 0 && unallocated.isEmpty());
        plan.setHalls(halls);
        plan.setUnallocated(unallocated);

        return plan;
    }
}
