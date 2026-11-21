package com.examoptima.util;

import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.util.*;

/**
 * Advanced Java: Zero-dependency JSON Serializer and Parser.
 */
public class JsonUtil {

    public static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof String) {
            return "\"" + escapeString((String) obj) + "\"";
        }
        if (obj instanceof Number || obj instanceof Boolean) {
            return obj.toString();
        }
        if (obj instanceof Collection<?>) {
            StringBuilder sb = new StringBuilder("[");
            boolean first = true;
            for (Object item : (Collection<?>) obj) {
                if (!first) sb.append(",");
                sb.append(toJson(item));
                first = false;
            }
            sb.append("]");
            return sb.toString();
        }
        if (obj instanceof Map<?, ?>) {
            StringBuilder sb = new StringBuilder("{");
            boolean first = true;
            for (Map.Entry<?, ?> entry : ((Map<?, ?>) obj).entrySet()) {
                if (!first) sb.append(",");
                sb.append("\"").append(escapeString(String.valueOf(entry.getKey()))).append("\":");
                sb.append(toJson(entry.getValue()));
                first = false;
            }
            sb.append("}");
            return sb.toString();
        }

        // Generic POJO serialization using reflection
        StringBuilder sb = new StringBuilder("{");
        boolean first = true;
        Class<?> clazz = obj.getClass();
        while (clazz != null && clazz != Object.class) {
            Field[] fields = clazz.getDeclaredFields();
            for (Field f : fields) {
                if (Modifier.isStatic(f.getModifiers()) || Modifier.isTransient(f.getModifiers())) {
                    continue;
                }
                f.setAccessible(true);
                try {
                    Object val = f.get(obj);
                    if (!first) sb.append(",");
                    sb.append("\"").append(escapeString(f.getName())).append("\":");
                    sb.append(toJson(val));
                    first = false;
                } catch (IllegalAccessException ignored) {
                }
            }
            clazz = clazz.getSuperclass();
        }
        sb.append("}");
        return sb.toString();
    }

    private static String escapeString(String s) {
        if (s == null) return "";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            switch (c) {
                case '"' -> sb.append("\\\"");
                case '\\' -> sb.append("\\\\");
                case '\b' -> sb.append("\\b");
                case '\f' -> sb.append("\\f");
                case '\n' -> sb.append("\\n");
                case '\r' -> sb.append("\\r");
                case '\t' -> sb.append("\\t");
                default -> {
                    if (c < ' ') {
                        String t = "000" + Integer.toHexString(c);
                        sb.append("\\u").append(t.substring(t.length() - 4));
                    } else {
                        sb.append(c);
                    }
                }
            }
        }
        return sb.toString();
    }

    /**
     * Parses simple JSON object into a Map<String, Object>.
     */
    public static Map<String, Object> parseJsonObject(String json) {
        if (json == null || json.trim().isEmpty()) return Collections.emptyMap();
        json = json.trim();
        if (json.startsWith("{") && json.endsWith("}")) {
            json = json.substring(1, json.length() - 1).trim();
        }
        Map<String, Object> map = new LinkedHashMap<>();
        int i = 0;
        int len = json.length();

        while (i < len) {
            // Find key
            while (i < len && (Character.isWhitespace(json.charAt(i)) || json.charAt(i) == ',')) i++;
            if (i >= len) break;

            if (json.charAt(i) != '"') break;
            i++;
            int keyStart = i;
            while (i < len && json.charAt(i) != '"') i++;
            String key = json.substring(keyStart, i);
            i++; // skip closing quote

            while (i < len && (Character.isWhitespace(json.charAt(i)) || json.charAt(i) == ':')) i++;

            // Parse value
            if (i >= len) break;
            char firstVal = json.charAt(i);
            if (firstVal == '"') {
                i++;
                int valStart = i;
                StringBuilder valSb = new StringBuilder();
                while (i < len) {
                    char c = json.charAt(i);
                    if (c == '\\' && i + 1 < len) {
                        valSb.append(json.charAt(i + 1));
                        i += 2;
                    } else if (c == '"') {
                        break;
                    } else {
                        valSb.append(c);
                        i++;
                    }
                }
                map.put(key, valSb.toString());
                i++; // skip quote
            } else if (firstVal == '{' || firstVal == '[') {
                char closeChar = firstVal == '{' ? '}' : ']';
                int depth = 0;
                int start = i;
                while (i < len) {
                    if (json.charAt(i) == firstVal) depth++;
                    else if (json.charAt(i) == closeChar) {
                        depth--;
                        if (depth == 0) { i++; break; }
                    }
                    i++;
                }
                map.put(key, json.substring(start, i));
            } else {
                int valStart = i;
                while (i < len && json.charAt(i) != ',' && json.charAt(i) != '}') i++;
                String rawVal = json.substring(valStart, i).trim();
                if ("true".equalsIgnoreCase(rawVal)) map.put(key, true);
                else if ("false".equalsIgnoreCase(rawVal)) map.put(key, false);
                else if ("null".equalsIgnoreCase(rawVal)) map.put(key, null);
                else {
                    try {
                        if (rawVal.contains(".")) map.put(key, Double.parseDouble(rawVal));
                        else map.put(key, Long.parseLong(rawVal));
                    } catch (NumberFormatException e) {
                        map.put(key, rawVal);
                    }
                }
            }
        }

        return map;
    }
}
