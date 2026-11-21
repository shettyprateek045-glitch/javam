package com.examoptima.model;

import java.util.Objects;

public class Student {
    private String id;
    private String usn;
    private String name;
    private String department;
    private int semester;
    private String email;
    private String subject;

    public Student() {
    }

    public Student(String id, String usn, String name, String department, int semester, String email, String subject) {
        this.id = id;
        this.usn = usn != null ? usn.trim().toUpperCase() : "";
        this.name = name != null ? name.trim() : "";
        this.department = department != null ? department.trim() : "";
        this.semester = semester;
        this.email = email != null ? email.trim() : "";
        this.subject = subject != null ? subject.trim() : "";
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn != null ? usn.trim().toUpperCase() : ""; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getDepartment() { return department; }
    public void setDepartment(String department) { this.department = department; }

    public int getSemester() { return semester; }
    public void setSemester(int semester) { this.semester = semester; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getSubject() { return subject; }
    public void setSubject(String subject) { this.subject = subject; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Student student = (Student) o;
        return Objects.equals(usn, student.usn);
    }

    @Override
    public int hashCode() {
        return Objects.hash(usn);
    }

    @Override
    public String toString() {
        return name + " (" + usn + ") - " + department;
    }
}
