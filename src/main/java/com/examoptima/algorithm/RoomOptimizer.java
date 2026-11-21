package com.examoptima.algorithm;

import com.examoptima.exception.InsufficientCapacityException;
import com.examoptima.model.Classroom;

import java.util.*;

/**
 * Advanced Java: Room Optimizer using PriorityQueue.
 * 
 * Orders rooms by available capacity (largest first) to minimize
 * the total number of examination halls used.
 */
public class RoomOptimizer {

    public static PriorityQueue<Classroom> createRoomPriorityQueue(List<Classroom> classrooms) {
        // Largest capacity room will be polled first
        PriorityQueue<Classroom> pq = new PriorityQueue<>(
            (r1, r2) -> Integer.compare(r2.getEffectiveAvailableSeats(), r1.getEffectiveAvailableSeats())
        );
        for (Classroom c : classrooms) {
            if (c.isAvailableForExam() && c.getEffectiveAvailableSeats() > 0) {
                pq.offer(c);
            }
        }
        return pq;
    }

    /**
     * Greedily selects the minimal number of largest rooms needed to seat 'studentCount' students.
     * Throws InsufficientCapacityException if all rooms combined cannot seat everyone.
     */
    public static List<Classroom> selectMinimalRooms(List<Classroom> allRooms, int studentCount)
            throws InsufficientCapacityException {
        PriorityQueue<Classroom> pq = createRoomPriorityQueue(allRooms);
        List<Classroom> selected = new ArrayList<>();
        int capacityAccumulator = 0;

        while (!pq.isEmpty() && capacityAccumulator < studentCount) {
            Classroom room = pq.poll();
            selected.add(room);
            capacityAccumulator += room.getEffectiveAvailableSeats();
        }

        if (capacityAccumulator < studentCount) {
            throw new InsufficientCapacityException(studentCount, capacityAccumulator);
        }

        return selected;
    }
}
