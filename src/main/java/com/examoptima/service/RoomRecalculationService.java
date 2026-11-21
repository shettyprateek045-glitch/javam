package com.examoptima.service;

import com.examoptima.algorithm.BacktrackingSeatingPlacer;
import com.examoptima.algorithm.RoomOptimizer;
import com.examoptima.algorithm.WelshPowellColoring;
import com.examoptima.exception.RoomUnavailableException;
import com.examoptima.model.*;

import java.util.*;

/**
 * Advanced Java: Room Recalculation Service.
 * 
 * Handles the "Mark room unavailable" flow:
 *  1. Identifies students seated in the disabled room.
 *  2. Preserves all other student seats unchanged across non-affected halls.
 *  3. Reassigns ONLY the displaced students to vacant seats in existing halls
 *     or brings in an additional optimal hall via PriorityQueue.
 *  4. Generates a list of MovedStudent records and before/after comparison metrics.
 */
public class RoomRecalculationService {

    public static RoomRecalculationResult recalculateForUnavailableRoom(
            String affectedRoomId,
            AllocationPlan currentPlan,
            List<Student> allStudents,
            List<Classroom> allClassrooms) throws RoomUnavailableException {

        if (currentPlan == null) {
            throw new RoomUnavailableException(affectedRoomId, "No active seating plan found to recalculate.");
        }

        Map<String, Student> studentMap = new HashMap<>();
        for (Student s : allStudents) {
            studentMap.put(s.getUsn().toUpperCase(), s);
        }

        Map<String, Classroom> classroomMap = new HashMap<>();
        for (Classroom c : allClassrooms) {
            classroomMap.put(c.getId(), c);
        }

        Classroom affectedClassroom = classroomMap.get(affectedRoomId);
        String affectedRoomName = affectedClassroom != null ? affectedClassroom.getName() : affectedRoomId;

        // 1. Separate affected hall from untouched halls
        HallAllocation affectedHall = null;
        List<HallAllocation> survivingHalls = new ArrayList<>();

        for (HallAllocation hall : currentPlan.getHalls()) {
            if (hall.getClassroomId().equals(affectedRoomId)) {
                affectedHall = hall;
            } else {
                survivingHalls.add(hall);
            }
        }

        if (affectedHall == null) {
            throw new RoomUnavailableException(affectedRoomId, "Room is not part of current examination allocation.");
        }

        List<SeatAllocation> displacedSeats = affectedHall.getSeats();
        List<Student> displacedStudents = new ArrayList<>();
        Map<String, SeatAllocation> oldSeatMap = new HashMap<>();

        for (SeatAllocation seat : displacedSeats) {
            Student s = studentMap.get(seat.getUsn().toUpperCase());
            if (s != null) {
                displacedStudents.add(s);
                oldSeatMap.put(s.getUsn().toUpperCase(), seat);
            }
        }

        RoomRecalculationResult result = new RoomRecalculationResult(
            currentPlan.getExamId(),
            affectedRoomId,
            affectedRoomName
        );
        result.setAffectedStudentsCount(displacedStudents.size());

        List<MovedStudent> movedList = new ArrayList<>();

        // 2. Try placing displaced students into vacant spots of surviving halls
        List<Student> stillUnplaced = new ArrayList<>(displacedStudents);
        for (HallAllocation hall : survivingHalls) {
            Classroom c = classroomMap.get(hall.getClassroomId());
            if (c == null) continue;

            Set<Integer> occupiedSeats = new HashSet<>();
            for (SeatAllocation sa : hall.getSeats()) {
                occupiedSeats.add(sa.getSeat());
            }

            Set<Integer> blocked = new HashSet<>(c.getBlocked());
            int cols = hall.getColumns() > 0 ? hall.getColumns() : Math.max(1, (int) Math.ceil(Math.sqrt(hall.getCapacity())));
            int maxCap = hall.getCapacity();

            // Find vacant usable seats in this hall
            List<Integer> vacantSeatNumbers = new ArrayList<>();
            for (int sn = 1; sn <= maxCap; sn++) {
                if (!occupiedSeats.contains(sn) && !blocked.contains(sn)) {
                    vacantSeatNumbers.add(sn);
                }
            }

            Iterator<Student> it = stillUnplaced.iterator();
            while (it.hasNext() && !vacantSeatNumbers.isEmpty()) {
                Student s = it.next();
                int newSeatNum = vacantSeatNumbers.remove(0);
                int r = (newSeatNum - 1) / cols;
                int col = (newSeatNum - 1) % cols;

                SeatAllocation newAlloc = new SeatAllocation(
                    hall.getClassroomId(),
                    hall.getName(),
                    hall.getRoom(),
                    hall.getBuilding(),
                    newSeatNum,
                    r + 1,
                    col + 1,
                    s.getUsn(),
                    s.getName(),
                    s.getDepartment(),
                    s.getSubject(),
                    1
                );
                hall.getSeats().add(newAlloc);

                SeatAllocation oldAlloc = oldSeatMap.get(s.getUsn().toUpperCase());
                movedList.add(new MovedStudent(
                    s.getUsn(),
                    s.getName(),
                    s.getDepartment(),
                    oldAlloc != null ? oldAlloc.getRoomName() : affectedRoomName,
                    oldAlloc != null ? oldAlloc.getSeat() : 0,
                    hall.getName(),
                    newSeatNum
                ));

                it.remove();
            }
        }

        // 3. If there are still displaced students, bring in an additional classroom
        if (!stillUnplaced.isEmpty()) {
            Set<String> currentlyUsedRooms = new HashSet<>();
            for (HallAllocation h : survivingHalls) currentlyUsedRooms.add(h.getClassroomId());
            currentlyUsedRooms.add(affectedRoomId);

            List<Classroom> candidateRooms = new ArrayList<>();
            for (Classroom c : allClassrooms) {
                if (!currentlyUsedRooms.contains(c.getId()) && c.isAvailableForExam() && c.getEffectiveAvailableSeats() > 0) {
                    candidateRooms.add(c);
                }
            }

            PriorityQueue<Classroom> pq = RoomOptimizer.createRoomPriorityQueue(candidateRooms);
            while (!pq.isEmpty() && !stillUnplaced.isEmpty()) {
                Classroom fallbackRoom = pq.poll();
                int countToTake = Math.min(stillUnplaced.size(), fallbackRoom.getEffectiveAvailableSeats());
                List<Student> slice = new ArrayList<>(stillUnplaced.subList(0, countToTake));
                stillUnplaced = new ArrayList<>(stillUnplaced.subList(countToTake, stillUnplaced.size()));

                BacktrackingSeatingPlacer.PlacementResult placement =
                    BacktrackingSeatingPlacer.placeStudentsInRoom(fallbackRoom, slice, Collections.emptyMap());

                HallAllocation newHall = new HallAllocation(
                    fallbackRoom.getId(),
                    fallbackRoom.getName(),
                    fallbackRoom.getRoom(),
                    fallbackRoom.getBuilding(),
                    fallbackRoom.getCapacity(),
                    fallbackRoom.getRows(),
                    fallbackRoom.getColumns()
                );
                newHall.setSeats(placement.getAllocations());
                survivingHalls.add(newHall);

                for (SeatAllocation sa : placement.getAllocations()) {
                    SeatAllocation oldAlloc = oldSeatMap.get(sa.getUsn().toUpperCase());
                    movedList.add(new MovedStudent(
                        sa.getUsn(),
                        sa.getName(),
                        sa.getDepartment(),
                        oldAlloc != null ? oldAlloc.getRoomName() : affectedRoomName,
                        oldAlloc != null ? oldAlloc.getSeat() : 0,
                        newHall.getName(),
                        sa.getSeat()
                    ));
                }
            }
        }

        // 4. Update the plan
        List<UnallocatedStudent> updatedUnallocated = new ArrayList<>(currentPlan.getUnallocated());
        for (Student unplaced : stillUnplaced) {
            updatedUnallocated.add(new UnallocatedStudent(
                unplaced.getUsn(),
                unplaced.getName(),
                unplaced.getDepartment(),
                "Displaced by room " + affectedRoomName + " closure; no alternative seats available"
            ));
        }

        int totalSeated = 0;
        int totalCap = 0;
        for (HallAllocation h : survivingHalls) {
            totalSeated += h.getSeats().size();
            totalCap += h.getCapacity();
        }

        AllocationPlan updatedPlan = new AllocationPlan(
            currentPlan.getExamId(),
            currentPlan.getExamName(),
            currentPlan.getSubjectCode()
        );
        updatedPlan.setAllocationTimeMs(currentPlan.getAllocationTimeMs());
        updatedPlan.setTotalRegistered(currentPlan.getTotalRegistered());
        updatedPlan.setTotalSeated(totalSeated);
        updatedPlan.setUnallocatedCount(updatedUnallocated.size());
        updatedPlan.setRoomsUsed(survivingHalls.size());
        updatedPlan.setSeatUtilizationPct(totalCap > 0 ? Math.round(((double) totalSeated / totalCap) * 1000.0) / 10.0 : 0);
        updatedPlan.setHalls(survivingHalls);
        updatedPlan.setUnallocated(updatedUnallocated);

        result.setReassignedCount(movedList.size());
        result.setUnallocatedCount(stillUnplaced.size());
        result.setMovedStudents(movedList);
        result.setUpdatedPlan(updatedPlan);
        result.setMessage(String.format("Successfully recalculated: %d of %d displaced students reassigned. Other hall seats preserved.",
            movedList.size(), displacedStudents.size()));

        return result;
    }
}
