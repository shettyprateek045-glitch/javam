package com.examoptima.model;

import java.util.ArrayList;
import java.util.List;

public class RoomRecalculationResult {
    private String examId;
    private String affectedRoomId;
    private String affectedRoomName;
    private int affectedStudentsCount;
    private int reassignedCount;
    private int unallocatedCount;
    private List<MovedStudent> movedStudents = new ArrayList<>();
    private AllocationPlan updatedPlan;
    private String message;

    public RoomRecalculationResult() {
    }

    public RoomRecalculationResult(String examId, String affectedRoomId, String affectedRoomName) {
        this.examId = examId;
        this.affectedRoomId = affectedRoomId;
        this.affectedRoomName = affectedRoomName;
    }

    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }

    public String getAffectedRoomId() { return affectedRoomId; }
    public void setAffectedRoomId(String affectedRoomId) { this.affectedRoomId = affectedRoomId; }

    public String getAffectedRoomName() { return affectedRoomName; }
    public void setAffectedRoomName(String affectedRoomName) { this.affectedRoomName = affectedRoomName; }

    public int getAffectedStudentsCount() { return affectedStudentsCount; }
    public void setAffectedStudentsCount(int affectedStudentsCount) { this.affectedStudentsCount = affectedStudentsCount; }

    public int getReassignedCount() { return reassignedCount; }
    public void setReassignedCount(int reassignedCount) { this.reassignedCount = reassignedCount; }

    public int getUnallocatedCount() { return unallocatedCount; }
    public void setUnallocatedCount(int unallocatedCount) { this.unallocatedCount = unallocatedCount; }

    public List<MovedStudent> getMovedStudents() { return movedStudents; }
    public void setMovedStudents(List<MovedStudent> movedStudents) { this.movedStudents = movedStudents != null ? movedStudents : new ArrayList<>(); }

    public AllocationPlan getUpdatedPlan() { return updatedPlan; }
    public void setUpdatedPlan(AllocationPlan updatedPlan) { this.updatedPlan = updatedPlan; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
}
