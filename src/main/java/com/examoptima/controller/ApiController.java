package com.examoptima.controller;

import com.examoptima.algorithm.ConflictGraph;
import com.examoptima.algorithm.WelshPowellColoring;
import com.examoptima.model.*;
import com.examoptima.service.*;
import com.examoptima.util.JsonUtil;

import java.io.IOException;
import java.io.OutputStream;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Advanced Java: REST API Controller & In-Memory / Supabase Data Store.
 */
public class ApiController {

    private final List<Student> students = Collections.synchronizedList(new ArrayList<>());
    private final List<Classroom> classrooms = Collections.synchronizedList(new ArrayList<>());
    private final List<Examination> examinations = Collections.synchronizedList(new ArrayList<>());
    private final List<Registration> registrations = Collections.synchronizedList(new ArrayList<>());
    private final Map<String, AllocationPlan> seatingPlans = new ConcurrentHashMap<>();

    private final SeatingAllocationService allocationService = new SeatingAllocationService();
    private final SupabaseService supabaseService = new SupabaseService();

    public ApiController() {
        // Initialize with default seed data
        loadSeedData();
    }

    public synchronized void loadSeedData() {
        SeedDataService.SeedPayload seed = SeedDataService.generateDemoData();
        students.clear();
        students.addAll(seed.students);
        classrooms.clear();
        classrooms.addAll(seed.classrooms);
        examinations.clear();
        examinations.addAll(seed.examinations);
        registrations.clear();
        registrations.addAll(seed.registrations);
        seatingPlans.clear();

        // Pre-allocate EX001 & EX002 to immediately demonstrate 3D seating visuals
        try {
            if (!examinations.isEmpty()) {
                AllocationPlan plan1 = allocationService.executeAllocationPipeline(
                    examinations.get(0), students, classrooms, registrations, null
                );
                seatingPlans.put(examinations.get(0).getId(), plan1);
            }
        } catch (Exception ignored) {
        }
    }

