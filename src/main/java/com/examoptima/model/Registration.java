package com.examoptima.model;

import java.util.Objects;

public class Registration {
    private String examId;
    private String usn;

    public Registration() {
    }

    public Registration(String examId, String usn) {
        this.examId = examId;
        this.usn = usn != null ? usn.trim().toUpperCase() : "";
    }

    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }

    public String getUsn() { return usn; }
    public void setUsn(String usn) { this.usn = usn != null ? usn.trim().toUpperCase() : ""; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Registration that = (Registration) o;
        return Objects.equals(examId, that.examId) && Objects.equals(usn, that.usn);
    }

    @Override
    public int hashCode() {
        return Objects.hash(examId, usn);
    }

    @Override
    public String toString() {
        return examId + " -> " + usn;
    }
}
