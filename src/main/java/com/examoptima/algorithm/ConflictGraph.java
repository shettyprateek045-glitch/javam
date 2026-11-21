package com.examoptima.algorithm;

import com.examoptima.model.Student;

import java.util.*;

/**
 * Advanced Java: Conflict Graph representation.
 * Each student is a vertex. An edge joins two students who share:
 *  1. The same subject.
 *  2. Department-adjacent constraint (or same department).
 *  3. Same registration-number series / close roll numbers.
 */
public class ConflictGraph {
    private final Map<String, Student> students = new HashMap<>();
    private final Map<String, Set<String>> adjacencyList = new HashMap<>();

    public ConflictGraph() {
    }

    public void addStudent(Student student) {
        if (student == null || student.getUsn() == null) return;
        String usn = student.getUsn();
        students.put(usn, student);
        adjacencyList.putIfAbsent(usn, new HashSet<>());
    }

    public void addEdge(String usn1, String usn2) {
        if (usn1 == null || usn2 == null || usn1.equals(usn2)) return;
        if (!students.containsKey(usn1) || !students.containsKey(usn2)) return;

        adjacencyList.get(usn1).add(usn2);
        adjacencyList.get(usn2).add(usn1);
    }

    public boolean hasEdge(String usn1, String usn2) {
        Set<String> neighbors = adjacencyList.get(usn1);
        return neighbors != null && neighbors.contains(usn2);
    }

    public int getDegree(String usn) {
        Set<String> neighbors = adjacencyList.get(usn);
        return neighbors != null ? neighbors.size() : 0;
    }

    public Set<String> getNeighbors(String usn) {
        return adjacencyList.getOrDefault(usn, Collections.emptySet());
    }

    public Set<String> getAllUsns() {
        return students.keySet();
    }

    public Student getStudent(String usn) {
        return students.get(usn);
    }

    public int size() {
        return students.size();
    }

    /**
     * Constructs conflict edges across registered students.
     */
    public static ConflictGraph buildFrom(List<Student> studentList) {
        ConflictGraph graph = new ConflictGraph();
        for (Student s : studentList) {
            graph.addStudent(s);
        }

        // Compare all pairs and create conflict edges
        for (int i = 0; i < studentList.size(); i++) {
            Student s1 = studentList.get(i);
            for (int j = i + 1; j < studentList.size(); j++) {
                Student s2 = studentList.get(j);

                boolean conflict = false;

                // 1. Same subject
                if (s1.getSubject() != null && !s1.getSubject().isEmpty() &&
                    s1.getSubject().equalsIgnoreCase(s2.getSubject())) {
                    conflict = true;
                }

                // 2. Department adjacency / same department
                if (s1.getDepartment() != null && s1.getDepartment().equalsIgnoreCase(s2.getDepartment())) {
                    conflict = true;
                }

                // 3. Same USN series (e.g. 1RN26CS001 vs 1RN26CS002)
                if (isSameSeries(s1.getUsn(), s2.getUsn())) {
                    conflict = true;
                }

                if (conflict) {
                    graph.addEdge(s1.getUsn(), s2.getUsn());
                }
            }
        }

        return graph;
    }

    private static boolean isSameSeries(String usn1, String usn2) {
        if (usn1 == null || usn2 == null || usn1.length() < 5 || usn2.length() < 5) return false;
        String prefix1 = usn1.replaceAll("\\d+$", "");
        String prefix2 = usn2.replaceAll("\\d+$", "");
        if (!prefix1.equalsIgnoreCase(prefix2)) return false;

        // Check if numeric difference is close (<= 3)
        try {
            String numStr1 = usn1.substring(prefix1.length());
            String numStr2 = usn2.substring(prefix2.length());
            int n1 = Integer.parseInt(numStr1);
            int n2 = Integer.parseInt(numStr2);
            return Math.abs(n1 - n2) <= 3;
        } catch (NumberFormatException e) {
            return false;
        }
    }

    public Map<String, Object> toVisualizationData(Map<String, Integer> colorMap) {
        List<Map<String, Object>> nodes = new ArrayList<>();
        for (Map.Entry<String, Student> entry : students.entrySet()) {
            String usn = entry.getKey();
            Student s = entry.getValue();
            Map<String, Object> node = new HashMap<>();
            node.put("id", usn);
            node.put("name", s.getName());
            node.put("department", s.getDepartment());
            node.put("subject", s.getSubject());
            node.put("degree", getDegree(usn));
            node.put("colorGroup", colorMap != null ? colorMap.getOrDefault(usn, 0) : 0);
            nodes.add(node);
        }

        List<Map<String, String>> edges = new ArrayList<>();
        Set<String> seenEdges = new HashSet<>();
        for (Map.Entry<String, Set<String>> entry : adjacencyList.entrySet()) {
            String u = entry.getKey();
            for (String v : entry.getValue()) {
                String key = u.compareTo(v) < 0 ? u + "-" + v : v + "-" + u;
                if (!seenEdges.contains(key)) {
                    seenEdges.add(key);
                    Map<String, String> edge = new HashMap<>();
                    edge.put("source", u);
                    edge.put("target", v);
                    edges.add(edge);
                }
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("nodes", nodes);
        result.put("edges", edges);
        result.put("totalNodes", nodes.size());
        result.put("totalEdges", edges.size());
        return result;
    }
}