    public String handleGetHealth() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("status", "UP");
        map.put("service", "ExamOptima Advanced Java REST Engine");
        map.put("version", "2.0.0");
        map.put("javaVersion", System.getProperty("java.version"));
        map.put("studentsCount", students.size());
        map.put("classroomsCount", classrooms.size());
        map.put("examinationsCount", examinations.size());
        map.put("plansGenerated", seatingPlans.size());
        map.put("supabaseConfigured", supabaseService.isConfigured());
        map.put("supabaseMode", supabaseService.isConfigured() ? "CONNECTED" : "LOCAL_FALLBACK");
        return JsonUtil.toJson(map);
    }

    public String handleSeedData() {
        loadSeedData();
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("success", true);
        map.put("message", "Loaded 220 students, 6 classrooms, 5 exams, and pre-allocated seating.");
        map.put("studentsCount", students.size());
        map.put("classroomsCount", classrooms.size());
        map.put("examinationsCount", examinations.size());
        map.put("registrationsCount", registrations.size());
        return JsonUtil.toJson(map);
    }

    public String handleGetStudents() {
        return JsonUtil.toJson(students);
    }

    public String handleGetClassrooms() {
        return JsonUtil.toJson(classrooms);
    }

    public String handleGetExaminations() {
        return JsonUtil.toJson(examinations);
    }

    public String handleGetRegistrations() {
        return JsonUtil.toJson(registrations);
    }

    public String handleGetSeatingPlans() {
        return JsonUtil.toJson(seatingPlans);
    }

    public String handleGetSeatingPlan(String examId) {
        AllocationPlan plan = seatingPlans.get(examId);
        if (plan != null) return JsonUtil.toJson(plan);
        return "{\"error\":\"No seating plan found for exam " + examId + "\"}";
    }

    public String handlePostAllocate(String examId, boolean async) {
        Examination targetExam = null;
        for (Examination e : examinations) {
            if (e.getId().equalsIgnoreCase(examId)) {
                targetExam = e;
                break;
            }
        }
        if (targetExam == null) {
            return "{\"error\":\"Examination not found: " + examId + "\"}";
        }

        if (async) {
            String taskId = allocationService.submitAllocation(targetExam, students, classrooms, registrations);
            return "{\"success\":true,\"async\":true,\"taskId\":\"" + taskId + "\"}";
        } else {
            try {
                AllocationPlan plan = allocationService.executeAllocationPipeline(
                    targetExam, students, classrooms, registrations, null
                );
                seatingPlans.put(targetExam.getId(), plan);
                return JsonUtil.toJson(plan);
            } catch (Exception e) {
                return "{\"error\":\"" + e.getMessage() + "\"}";
            }
        }
    }

    public String handleGetTaskStatus(String taskId) {
        SeatingAllocationService.AllocationTaskStatus status = allocationService.getTaskStatus(taskId);
        if (status == null) {
            return "{\"error\":\"Task not found: " + taskId + "\"}";
        }
        if ("COMPLETED".equals(status.getStatus()) && status.getResult() != null) {
            seatingPlans.put(status.getExamId(), status.getResult());
        }
        Map<String, Object> res = new LinkedHashMap<>();
        res.put("taskId", status.getTaskId());
        res.put("examId", status.getExamId());
        res.put("status", status.getStatus());
        res.put("progress", status.getProgress());
        res.put("message", status.getMessage());
        if (status.getResult() != null) {
            res.put("result", status.getResult());
        }
        return JsonUtil.toJson(res);
    }

    public String handleCancelTask(String taskId) {
        boolean cancelled = allocationService.cancelTask(taskId);
        return "{\"success\":" + cancelled + "}";
    }

    public String handleMarkRoomUnavailable(String roomId, String examId) {
        Classroom target = null;
        for (Classroom c : classrooms) {
            if (c.getId().equalsIgnoreCase(roomId)) {
                target = c;
                c.setAvailableForExam(false);
                break;
            }
        }
        if (target == null) {
            return "{\"error\":\"Classroom not found: " + roomId + "\"}";
        }

        AllocationPlan plan = seatingPlans.get(examId);
        if (plan == null && !seatingPlans.isEmpty()) {
            plan = seatingPlans.values().iterator().next();
        }

        if (plan == null) {
            return "{\"success\":true,\"message\":\"Room marked unavailable, but no active seating plan found to recalculate.\"}";
        }

        try {
            RoomRecalculationResult result = RoomRecalculationService.recalculateForUnavailableRoom(
                roomId, plan, students, classrooms
            );
            seatingPlans.put(plan.getExamId(), result.getUpdatedPlan());
            return JsonUtil.toJson(result);
        } catch (Exception e) {
            return "{\"error\":\"" + e.getMessage() + "\"}";
        }
    }

    public String handleGetConflicts() {
        List<Conflict> conflicts = ConflictDetectionService.detectConflicts(
            students, classrooms, examinations, registrations, seatingPlans
        );
        return JsonUtil.toJson(conflicts);
    }

    public String handleGetConflictGraph(String examId) {
        // Collect students registered for this exam
        Set<String> regUsns = new HashSet<>();
        for (Registration r : registrations) {
            if (examId == null || examId.isEmpty() || r.getExamId().equalsIgnoreCase(examId)) {
                regUsns.add(r.getUsn().toUpperCase());
            }
        }

        List<Student> examStudents = new ArrayList<>();
        for (Student s : students) {
            if (regUsns.contains(s.getUsn().toUpperCase())) {
                examStudents.add(s);
            }
        }

        ConflictGraph graph = ConflictGraph.buildFrom(examStudents);
        Map<String, Integer> colorMap = WelshPowellColoring.colorGraph(graph);
        return JsonUtil.toJson(graph.toVisualizationData(colorMap));
    }

    public String handleExportCsv(String examId) {
        AllocationPlan plan = seatingPlans.get(examId);
        if (plan == null && !seatingPlans.isEmpty()) plan = seatingPlans.values().iterator().next();
        return ExportService.exportAllocationsCsv(plan);
    }

    public byte[] handleExportPdf(String type, String examId, String roomId) throws IOException {
        AllocationPlan plan = seatingPlans.get(examId);
        if (plan == null && !seatingPlans.isEmpty()) plan = seatingPlans.values().iterator().next();

        if ("invigilator".equalsIgnoreCase(type)) {
            return ExportService.exportInvigilatorSheetPdf(plan, roomId);
        } else if ("attendance".equalsIgnoreCase(type)) {
            return ExportService.exportAttendanceSheetPdf(plan, roomId);
        } else {
            return ExportService.exportRoomSeatingPdf(plan, roomId);
        }
    }

    public String handleSupabaseSync(String url, String key) {
        if (url != null && key != null) {
            supabaseService.setCredentials(url, key);
        }
        Map<String, Object> result = supabaseService.syncToSupabase(students, classrooms, examinations, registrations);
        return JsonUtil.toJson(result);
    }

    public String handleGetSupabaseStatus() {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("configured", supabaseService.isConfigured());
        map.put("url", supabaseService.getSupabaseUrl());
        map.put("mode", supabaseService.isConfigured() ? "SUPABASE_CLOUD" : "LOCAL_MEMORY_FALLBACK");
        map.put("schemaSql", SupabaseService.getPostgresSchemaSql());
        return JsonUtil.toJson(map);
    }
}
