package com.examoptima;

import com.examoptima.controller.ApiController;
import com.examoptima.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;

import java.io.*;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.Executors;

/**
 * Advanced Java: Main HTTP & REST Server.
 * Runs on Java 17+ / Java 25. Serves REST API endpoints and static UI files.
 */
public class ExamOptimaServer {

    private static final int DEFAULT_PORT = 8080;
    private final int port;
    private HttpServer server;
    private final ApiController apiController;
    private final Path staticDir;

    public ExamOptimaServer(int port) {
        this.port = port;
        this.apiController = new ApiController();
        this.staticDir = Paths.get(".").toAbsolutePath().normalize();
    }

    public void start() throws IOException {
        server = HttpServer.create(new InetSocketAddress("0.0.0.0", port), 0);
        server.setExecutor(Executors.newVirtualThreadPerTaskExecutor()); // Java 21+ Virtual Threads / lightweight async

        // API Handler
        server.createContext("/api", new ApiHandler());

        // Static Files Handler
        server.createContext("/", new StaticFileHandler());

        server.start();
        System.out.println("=================================================================");
        System.out.println("  ExamOptima Advanced Java Engine Started Successfully!");
        System.out.println("  Port: http://localhost:" + port + "/");
        System.out.println("  REST API: http://localhost:" + port + "/api/health");
        System.out.println("  Static UI: http://localhost:" + port + "/index.html");
        System.out.println("=================================================================");
    }

    public void stop() {
        if (server != null) {
            server.stop(0);
        }
    }

