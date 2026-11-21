package com.examoptima.service;

import com.examoptima.model.*;

import java.util.*;

/**
 * Advanced Java: Conflict Detection Service.
 * 
 * Inspects all system entities using Collections and fast HashMap/HashSet lookups to detect:
 *  1. Timetable Clashes: Student registered for 2 overlapping examinations.
 *  2. Room Double-Booking: Classroom used by 2 overlapping examinations.
 *  3. Over-Capacity: Registrations exceed available seats.
 *  4. Duplicate Registrations: Same student registered multiple times for an exam.
 *  5. Unassigned Students: Registered students without a seat.
 * 
 * Results are returned with actionable "Fix Suggestions".
 */
public class ConflictDetectionService {

    public static List<Conflict> detectConflicts(
            List<Student> students,
            List<Classroom> classrooms,
            List<Examination> examinations,
            List<Registration> registrations,
            Map<String, AllocationPlan> seatingPlans) {

        List<Conflict> conflicts = new ArrayList<>();

        Map<String, Student> studentMap = new HashMap<>();
        for (Student s : students) studentMap.put(s.getUsn().toUpperCase(), s);

        Map<String, Examination> examMap = new HashMap<>();
        for (Examination e : examinations) examMap.put(e.getId(), e);

        Map<String, Classroom> roomMap = new HashMap<>();
        int totalAvailableSeats = 0;
        for (Classroom c : classrooms) {
            roomMap.put(c.getId(), c);
            totalAvailableSeats += c.getEffectiveAvailableSeats();
        }

        // Map examId -> Set of registered USNs
        Map<String, Set<String>> examToStudents = new HashMap<>();
        Set<String> seenRegPairs = new HashSet<>();

        // 1. Duplicate registrations & missing student records
        for (Registration r : registrations) {
            String key = r.getExamId() + "|" + r.getUsn().toUpperCase();
            Examination ex = examMap.get(r.getExamId());

            if (seenRegPairs.contains(key)) {
                conflicts.add(new Conflict(
                    "Error",
                    "DUPLICATE_REGISTRATION",
                    r.getExamId(),
                    ex != null ? ex.getName() : r.getExamId(),
                    "Duplicate Registration Detected",
                    String.format("Student %s is registered multiple times for %s.", r.getUsn(), ex != null ? ex.getName() : r.getExamId()),
                    "Remove redundant registration entries in the Registrations module."
                ));
            } else {
                seenRegPairs.add(key);
                examToStudents.computeIfAbsent(r.getExamId(), k -> new HashSet<>()).add(r.getUsn().toUpperCase());
            }

            if (!studentMap.containsKey(r.getUsn().toUpperCase())) {
                conflicts.add(new Conflict(
                    "Error",
                    "UNREGISTERED_STUDENT",
                    r.getExamId(),
                    ex != null ? ex.getName() : r.getExamId(),
                    "Registered Student Missing in Student Database",
                    String.format("USN %s is registered for exam %s but has no profile in Student Management.", r.getUsn(), r.getExamId()),
                    "Add the student record in Students or remove this invalid registration."
                ));
            }
        }

        // 2. Timetable clashes (Student taking 2 exams at the same time)
        for (int i = 0; i < examinations.size(); i++) {
            Examination e1 = examinations.get(i);
            Set<String> students1 = examToStudents.getOrDefault(e1.getId(), Collections.emptySet());

            for (int j = i + 1; j < examinations.size(); j++) {
                Examination e2 = examinations.get(j);

                if (e1.overlapsWith(e2)) {
                    Set<String> students2 = examToStudents.getOrDefault(e2.getId(), Collections.emptySet());

                    // Intersection of students taking both overlapping exams
                    Set<String> overlappingStudents = new HashSet<>(students1);
                    overlappingStudents.retainAll(students2);

                    if (!overlappingStudents.isEmpty()) {
                        String sampleUsns = String.join(", ", overlappingStudents.stream().limit(5).toList());
                        if (overlappingStudents.size() > 5) sampleUsns += "… (" + overlappingStudents.size() + " total)";

                        conflicts.add(new Conflict(
                            "Warning",
                            "TIMETABLE_CLASH",
                            e1.getId(),
                            e1.getName() + " & " + e2.getName(),
                            "Student Timetable Clash",
                            String.format("%d student(s) [%s] are registered for overlapping exams on %s (%s-%s vs %s-%s).",
                                overlappingStudents.size(), sampleUsns, e1.getDate(), e1.getStart(), e1.getEnd(), e2.getStart(), e2.getEnd()),
                            "Reschedule one of the examinations to a non-overlapping time slot or reassign elective candidates."
                        ));
                    }
                }
            }
        }

        // 3. Room Double-Booking across overlapping exams
        for (int i = 0; i < examinations.size(); i++) {
            Examination e1 = examinations.get(i);
            AllocationPlan p1 = seatingPlans.get(e1.getId());
            if (p1 == null) continue;

            Set<String> roomsInE1 = new HashSet<>();
            for (HallAllocation h : p1.getHalls()) roomsInE1.add(h.getClassroomId());

            for (int j = i + 1; j < examinations.size(); j++) {
                Examination e2 = examinations.get(j);
                AllocationPlan p2 = seatingPlans.get(e2.getId());
                if (p2 == null || !e1.overlapsWith(e2)) continue;

                for (HallAllocation h2 : p2.getHalls()) {
                    if (roomsInE1.contains(h2.getClassroomId())) {
                        conflicts.add(new Conflict(
                            "Error",
                            "ROOM_DOUBLE_BOOKING",
                            e1.getId(),
                            e1.getName() + " vs " + e2.getName(),
                            "Classroom Double-Booking Detected",
                            String.format("Hall '%s' (Room %s) is allocated to both '%s' and '%s' during overlapping time.",
                                h2.getName(), h2.getRoom(), e1.getName(), e2.getName()),
                            "Run 'Recalculate' or regenerate seating for one of the exams to select an alternative available room."
                        ));
                    }
                }
            }
        }

        // 4. Over-Capacity Checks per exam
        for (Examination ex : examinations) {
            Set<String> regUsns = examToStudents.getOrDefault(ex.getId(), Collections.emptySet());
            if (regUsns.size() > totalAvailableSeats) {
                conflicts.add(new Conflict(
                    "Error",
                    "OVER_CAPACITY",
                    ex.getId(),
                    ex.getName(),
                    "Campus Seating Capacity Exceeded",
                    String.format("%d students registered for '%s', but campus offers only %d total available seats.",
                        regUsns.size(), ex.getName(), totalAvailableSeats),
                    "Add more examination halls or adjust room schedules to split exam into multiple shifts."
                ));
            }
        }

        // 5. Unassigned students in generated plans
        for (Map.Entry<String, AllocationPlan> entry : seatingPlans.entrySet()) {
            AllocationPlan plan = entry.getValue();
            if (plan != null && !plan.getUnallocated().isEmpty()) {
                conflicts.add(new Conflict(
                    "Warning",
                    "UNASSIGNED_STUDENT",
                    plan.getExamId(),
                    plan.getExamName(),
                    "Unallocated Students Present",
                    String.format("%d student(s) could not be accommodated in plan for %s.",
                        plan.getUnallocated().size(), plan.getExamName()),
                    "Open Seating, mark inactive halls available or add more seats, then regenerate allocation."
                ));
            }
        }

        return conflicts;
    }
}
