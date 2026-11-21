package com.examoptima.algorithm;

import com.examoptima.exception.InsufficientCapacityException;
import com.examoptima.model.Classroom;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.PriorityQueue;

import static org.junit.jupiter.api.Assertions.*;

public class RoomOptimizerTest {

    @Test
    @DisplayName("PriorityQueue: Polls classrooms in descending order of capacity to minimize room count")
    public void testPriorityQueueOrdersLargestFirst() {
        Classroom small = new Classroom("CR01", "Small", "101", "A", 30, 30);
        Classroom medium = new Classroom("CR02", "Medium", "102", "A", 60, 60);
        Classroom large = new Classroom("CR03", "Large", "103", "A", 120, 120);

        PriorityQueue<Classroom> pq = RoomOptimizer.createRoomPriorityQueue(List.of(small, medium, large));

        assertEquals("Large", pq.poll().getName());
        assertEquals("Medium", pq.poll().getName());
        assertEquals("Small", pq.poll().getName());
    }

    @Test
    @DisplayName("RoomOptimizer: Selects minimal rooms needed to accommodate candidates")
    public void testSelectMinimalRooms() throws Exception {
        Classroom c1 = new Classroom("CR01", "Hall 120", "101", "A", 120, 120);
        Classroom c2 = new Classroom("CR02", "Hall 80", "102", "A", 80, 80);
        Classroom c3 = new Classroom("CR03", "Hall 30", "103", "A", 30, 30);

        // For 75 students, 1 room of capacity 120 is sufficient!
        List<Classroom> selected = RoomOptimizer.selectMinimalRooms(List.of(c1, c2, c3), 75);
        assertEquals(1, selected.size());
        assertEquals("Hall 120", selected.get(0).getName());

        // For 150 students, Hall 120 + Hall 80 (total 200) should be selected (2 rooms)
        List<Classroom> selected2 = RoomOptimizer.selectMinimalRooms(List.of(c1, c2, c3), 150);
        assertEquals(2, selected2.size());
        assertEquals("Hall 120", selected2.get(0).getName());
        assertEquals("Hall 80", selected2.get(1).getName());
    }

    @Test
    @DisplayName("RoomOptimizer: Throws InsufficientCapacityException when student count exceeds total seats")
    public void testInsufficientCapacityException() {
        Classroom c1 = new Classroom("CR01", "Hall 30", "101", "A", 30, 30);
        Classroom c2 = new Classroom("CR02", "Hall 40", "102", "A", 40, 40);

        assertThrows(InsufficientCapacityException.class, () -> {
            RoomOptimizer.selectMinimalRooms(List.of(c1, c2), 100);
        });
    }
}
