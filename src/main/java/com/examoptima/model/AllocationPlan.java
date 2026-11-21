package com.examoptima.model;

import java.util.ArrayList;
import java.util.List;

public class AllocationPlan {
    private String examId;
    private String examName;
    private String subjectCode;
    private long allocationTimeMs;
    private double seatUtilizationPct;
    private int totalRegistered;
    private int totalSeated;
    private int unallocatedCount;
    private int roomsUsed;
    private int sameDeptNeighbors;
    private boolean optimal;
    private List<HallAllocation> halls = new ArrayList<>();
    private List<UnallocatedStudent> unallocated = new ArrayList<>();

    public AllocationPlan() {
    }

    public AllocationPlan(String examId, String examName, String subjectCode) {
        this.examId = examId;
        this.examName = examName;
        this.subjectCode = subjectCode;
    }

    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }

    public String getExamName() { return examName; }
    public void setExamName(String examName) { this.examName = examName; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public long getAllocationTimeMs() { return allocationTimeMs; }
    public void setAllocationTimeMs(long allocationTimeMs) { this.allocationTimeMs = allocationTimeMs; }

    public double getSeatUtilizationPct() { return seatUtilizationPct; }
    public void setSeatUtilizationPct(double seatUtilizationPct) { this.seatUtilizationPct = seatUtilizationPct; }

    public int getTotalRegistered() { return totalRegistered; }
    public void setTotalRegistered(int totalRegistered) { this.totalRegistered = totalRegistered; }

    public int getTotalSeated() { return totalSeated; }
    public void setTotalSeated(int totalSeated) { this.totalSeated = totalSeated; }

    public int getUnallocatedCount() { return unallocatedCount; }
    public void setUnallocatedCount(int unallocatedCount) { this.unallocatedCount = unallocatedCount; }

    public int getRoomsUsed() { return roomsUsed; }
    public void setRoomsUsed(int roomsUsed) { this.roomsUsed = roomsUsed; }

    public int getSameDeptNeighbors() { return sameDeptNeighbors; }
    public void setSameDeptNeighbors(int sameDeptNeighbors) { this.sameDeptNeighbors = sameDeptNeighbors; }

    public boolean isOptimal() { return optimal; }
    public void setOptimal(boolean optimal) { this.optimal = optimal; }

    public List<HallAllocation> getHalls() { return halls; }
    public void setHalls(List<HallAllocation> halls) { this.halls = halls != null ? halls : new ArrayList<>(); }

    public List<UnallocatedStudent> getUnallocated() { return unallocated; }
    public void setUnallocated(List<UnallocatedStudent> unallocated) { this.unallocated = unallocated != null ? unallocated : new ArrayList<>(); }
}
