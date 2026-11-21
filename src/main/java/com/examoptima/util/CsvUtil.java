package com.examoptima.util;

import java.util.ArrayList;
import java.util.List;

public class CsvUtil {

    public static String formatRow(List<String> values) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < values.size(); i++) {
            if (i > 0) sb.append(",");
            String val = values.get(i);
            if (val == null) val = "";
            if (val.contains(",") || val.contains("\"") || val.contains("\n") || val.contains("\r")) {
                sb.append("\"").append(val.replace("\"", "\"\"")).append("\"");
            } else {
                sb.append(val);
            }
        }
        return sb.toString();
    }

    public static List<String> parseLine(String line) {
        List<String> result = new ArrayList<>();
        if (line == null || line.isEmpty()) return result;

        StringBuilder curVal = new StringBuilder();
        boolean inQuotes = false;
        char[] chars = line.toCharArray();

        for (int i = 0; i < chars.length; i++) {
            char c = chars[i];
            if (inQuotes) {
                if (c == '"') {
                    if (i + 1 < chars.length && chars[i + 1] == '"') {
                        curVal.append('"');
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    curVal.append(c);
                }
            } else {
                if (c == '"') {
                    inQuotes = true;
                } else if (c == ',') {
                    result.add(curVal.toString().trim());
                    curVal.setLength(0);
                } else {
                    curVal.append(c);
                }
            }
        }
        result.add(curVal.toString().trim());
        return result;
    }
}
