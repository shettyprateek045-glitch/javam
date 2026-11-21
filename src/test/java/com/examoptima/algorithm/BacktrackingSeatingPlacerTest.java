package com.examoptima.algorithm;

import com.examoptima.model.Classroom;
import com.examoptima.model.SeatAllocation;
import com.examoptima.model.Student;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class BacktrackingSeatingPlacerTest {

    @Test
    @DisplayName("Backtracking: Blocked seats must never be allocated to any student")
    public void testBlockedSeatsNeverAllocated() {
        Classroom room = new Classroom("CR01", "Lab 1", "101", "Block A", 20, 20);
        room.setRows(4);
        room.setColumns(5);
        room.setBlocked(List.of(3, 7, 12)); // Block seats 3, 7, 12

        List<Student> students = new ArrayList<>();
        for (int i = 1; i <= 15; i++) {
            students.add(new Student("S" + i, "USN" + i, "Student " + i, i % 2 == 0 ? "CSE" : "ECE", 3, "s@test.com", i % 2 == 0 ? "Math" : "Physics"));
        }

        BacktrackingSeatingPlacer.PlacementResult result =
            BacktrackingSeatingPlacer.placeStudentsInRoom(room, students, Collections.emptyMap());

        Set<Integer> allocatedSeatNumbers = new HashSet<>();
        for (SeatAllocation sa : result.getAllocations()) {
            allocatedSeatNumbers.add(sa.getSeat());
        }

        assertFalse(allocatedSeatNumbers.contains(3), "Seat 3 was blocked and must NOT be allocated");
        assertFalse(allocatedSeatNumbers.contains(7), "Seat 7 was blocked and must NOT be allocated");
        assertFalse(allocatedSeatNumbers.contains(12), "Seat 12 was blocked and must NOT be allocated");
    }

    @Test
    @DisplayName("Backtracking: Adjacent seats must not contain same-subject students")
    public void testAdjacentSeatsDifferentSubjects() {
        Classroom room = new Classroom("CR02", "Hall 2", "102", "Block A", 12, 12);
        room.setRows(3);
        room.setColumns(4);

        List<Student> students = new ArrayList<>();
        // 6 CSE students (Math) + 6 ECE students (Physics)
        for (int i = 1; i <= 6; i++) {
            students.add(new Student("C" + i, "1RN24CS" + i, "CSE " + i, "CSE", 3, "c@test.com", "Math"));
            students.add(new Student("E" + i, "1RN24EC" + i, "ECE " + i, "ECE", 3, "e@test.com", "Physics"));
        }

        BacktrackingSeatingPlacer.PlacementResult result =
            BacktrackingSeatingPlacer.placeStudentsInRoom(room, students, Collections.emptyMap());

        assertEquals(12, result.getAllocations().size(), "All 12 students should be seated");

        // Verify adjacency: check every pair
        Map<Integer, SeatAllocation> seatMap = new HashMap<>();
        for (SeatAllocation sa : result.getAllocations()) {
            seatMap.put(sa.getSeat(), sa);
        }

        int cols = room.getColumns();
        for (SeatAllocation sa : result.getAllocations()) {
            int seat = sa.getSeat();
            int r = sa.getRow();
            int c = sa.getCol();

            // Right neighbor
            if (c < cols && seatMap.containsKey(seat + 1)) {
                SeatAllocation right = seatMap.get(seat + 1);
                assertNotEquals(sa.getSubject(), right.getSubject(),
                    "Horizontal neighbors cannot share the same subject: " + sa.getUsn() + " vs " + right.getUsn());
            }

            // Down neighbor (front/back)
            if (seatMap.containsKey(seat + cols)) {
                SeatAllocation down = seatMap.get(seat + cols);
                assertNotEquals(sa.getSubject(), down.getSubject(),
                    "Vertical neighbors cannot share the same subject: " + sa.getUsn() + " vs " + down.getUsn());
            }
        }
    }
}
