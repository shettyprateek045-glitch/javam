package com.examoptima.model;

public class MovedStudent {
    private String usn;
    private String name;
    private String department;
    private String oldRoom;
    private int oldSeat;
    private String newRoom;
    private int newSeat;

    public MovedStudent() {
    }

    public MovedStudent(String usn, String name, String department, String oldRoom, int oldSeat, String newRoom, int newSeat) {
        this.usn = usn;
        this.name = name;
        this.department = department;
        this.oldRoom = oldRoom;
        this.oldSeat = oldSeat;
        this.newRoom = newRoom;
        this.newSeat = newSeat;
    }

    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getOldRoom() { return oldRoom; }
    public void setOldRoom(String oldRoom) { this.oldRoom = oldRoom; }

    public int getOldSeat() { return oldSeat; }
    public void setOldSeat(int oldSeat) { this.oldSeat = oldSeat; }

    public String getNewRoom() { return newRoom; }
    public void setNewRoom(String newRoom) { this.newRoom = newRoom; }

    public int getNewSeat() { return newSeat; }
    public void setNewSeat(int newSeat) { this.newSeat = newSeat; }
}
