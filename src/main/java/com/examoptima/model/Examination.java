package com.examoptima.model;

import java.util.Objects;

public class Examination {
    private String id;
    private String name;
    private String subjectName;
    private String subjectCode;
    private String date;      // YYYY-MM-DD
    private String start;     // HH:MM (24-hour)
    private String end;       // HH:MM (24-hour)
    private int duration;     // minutes

    public Examination() {
    }

    public Examination(String id, String name, String subjectName, String subjectCode, String date, String start, String end) {
        this.id = id;
        this.name = name;
        this.subjectName = subjectName;
        this.subjectCode = subjectCode;
        this.date = date;
        this.start = start;
        this.end = end;
        this.duration = calculateDuration(start, end);
    }

    public static int calculateDuration(String start, String end) {
        if (start == null || end == null) return 0;
        try {
            String[] s = start.split(":");
            String[] e = end.split(":");
            int sMin = Integer.parseInt(s[0]) * 60 + Integer.parseInt(s[1]);
            int eMin = Integer.parseInt(e[0]) * 60 + Integer.parseInt(e[1]);
            return Math.max(0, eMin - sMin);
        } catch (Exception ex) {
            return 0;
        }
    }

    public boolean overlapsWith(Examination other) {
        if (other == null || !Objects.equals(this.date, other.date)) return false;
        try {
            String[] s1 = this.start.split(":");
            String[] e1 = this.end.split(":");
            String[] s2 = other.start.split(":");
            String[] e2 = other.end.split(":");
            int start1 = Integer.parseInt(s1[0]) * 60 + Integer.parseInt(s1[1]);
            int end1 = Integer.parseInt(e1[0]) * 60 + Integer.parseInt(e1[1]);
            int start2 = Integer.parseInt(s2[0]) * 60 + Integer.parseInt(s2[1]);
            int end2 = Integer.parseInt(e2[0]) * 60 + Integer.parseInt(e2[1]);
            return Math.max(start1, start2) < Math.min(end1, end2);
        } catch (Exception ex) {
            return false;
        }
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public String getSubjectCode() { return subjectCode; }
    public void setSubjectCode(String subjectCode) { this.subjectCode = subjectCode; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public String getStart() { return start; }
    public void setStart(String start) { 
        this.start = start; 
        this.duration = calculateDuration(start, this.end);
    }

    public String getEnd() { return end; }
    public void setEnd(String end) { 
        this.end = end; 
        this.duration = calculateDuration(this.start, end);
    }

    public int getDuration() { return duration; }
    public void setDuration(int duration) { this.duration = duration; }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Examination that = (Examination) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return name + " (" + subjectCode + ") on " + date + " " + start + "-" + end;
    }
}
