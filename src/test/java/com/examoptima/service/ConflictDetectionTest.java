package com.examoptima.service;

import com.examoptima.model.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@DisplayName("Conflict Detection Service Tests")
public class ConflictDetectionTest {

    @Test
    @DisplayName("Should detect duplicate registrations and missing student records")
    void testDuplicateRegistrationAndMissingStudent() {
        Student s1 = new Student("s1", "1MS21CS001", "Alice", "CSE", 5, "alice@test.com", "A");
        Classroom c1 = new Classroom("c1", "Room 101", "101", "Main Block", 50, 50);
        Examination ex = new Examination("ex1", "Midterm DS", "Data Structures", "CS501", "2026-12-01", "09:00", "12:00");

        List<Registration> registrations = List.of(
            new Registration("ex1", "1MS21CS001"),
            new Registration("ex1", "1MS21CS001"), // Duplicate
            new Registration("ex1", "1MS21CS999")  // Non-existent student
        );

        List<Conflict> conflicts = ConflictDetectionService.detectConflicts(
            List.of(s1),
            List.of(c1),
            List.of(ex),
            registrations,
            Collections.emptyMap()
        );

        boolean foundDuplicate = conflicts.stream().anyMatch(c -> "DUPLICATE_REGISTRATION".equals(c.getCategory()));
        boolean foundMissingStudent = conflicts.stream().anyMatch(c -> "UNREGISTERED_STUDENT".equals(c.getCategory()));

        assertTrue(foundDuplicate, "Should flag duplicate registration");
        assertTrue(foundMissingStudent, "Should flag unregistered student");
    }

    @Test
    @DisplayName("Should detect timetable clash when student registered for overlapping exams")
    void testTimetableClash() {
        Student s1 = new Student("s1", "1MS21CS001", "Alice", "CSE", 5, "alice@test.com", "A");
        Classroom c1 = new Classroom("c1", "Room 101", "101", "Main Block", 100, 100);

        Examination ex1 = new Examination("ex1", "Midterm DS", "Data Structures", "CS501", "2026-12-01", "09:00", "12:00");
        Examination ex2 = new Examination("ex2", "Midterm Algo", "Algorithms", "CS502", "2026-12-01", "10:00", "13:00"); // Overlaps!

        List<Registration> registrations = List.of(
            new Registration("ex1", "1MS21CS001"),
            new Registration("ex2", "1MS21CS001")
        );

        List<Conflict> conflicts = ConflictDetectionService.detectConflicts(
            List.of(s1),
            List.of(c1),
            List.of(ex1, ex2),
            registrations,
            Collections.emptyMap()
        );

        boolean foundClash = conflicts.stream().anyMatch(c -> "TIMETABLE_CLASH".equals(c.getCategory()));
        assertTrue(foundClash, "Should detect timetable clash for same student on overlapping exams");
    }

    @Test
    @DisplayName("Should detect room double booking across overlapping exams")
    void testRoomDoubleBooking() {
        Student s1 = new Student("s1", "1MS21CS001", "Alice", "CSE", 5, "alice@test.com", "A");
        Student s2 = new Student("s2", "1MS21EC001", "Bob", "ECE", 5, "bob@test.com", "B");
        Classroom c1 = new Classroom("c1", "Room 101", "101", "Main Block", 100, 100);

        Examination ex1 = new Examination("ex1", "Midterm DS", "Data Structures", "CS501", "2026-12-01", "09:00", "12:00");
        Examination ex2 = new Examination("ex2", "Midterm DL", "Digital Logic", "EC501", "2026-12-01", "10:00", "13:00"); // Overlaps

        HallAllocation hall1 = new HallAllocation("c1", "Room 101", "101", "Main Block", 100, 10, 10);
        AllocationPlan plan1 = new AllocationPlan("ex1", "Midterm DS", "CS501");
        plan1.getHalls().add(hall1);

        HallAllocation hall2 = new HallAllocation("c1", "Room 101", "101", "Main Block", 100, 10, 10);
        AllocationPlan plan2 = new AllocationPlan("ex2", "Midterm DL", "EC501");
        plan2.getHalls().add(hall2);

        Map<String, AllocationPlan> plans = new HashMap<>();
        plans.put("ex1", plan1);
        plans.put("ex2", plan2);

        List<Conflict> conflicts = ConflictDetectionService.detectConflicts(
            List.of(s1, s2),
            List.of(c1),
            List.of(ex1, ex2),
            Collections.emptyList(),
            plans
        );

        boolean foundDoubleBooking = conflicts.stream().anyMatch(c -> "ROOM_DOUBLE_BOOKING".equals(c.getCategory()));
        assertTrue(foundDoubleBooking, "Should flag room double-booking on overlapping exams");
    }

    @Test
    @DisplayName("Should detect over-capacity when registrations exceed campus capacity")
    void testOverCapacity() {
        Student s1 = new Student("s1", "1MS21CS001", "Alice", "CSE", 5, "alice@test.com", "A");
        Student s2 = new Student("s2", "1MS21CS002", "Bob", "CSE", 5, "bob@test.com", "A");
        Classroom tinyRoom = new Classroom("c1", "Room 1", "101", "Main Block", 1, 1); // Capacity = 1

        Examination ex = new Examination("ex1", "Midterm Intro", "Intro", "CS101", "2026-12-01", "09:00", "12:00");
        List<Registration> registrations = List.of(
            new Registration("ex1", "1MS21CS001"),
            new Registration("ex1", "1MS21CS002")
        );

        List<Conflict> conflicts = ConflictDetectionService.detectConflicts(
            List.of(s1, s2),
            List.of(tinyRoom),
            List.of(ex),
            registrations,
            Collections.emptyMap()
        );

        boolean foundOverCapacity = conflicts.stream().anyMatch(c -> "OVER_CAPACITY".equals(c.getCategory()));
        assertTrue(foundOverCapacity, "Should detect campus capacity exceeded");
    }
}
