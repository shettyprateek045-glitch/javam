package com.examoptima.model;

import java.util.ArrayList;
import java.util.List;

public class HallAllocation {
    private String classroomId;
    private String name;
    private String room;
    private String building;
    private int capacity;
    private int rows;
    private int columns;
    private List<SeatAllocation> seats = new ArrayList<>();

    public HallAllocation() {
    }

    public HallAllocation(String classroomId, String name, String room, String building, int capacity, int rows, int columns) {
        this.classroomId = classroomId;
        this.name = name;
        this.room = room;
        this.building = building;
        this.capacity = capacity;
        this.rows = rows;
        this.columns = columns;
    }

    public String getClassroomId() { return classroomId; }
    public void setClassroomId(String classroomId) { this.classroomId = classroomId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public int getRows() { return rows; }
    public void setRows(int rows) { this.rows = rows; }

    public int getColumns() { return columns; }
    public void setColumns(int columns) { this.columns = columns; }

    public List<SeatAllocation> getSeats() { return seats; }
    public void setSeats(List<SeatAllocation> seats) { this.seats = seats != null ? seats : new ArrayList<>(); }
}
