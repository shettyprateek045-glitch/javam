package com.examoptima.algorithm;

import com.examoptima.model.Student;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

public class WelshPowellColoringTest {

    @Test
    @DisplayName("Welsh-Powell: Conflicting students must receive different color groups")
    public void testConflictingStudentsDifferentColors() {
        Student s1 = new Student("STU01", "1RN24CS001", "Alice", "CSE", 3, "alice@test.com", "Data Structures");
        Student s2 = new Student("STU02", "1RN24CS002", "Bob", "CSE", 3, "bob@test.com", "Data Structures"); // Same subject & dept
        Student s3 = new Student("STU03", "1RN24EC001", "Charlie", "ECE", 3, "charlie@test.com", "Signal Processing");
        Student s4 = new Student("STU04", "1RN24EE001", "David", "EEE", 3, "david@test.com", "Power Systems");

        ConflictGraph graph = ConflictGraph.buildFrom(List.of(s1, s2, s3, s4));
        Map<String, Integer> colorMap = WelshPowellColoring.colorGraph(graph);

        assertEquals(4, colorMap.size());

        // s1 and s2 conflict heavily (same subject, same dept, close USN)
        assertTrue(graph.hasEdge(s1.getUsn(), s2.getUsn()));
        assertNotEquals(colorMap.get(s1.getUsn()), colorMap.get(s2.getUsn()),
            "Conflicting students s1 and s2 must have different colors");
    }

    @Test
    @DisplayName("Welsh-Powell: Independent non-conflicting students can share the same color group")
    public void testIndependentStudentsShareColor() {
        Student s1 = new Student("STU01", "1RN24CS001", "Alice", "CSE", 3, "alice@test.com", "Algorithms");
        Student s2 = new Student("STU02", "1RN24EC050", "Bob", "ECE", 3, "bob@test.com", "Signals");
        Student s3 = new Student("STU03", "1RN24EE080", "Charlie", "EEE", 3, "charlie@test.com", "Power");

        ConflictGraph graph = new ConflictGraph();
        graph.addStudent(s1);
        graph.addStudent(s2);
        graph.addStudent(s3);
        // No edges added -> completely independent

        Map<String, Integer> colorMap = WelshPowellColoring.colorGraph(graph);
        assertEquals(3, colorMap.size());

        // All can share Color 1 since there are no conflicts
        assertEquals(1, (int) colorMap.get(s1.getUsn()));
        assertEquals(1, (int) colorMap.get(s2.getUsn()));
        assertEquals(1, (int) colorMap.get(s3.getUsn()));
    }
}
