package com.examoptima.algorithm;

import java.util.*;

/**
 * Advanced Java: Welsh-Powell Greedy Graph Coloring Algorithm.
 * 
 * Steps:
 *  1. Sort all vertices in descending order of their degree.
 *  2. For the first uncolored vertex, assign a new color/group.
 *  3. Scan remaining uncolored vertices; assign the same color to any vertex
 *     that is NOT adjacent to ANY vertex already assigned that color.
 *  4. Repeat until all vertices have been assigned a color group.
 * 
 * Result:
 *  Returns a Map of Student USN -> Color Group ID.
 *  Guarantees that vertices with an edge (conflicts) never share the same color.
 */
public class WelshPowellColoring {

    public static Map<String, Integer> colorGraph(ConflictGraph graph) {
        if (graph == null || graph.size() == 0) {
            return Collections.emptyMap();
        }

        // 1. Order vertices by degree in descending order
        List<String> orderedVertices = new ArrayList<>(graph.getAllUsns());
        orderedVertices.sort((u1, u2) -> {
            int degCompare = Integer.compare(graph.getDegree(u2), graph.getDegree(u1));
            if (degCompare != 0) return degCompare;
            return u1.compareTo(u2); // Stable secondary order
        });

        Map<String, Integer> colorAssignment = new HashMap<>();
        Set<String> uncolored = new HashSet<>(orderedVertices);
        int currentColor = 1;

        // 2 & 3. Color assignment loop
        while (!uncolored.isEmpty()) {
            Set<String> currentGroupMembers = new HashSet<>();

            for (String vertex : orderedVertices) {
                if (uncolored.contains(vertex)) {
                    // Check if 'vertex' is adjacent to any vertex already colored with 'currentColor'
                    boolean hasConflict = false;
                    for (String member : currentGroupMembers) {
                        if (graph.hasEdge(vertex, member)) {
                            hasConflict = true;
                            break;
                        }
                    }

                    if (!hasConflict) {
                        colorAssignment.put(vertex, currentColor);
                        currentGroupMembers.add(vertex);
                        uncolored.remove(vertex);
                    }
                }
            }

            currentColor++;
        }

        return colorAssignment;
    }

    /**
     * Groups students by their assigned color group.
     */
    public static Map<Integer, List<String>> groupColors(Map<String, Integer> colorMap) {
        Map<Integer, List<String>> groups = new TreeMap<>();
        for (Map.Entry<String, Integer> entry : colorMap.entrySet()) {
            groups.computeIfAbsent(entry.getValue(), k -> new ArrayList<>()).add(entry.getKey());
        }
        return groups;
    }
}
