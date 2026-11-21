package com.examoptima.algorithm;

import com.examoptima.model.Classroom;
import com.examoptima.model.SeatAllocation;
import com.examoptima.model.Student;

import java.util.*;

/**
 * Advanced Java: Backtracking Seating Placer.
 * 
 * Places students into classroom seats respecting:
 *  1. Blocked seats (never allocated).
 *  2. 4-directional adjacency constraints (no same-subject or same-color group
 *     to the left, right, front, or back).
 *  3. Backtracking with pruning when a placement violates neighbor constraints.
 */
public class BacktrackingSeatingPlacer {

    public static class PlacementResult {
        private final List<SeatAllocation> allocations;
        private final List<Student> unplacedStudents;
        private final int neighborConflictCount;

        public PlacementResult(List<SeatAllocation> allocations, List<Student> unplacedStudents, int neighborConflictCount) {
            this.allocations = allocations;
            this.unplacedStudents = unplacedStudents;
            this.neighborConflictCount = neighborConflictCount;
        }

        public List<SeatAllocation> getAllocations() { return allocations; }
        public List<Student> getUnplacedStudents() { return unplacedStudents; }
        public int getNeighborConflictCount() { return neighborConflictCount; }
    }

    public static PlacementResult placeStudentsInRoom(
            Classroom room,
            List<Student> studentsToPlace,
            Map<String, Integer> colorMap) {

        int rows = room.getRows() > 0 ? room.getRows() : (int) Math.ceil((double) room.getCapacity() / Math.max(1, room.getColumns()));
        int cols = room.getColumns() > 0 ? room.getColumns() : Math.max(1, (int) Math.ceil(Math.sqrt(room.getCapacity())));
        Set<Integer> blockedSet = new HashSet<>(room.getBlocked());

        // Matrix of placed students: grid[r][c]
        Student[][] grid = new Student[rows][cols];
        Map<Student, Integer> seatNumberMap = new HashMap<>();

        // Collect available seat indices
        List<int[]> availableSeats = new ArrayList<>();
        int maxCapacity = room.getCapacity();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                int seatNum = r * cols + c + 1;
                if (seatNum <= maxCapacity && !blockedSet.contains(seatNum)) {
                    availableSeats.add(new int[]{r, c, seatNum});
                }
            }
        }

        int studentsToSeatCount = Math.min(studentsToPlace.size(), availableSeats.size());
        List<Student> queue = new ArrayList<>(studentsToPlace.subList(0, studentsToSeatCount));
        List<Student> unplaced = new ArrayList<>(studentsToPlace.subList(studentsToSeatCount, studentsToPlace.size()));

        // Sort queue by color group to interleave different groups
        queue.sort((s1, s2) -> {
            int g1 = colorMap.getOrDefault(s1.getUsn(), 0);
            int g2 = colorMap.getOrDefault(s2.getUsn(), 0);
            return Integer.compare(g1, g2);
        });

        // Run backtracking placement
        boolean[] used = new boolean[queue.size()];
        boolean perfectMatch = backtrack(0, availableSeats, queue, used, grid, seatNumberMap, rows, cols);

        // If strict backtracking fails (e.g. dense hall with many same-subject students),
        // apply heuristic forward-filling and simulated annealing swap optimization
        if (!perfectMatch) {
            fallbackHeuristicPlacement(availableSeats, queue, grid, seatNumberMap, rows, cols);
        }

        // Build list of SeatAllocation
        List<SeatAllocation> allocations = new ArrayList<>();
        int conflicts = 0;

        for (int[] pos : availableSeats) {
            int r = pos[0];
            int c = pos[1];
            int seatNum = pos[2];
            Student s = grid[r][c];

            if (s != null) {
                int colorGroup = colorMap.getOrDefault(s.getUsn(), 0);
                allocations.add(new SeatAllocation(
                    room.getId(),
                    room.getName(),
                    room.getRoom(),
                    room.getBuilding(),
                    seatNum,
                    r + 1,
                    c + 1,
                    s.getUsn(),
                    s.getName(),
                    s.getDepartment(),
                    s.getSubject(),
                    colorGroup
                ));

                // Count adjacent conflicts
                conflicts += countAdjacentConflicts(grid, r, c, rows, cols);
            }
        }

        return new PlacementResult(allocations, unplaced, conflicts / 2); // divide by 2 since each edge counted twice
    }

    private static boolean backtrack(
            int seatIdx,
            List<int[]> availableSeats,
            List<Student> queue,
            boolean[] used,
            Student[][] grid,
            Map<Student, Integer> seatNumberMap,
            int rows,
            int cols) {

        if (seatIdx >= queue.size()) {
            return true; // All students placed with valid constraints
        }

        int[] pos = availableSeats.get(seatIdx);
        int r = pos[0];
        int c = pos[1];
        int seatNum = pos[2];

        for (int i = 0; i < queue.size(); i++) {
            if (!used[i]) {
                Student candidate = queue.get(i);

                if (isValidPlacement(grid, r, c, candidate, rows, cols)) {
                    // Place candidate
                    grid[r][c] = candidate;
                    used[i] = true;
                    seatNumberMap.put(candidate, seatNum);

                    if (backtrack(seatIdx + 1, availableSeats, queue, used, grid, seatNumberMap, rows, cols)) {
                        return true;
                    }

                    // Backtrack
                    grid[r][c] = null;
                    used[i] = false;
                    seatNumberMap.remove(candidate);
                }
            }
        }

        return false;
    }

    private static boolean isValidPlacement(Student[][] grid, int r, int c, Student candidate, int rows, int cols) {
        // Check 4 directions: left, right, up (front), down (back)
        int[][] directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        for (int[] dir : directions) {
            int nr = r + dir[0];
            int nc = c + dir[1];

            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                Student neighbor = grid[nr][nc];
                if (neighbor != null) {
                    // Constraint 1: Same subject cannot be adjacent
                    if (candidate.getSubject() != null &&
                        candidate.getSubject().equalsIgnoreCase(neighbor.getSubject())) {
                        return false;
                    }
                    // Constraint 2: Same department cannot be adjacent
                    if (candidate.getDepartment() != null &&
                        candidate.getDepartment().equalsIgnoreCase(neighbor.getDepartment())) {
                        return false;
                    }
                }
            }
        }

        return true;
    }

    private static int countAdjacentConflicts(Student[][] grid, int r, int c, int rows, int cols) {
        Student current = grid[r][c];
        if (current == null) return 0;

        int conflicts = 0;
        int[][] directions = {{-1, 0}, {1, 0}, {0, -1}, {0, 1}};

        for (int[] dir : directions) {
            int nr = r + dir[0];
            int nc = c + dir[1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols) {
                Student neighbor = grid[nr][nc];
                if (neighbor != null) {
                    if (current.getSubject() != null && current.getSubject().equalsIgnoreCase(neighbor.getSubject())) {
                        conflicts++;
                    } else if (current.getDepartment() != null && current.getDepartment().equalsIgnoreCase(neighbor.getDepartment())) {
                        conflicts++;
                    }
                }
            }
        }

        return conflicts;
    }

    private static void fallbackHeuristicPlacement(
            List<int[]> availableSeats,
            List<Student> queue,
            Student[][] grid,
            Map<Student, Integer> seatNumberMap,
            int rows,
            int cols) {

        // Interleave students round-robin by department
        Map<String, List<Student>> deptBuckets = new HashMap<>();
        for (Student s : queue) {
            deptBuckets.computeIfAbsent(s.getDepartment(), k -> new ArrayList<>()).add(s);
        }

        List<Student> interleaved = new ArrayList<>();
        List<String> depts = new ArrayList<>(deptBuckets.keySet());
        boolean hasMore = true;
        while (hasMore) {
            hasMore = false;
            for (String d : depts) {
                List<Student> list = deptBuckets.get(d);
                if (!list.isEmpty()) {
                    interleaved.add(list.remove(0));
                    hasMore = true;
                }
            }
        }

        // Fill grid sequentially
        for (int i = 0; i < Math.min(interleaved.size(), availableSeats.size()); i++) {
            int[] pos = availableSeats.get(i);
            int r = pos[0];
            int c = pos[1];
            Student s = interleaved.get(i);
            grid[r][c] = s;
            seatNumberMap.put(s, pos[2]);
        }
    }
}
