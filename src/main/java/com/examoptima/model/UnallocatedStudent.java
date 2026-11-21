package com.examoptima.model;

public class UnallocatedStudent {
    private String usn;
    private String name;
    private String department;
    private String reason;

    public UnallocatedStudent() {
    }

    public UnallocatedStudent(String usn, String name, String department, String reason) {
        this.usn = usn;
        this.name = name;
        this.department = department;
        this.reason = reason;
    }

    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }
}
