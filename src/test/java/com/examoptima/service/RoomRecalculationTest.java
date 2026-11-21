package com.examoptima.service;

import com.examoptima.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class RoomRecalculationTest {

    @Test
    @DisplayName("Recalculation: When a room becomes unavailable, only displaced students are moved")
    public void testRecalculationMovesOnlyAffectedStudents() throws Exception {
        Classroom c1 = new Classroom("CR01", "Hall A", "101", "A", 20, 20);
        c1.setRows(4); c1.setColumns(5);

        Classroom c2 = new Classroom("CR02", "Hall B", "102", "B", 20, 20);
        c2.setRows(4); c2.setColumns(5);

        Classroom c3 = new Classroom("CR03", "Hall C (Backup)", "103", "C", 20, 20);
        c3.setRows(4); c3.setColumns(5);

        List<Student> students = new ArrayList<>();
        List<SeatAllocation> seatsA = new ArrayList<>();
        List<SeatAllocation> seatsB = new ArrayList<>();

        for (int i = 1; i <= 10; i++) {
            Student s = new Student("S" + i, "USN_A_" + i, "Student A " + i, "CSE", 3, "a" + i + "@test.com", "Math");
            students.add(s);
            seatsA.add(new SeatAllocation(c1.getId(), c1.getName(), c1.getRoom(), c1.getBuilding(), i, 1, i, s.getUsn(), s.getName(), s.getDepartment(), s.getSubject(), 1));
        }

        for (int i = 1; i <= 10; i++) {
            Student s = new Student("S_B" + i, "USN_B_" + i, "Student B " + i, "ECE", 3, "b" + i + "@test.com", "Physics");
            students.add(s);
            seatsB.add(new SeatAllocation(c2.getId(), c2.getName(), c2.getRoom(), c2.getBuilding(), i, 1, i, s.getUsn(), s.getName(), s.getDepartment(), s.getSubject(), 2));
        }

        HallAllocation hallA = new HallAllocation(c1.getId(), c1.getName(), c1.getRoom(), c1.getBuilding(), c1.getCapacity(), 4, 5);
        hallA.setSeats(seatsA);

        HallAllocation hallB = new HallAllocation(c2.getId(), c2.getName(), c2.getRoom(), c2.getBuilding(), c2.getCapacity(), 4, 5);
        hallB.setSeats(seatsB);

        AllocationPlan plan = new AllocationPlan("EX01", "Midterm", "CS101");
        plan.setHalls(new ArrayList<>(List.of(hallA, hallB)));
        plan.setTotalRegistered(20);
        plan.setTotalSeated(20);

        // Mark Hall A as unavailable
        c1.setAvailableForExam(false);

        RoomRecalculationResult result = RoomRecalculationService.recalculateForUnavailableRoom(
            c1.getId(), plan, students, List.of(c1, c2, c3)
        );

        assertNotNull(result);
        assertEquals(10, result.getAffectedStudentsCount(), "10 students in Hall A were affected");
        assertEquals(10, result.getReassignedCount(), "All 10 affected students should be reassigned");

        // Verify that students in Hall B remained untouched in their exact seats (1 through 10)
        AllocationPlan newPlan = result.getUpdatedPlan();
        boolean hallBPreserved = false;
        for (HallAllocation h : newPlan.getHalls()) {
            if (h.getClassroomId().equals(c2.getId())) {
                hallBPreserved = true;
                // Hall B should contain the original 10 students plus newly accommodated students from Hall A
                assertTrue(h.getSeats().size() >= 10);
                for (int i = 0; i < 10; i++) {
                    SeatAllocation originalSeat = seatsB.get(i);
                    SeatAllocation matching = h.getSeats().stream().filter(s -> s.getUsn().equals(originalSeat.getUsn())).findFirst().orElse(null);
                    assertNotNull(matching);
                    assertEquals(originalSeat.getSeat(), matching.getSeat(), "Original Hall B students should preserve their seats");
                }
            }
        }
        assertTrue(hallBPreserved, "Hall B must remain in the plan");
    }
}