    private class ApiHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);

            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            URI uri = exchange.getRequestURI();
            String path = uri.getPath();
            String method = exchange.getRequestMethod();
            Map<String, String> query = parseQuery(uri.getQuery());

            try {
                if ("/api/health".equals(path)) {
                    sendJson(exchange, 200, apiController.handleGetHealth());
                } else if ("/api/seed".equals(path) && "POST".equalsIgnoreCase(method)) {
                    sendJson(exchange, 200, apiController.handleSeedData());
                } else if ("/api/students".equals(path)) {
                    sendJson(exchange, 200, apiController.handleGetStudents());
                } else if ("/api/classrooms".equals(path)) {
                    sendJson(exchange, 200, apiController.handleGetClassrooms());
                } else if (path.startsWith("/api/classrooms/") && path.endsWith("/unavailable")) {
                    String[] parts = path.split("/");
                    String roomId = parts[3];
                    String examId = query.getOrDefault("examId", "");
                    sendJson(exchange, 200, apiController.handleMarkRoomUnavailable(roomId, examId));
                } else if ("/api/exams".equals(path)) {
                    sendJson(exchange, 200, apiController.handleGetExaminations());
                } else if ("/api/registrations".equals(path)) {
                    sendJson(exchange, 200, apiController.handleGetRegistrations());
                } else if ("/api/seating".equals(path) || "/api/plans".equals(path)) {
                    String examId = query.get("examId");
                    if (examId != null) {
                        sendJson(exchange, 200, apiController.handleGetSeatingPlan(examId));
                    } else {
                        sendJson(exchange, 200, apiController.handleGetSeatingPlans());
                    }
                } else if ("/api/allocate".equals(path) && "POST".equalsIgnoreCase(method)) {
                    String body = readBody(exchange);
                    Map<String, Object> bodyMap = JsonUtil.parseJsonObject(body);
                    String examId = (String) bodyMap.getOrDefault("examId", query.getOrDefault("examId", "EX001"));
                    boolean async = Boolean.parseBoolean(String.valueOf(bodyMap.getOrDefault("async", query.getOrDefault("async", "false"))));
                    sendJson(exchange, 200, apiController.handlePostAllocate(examId, async));
                } else if ("/api/allocate/status".equals(path)) {
                    String taskId = query.get("taskId");
                    sendJson(exchange, 200, apiController.handleGetTaskStatus(taskId));
                } else if ("/api/allocate/cancel".equals(path) && "POST".equalsIgnoreCase(method)) {
                    String taskId = query.get("taskId");
                    sendJson(exchange, 200, apiController.handleCancelTask(taskId));
                } else if ("/api/recalculate".equals(path) && "POST".equalsIgnoreCase(method)) {
                    String body = readBody(exchange);
                    Map<String, Object> bodyMap = JsonUtil.parseJsonObject(body);
                    String roomId = (String) bodyMap.getOrDefault("roomId", query.getOrDefault("roomId", ""));
                    String examId = (String) bodyMap.getOrDefault("examId", query.getOrDefault("examId", ""));
                    sendJson(exchange, 200, apiController.handleMarkRoomUnavailable(roomId, examId));
                } else if ("/api/conflicts".equals(path)) {
                    sendJson(exchange, 200, apiController.handleGetConflicts());
                } else if ("/api/graph".equals(path) || path.startsWith("/api/graph/")) {
                    String examId = query.get("examId");
                    if (path.length() > 11) examId = path.substring(11);
                    sendJson(exchange, 200, apiController.handleGetConflictGraph(examId));
                } else if ("/api/export/csv".equals(path)) {
                    String examId = query.get("examId");
                    String csv = apiController.handleExportCsv(examId);
                    byte[] data = csv.getBytes(StandardCharsets.UTF_8);
                    exchange.getResponseHeaders().set("Content-Type", "text/csv; charset=utf-8");
                    exchange.getResponseHeaders().set("Content-Disposition", "attachment; filename=\"examoptima-allocations.csv\"");
                    exchange.sendResponseHeaders(200, data.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(data);
                    }
                } else if ("/api/export/pdf".equals(path)) {
                    String type = query.getOrDefault("type", "chart");
                    String examId = query.getOrDefault("examId", "EX001");
                    String roomId = query.getOrDefault("roomId", "ALL");
                    byte[] pdfData = apiController.handleExportPdf(type, examId, roomId);
                    exchange.getResponseHeaders().set("Content-Type", "application/pdf");
                    exchange.getResponseHeaders().set("Content-Disposition", "inline; filename=\"examoptima-" + type + ".pdf\"");
                    exchange.sendResponseHeaders(200, pdfData.length);
                    try (OutputStream os = exchange.getResponseBody()) {
                        os.write(pdfData);
                    }
                } else if ("/api/supabase/status".equals(path)) {
                    sendJson(exchange, 200, apiController.handleGetSupabaseStatus());
                } else if ("/api/supabase/sync".equals(path) && "POST".equalsIgnoreCase(method)) {
                    String body = readBody(exchange);
                    Map<String, Object> bodyMap = JsonUtil.parseJsonObject(body);
                    String url = (String) bodyMap.get("url");
                    String key = (String) bodyMap.get("key");
                    sendJson(exchange, 200, apiController.handleSupabaseSync(url, key));
                } else {
                    sendJson(exchange, 404, "{\"error\":\"Endpoint not found: " + path + "\"}");
                }
            } catch (Exception ex) {
                ex.printStackTrace();
                sendJson(exchange, 500, "{\"error\":\"" + ex.getMessage().replace("\"", "\\\"") + "\"}");
            }
        }
    }

    private class StaticFileHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange exchange) throws IOException {
            addCorsHeaders(exchange);
            if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
                exchange.sendResponseHeaders(204, -1);
                return;
            }

            String pathStr = exchange.getRequestURI().getPath();
            if ("/".equals(pathStr) || pathStr.isEmpty()) {
                pathStr = "/index.html";
            }

            Path file = staticDir.resolve(pathStr.substring(1)).normalize();
            if (!file.startsWith(staticDir) || !Files.exists(file) || Files.isDirectory(file)) {
                String notFound = "404 Not Found";
                exchange.sendResponseHeaders(404, notFound.length());
                try (OutputStream os = exchange.getResponseBody()) {
                    os.write(notFound.getBytes(StandardCharsets.UTF_8));
                }
                return;
            }

            String mime = getMimeType(file.getFileName().toString());
            byte[] bytes = Files.readAllBytes(file);
            exchange.getResponseHeaders().set("Content-Type", mime);
            exchange.sendResponseHeaders(200, bytes.length);
            try (OutputStream os = exchange.getResponseBody()) {
                os.write(bytes);
            }
        }
    }

    private static String getMimeType(String name) {
        String lower = name.toLowerCase();
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return "text/html; charset=utf-8";
        if (lower.endsWith(".css")) return "text/css; charset=utf-8";
        if (lower.endsWith(".js")) return "application/javascript; charset=utf-8";
        if (lower.endsWith(".json")) return "application/json; charset=utf-8";
        if (lower.endsWith(".svg")) return "image/svg+xml";
        if (lower.endsWith(".png")) return "image/png";
        if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
        if (lower.endsWith(".pdf")) return "application/pdf";
        if (lower.endsWith(".csv")) return "text/csv; charset=utf-8";
        return "application/octet-stream";
    }

    private static void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        exchange.getResponseHeaders().set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    }

    private static void sendJson(HttpExchange exchange, int code, String json) throws IOException {
        byte[] bytes = json.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(code, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String readBody(HttpExchange exchange) throws IOException {
        try (InputStream is = exchange.getRequestBody()) {
            return new String(is.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static Map<String, String> parseQuery(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isEmpty()) return map;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            int idx = pair.indexOf("=");
            if (idx > 0) {
                String key = URLDecoder.decode(pair.substring(0, idx), StandardCharsets.UTF_8);
                String val = URLDecoder.decode(pair.substring(idx + 1), StandardCharsets.UTF_8);
                map.put(key, val);
            }
        }
        return map;
    }

    public static void main(String[] args) throws IOException {
        int port = DEFAULT_PORT;
        if (args.length > 0) {
            try {
                port = Integer.parseInt(args[0]);
            } catch (NumberFormatException ignored) {
            }
        }
        new ExamOptimaServer(port).start();
    }
}
