package com.examoptima.util;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Advanced Java: Pure-Java Zero-Dependency PDF 1.4 Generator.
 * Creates valid PDF documents with text, tables, and headers.
 */
public class PdfUtil {

    public static byte[] createDocument(String title, String subtitle, List<String[]> tableData, String[] headers, String footerNotice) throws IOException {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        List<Long> offsets = new ArrayList<>();

        // PDF Header
        write(baos, "%PDF-1.4\n%âãÏÓ\n");

        // Object 1: Catalog
        offsets.add((long) baos.size());
        write(baos, "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");

        // Object 2: Pages
        offsets.add((long) baos.size());
        write(baos, "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");

        // Prepare page content text stream
        StringBuilder content = new StringBuilder();
        content.append("BT\n/F1 16 Tf\n50 790 Td\n(").append(escapePdf(title)).append(") Tj\nET\n");
        if (subtitle != null && !subtitle.isEmpty()) {
            content.append("BT\n/F1 10 Tf\n50 770 Td\n(").append(escapePdf(subtitle)).append(") Tj\nET\n");
        }

        // Draw horizontal line
        content.append("0.5 w\n50 760 m\n550 760 l\nS\n");

        // Draw Table Header
        int y = 740;
        if (headers != null && headers.length > 0) {
            content.append("BT\n/F1 9 Tf\n");
            int x = 50;
            int colWidth = 500 / headers.length;
            for (String h : headers) {
                content.append(x).append(" ").append(y).append(" Td\n(").append(escapePdf(h)).append(") Tj\n");
                content.append(-x).append(" ").append(-y).append(" Td\n");
                x += colWidth;
            }
            content.append("ET\n");
            content.append("0.3 w\n50 ").append(y - 5).append(" m\n550 ").append(y - 5).append(" l\nS\n");
            y -= 18;
        }

        // Draw Table Rows
        if (tableData != null) {
            int colWidth = headers != null && headers.length > 0 ? 500 / headers.length : 100;
            for (String[] row : tableData) {
                if (y < 60) break; // stay within single page bounds
                content.append("BT\n/F1 8 Tf\n");
                int x = 50;
                for (String cell : row) {
                    content.append(x).append(" ").append(y).append(" Td\n(").append(escapePdf(cell)).append(") Tj\n");
                    content.append(-x).append(" ").append(-y).append(" Td\n");
                    x += colWidth;
                }
                content.append("ET\n");
                y -= 14;
            }
        }

        // Footer / Signature line
        if (footerNotice != null && !footerNotice.isEmpty()) {
            content.append("0.5 w\n50 45 m\n550 45 l\nS\n");
            content.append("BT\n/F1 8 Tf\n50 32 Td\n(").append(escapePdf(footerNotice)).append(") Tj\nET\n");
        }

        byte[] streamBytes = content.toString().getBytes(StandardCharsets.ISO_8859_1);

        // Object 4: Content Stream
        long obj4Offset = baos.size();

        // Object 3: Page Object (needs ref to content stream)
        offsets.add((long) baos.size());
        write(baos, "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n");

        // Object 4: Stream
        offsets.add((long) baos.size());
        write(baos, "4 0 obj\n<< /Length " + streamBytes.length + " >>\nstream\n");
        baos.write(streamBytes);
        write(baos, "\nendstream\nendobj\n");

        // Object 5: Font (Helvetica standard)
        offsets.add((long) baos.size());
        write(baos, "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");

        // Cross-Reference Table
        long xrefOffset = baos.size();
        write(baos, "xref\n0 6\n0000000000 65535 f \n");
        for (long off : offsets) {
            write(baos, String.format("%010d 00000 n \n", off));
        }

        // Trailer
        write(baos, "trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF\n");

        return baos.toByteArray();
    }

    private static void write(ByteArrayOutputStream baos, String s) throws IOException {
        baos.write(s.getBytes(StandardCharsets.ISO_8859_1));
    }

    private static String escapePdf(String text) {
        if (text == null) return "";
        return text.replace("\\", "\\\\")
                   .replace("(", "\\(")
                   .replace(")", "\\)")
                   .replace("\r", " ")
                   .replace("\n", " ");
    }
}
