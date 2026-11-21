package com.examoptima.model;

public class Conflict {
    private String severity; // Error, Warning, Info
    private String category; // TIMETABLE_CLASH, ROOM_DOUBLE_BOOKING, OVER_CAPACITY, DUPLICATE_REGISTRATION, UNASSIGNED_STUDENT
    private String examId;
    private String examName;
    private String title;
    private String detail;
    private String fixSuggestion;

    public Conflict() {
    }

    public Conflict(String severity, String category, String examId, String examName, String title, String detail, String fixSuggestion) {
        this.severity = severity;
        this.category = category;
        this.examId = examId;
        this.examName = examName;
        this.title = title;
        this.detail = detail;
        this.fixSuggestion = fixSuggestion;
    }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getExamId() { return examId; }
    public void setExamId(String examId) { this.examId = examId; }

    public String getExamName() { return examName; }
    public void setExamName(String examName) { this.examName = examName; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDetail() { return detail; }
    public void setDetail(String detail) { this.detail = detail; }

    public String getFixSuggestion() { return fixSuggestion; }
    public void setFixSuggestion(String fixSuggestion) { this.fixSuggestion = fixSuggestion; }
}
