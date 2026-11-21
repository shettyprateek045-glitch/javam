package com.examoptima.model;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

public class Classroom implements Comparable<Classroom> {
    private String id;
    private String name;
    private String room;
    private String building;
    private int capacity;
    private int available;
    private int rows;
    private int columns;
    private List<Integer> blocked = new ArrayList<>();
    private boolean availableForExam = true;

    public Classroom() {
    }

    public Classroom(String id, String name, String room, String building, int capacity, int available) {
        this.id = id;
        this.name = name;
        this.room = room;
        this.building = building;
        this.capacity = capacity;
        this.available = available;
        this.columns = (int) Math.ceil(Math.sqrt(capacity));
        this.rows = (int) Math.ceil((double) capacity / (this.columns > 0 ? this.columns : 1));
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getRoom() { return room; }
    public void setRoom(String room) { this.room = room; }

    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public int getAvailable() { return available; }
    public void setAvailable(int available) { this.available = available; }

    public int getRows() { return rows; }
    public void setRows(int rows) { this.rows = rows; }

    public int getColumns() { return columns; }
    public void setColumns(int columns) { this.columns = columns; }

    public List<Integer> getBlocked() { return blocked; }
    public void setBlocked(List<Integer> blocked) { this.blocked = blocked != null ? blocked : new ArrayList<>(); }

    public boolean isAvailableForExam() { return availableForExam; }
    public void setAvailableForExam(boolean availableForExam) { this.availableForExam = availableForExam; }

    public int getEffectiveAvailableSeats() {
        if (!availableForExam) return 0;
        int usable = Math.min(capacity, available);
        if (blocked != null && !blocked.isEmpty()) {
            usable = Math.max(0, capacity - blocked.size());
        }
        return usable;
    }

    @Override
    public int compareTo(Classroom other) {
        // PriorityQueue order: largest available capacity first
        return Integer.compare(other.getEffectiveAvailableSeats(), this.getEffectiveAvailableSeats());
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Classroom classroom = (Classroom) o;
        return Objects.equals(id, classroom.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return name + " (" + room + ", " + building + ") - Cap: " + capacity + ", Avail: " + available;
    }
}
