package com.examoptima.model;

public class SeatAllocation {
    private String classroomId;
    private String roomName;
    private String roomNumber;
    private String building;
    private int seat;             // 1-based seat number
    private int row;
    private int col;
    private String usn;
    private String name;
    private String department;
    private String subject;
    private int colorGroup;

    public SeatAllocation() {
    }

    public SeatAllocation(String classroomId, String roomName, String roomNumber, String building,
                          int seat, int row, int col,
                          String usn, String name, String department, String subject, int colorGroup) {
        this.classroomId = classroomId;
        this.roomName = roomName;
        this.roomNumber = roomNumber;
        this.building = building;
        this.seat = seat;
        this.row = row;
        this.col = col;
        this.usn = usn;
        this.name = name;
        this.department = department;
        this.subject = subject;
        this.colorGroup = colorGroup;
    }

    public String getClassroomId() { return classroomId; }
    public void setClassroomId(String classroomId) { this.classroomId = classroomId; }

    public String getRoomName() { return roomName; }
    public void setRoomName(String roomName) { this.roomName = roomName; }

    public String getRoomNumber() { return roomNumber; }
    public void setRoomNumber(String roomNumber) { this.roomNumber = roomNumber; }

    public String getBuilding() { return building; }
    public void setBuilding(String building) { this.building = building; }

    public int getSeat() { return seat; }
    public void setSeat(int seat) { this.seat = seat; }

    public int getRow() { return row; }
    public void setRow(int row) { this.row = row; }

    public int getCol() { return col; }
    public void setCol(int col) { this.col = col; }

    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    public int getColorGroup() { return colorGroup; }
    public void setColorGroup(int colorGroup) { this.colorGroup = colorGroup; }
}
