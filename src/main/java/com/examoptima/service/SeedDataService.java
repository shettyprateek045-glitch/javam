package com.examoptima.service;

import com.examoptima.model.Classroom;
import com.examoptima.model.Examination;
import com.examoptima.model.Registration;
import com.examoptima.model.Student;

import java.util.*;

/**
 * Advanced Java: Seed Data Service.
 * Generates 200+ realistic students across 4 departments (CSE, ECE, EEE, ISE)
 * and 4 semesters, 6 classrooms with diverse capacities, and 5 examinations
 * with overlapping schedules to test conflict detection.
 */
public class SeedDataService {

    public static class SeedPayload {
        public List<Student> students = new ArrayList<>();
        public List<Classroom> classrooms = new ArrayList<>();
        public List<Examination> examinations = new ArrayList<>();
        public List<Registration> registrations = new ArrayList<>();
    }

    private static final String[] FIRST_NAMES = {
        "Aarav", "Aditi", "Akhil", "Ananya", "Aniruddh", "Bhavana", "Chetan", "Deepa",
        "Divya", "Ganesh", "Gautam", "Harini", "Harish", "Ishaan", "Kavya", "Keerthi",
        "Kiran", "Madhav", "Manish", "Meera", "Naveen", "Nikhil", "Pallavi", "Pooja",
        "Pranav", "Prateek", "Priya", "Rahul", "Rakshit", "Rohan", "Sahana", "Sameer",
        "Sanjay", "Sanjana", "Shreya", "Siddharth", "Sneha", "Suraj", "Suresh", "Tanvi",
        "Tarun", "Tejas", "Varun", "Vikas", "Vinay", "Yash", "Zoya", "Arjun", "Karthik", "Rhea"
    };

    private static final String[] LAST_NAMES = {
        "Shetty", "Kumar", "Sharma", "Rao", "Patil", "Gowda", "Bhat", "Hegde",
        "Deshmukh", "Joshi", "Menon", "Nair", "Reddy", "Verma", "Pai", "Kamath",
        "Prasad", "Kulkarni", "Kashyap", "Murthy"
    };

    public static SeedPayload generateDemoData() {
        SeedPayload data = new SeedPayload();

        // 1. Generate 220 Students across CSE, ECE, EEE, ISE in 4 Semesters
        String[] depts = {"CSE", "ECE", "EEE", "ISE"};
        String[] deptCodes = {"CS", "EC", "EE", "IS"};
        Map<String, String> deptSubjects = Map.of(
            "CSE", "Data Structures & Algorithms",
            "ECE", "Digital Signal Processing",
            "EEE", "Control Systems & Power",
            "ISE", "Database Management Systems"
        );

        int studentSeq = 1;
        for (int d = 0; d < depts.length; d++) {
            String dept = depts[d];
            String code = deptCodes[d];
            String subject = deptSubjects.get(dept);
            int countForDept = 55; // 55 * 4 = 220 students

            for (int i = 1; i <= countForDept; i++) {
                String id = String.format("STU%03d", studentSeq);
                String usn = String.format("1RN24%s%03d", code, i);
                String first = FIRST_NAMES[(studentSeq + i * 3) % FIRST_NAMES.length];
                String last = LAST_NAMES[(studentSeq + i * 7) % LAST_NAMES.length];
                String name = first + " " + last;
                int sem = ((i - 1) % 4) + 1; // Semesters 1, 2, 3, 4
                String email = (first + "." + last + studentSeq + "@examoptima.edu").toLowerCase();

                data.students.add(new Student(id, usn, name, dept, sem, email, subject));
                studentSeq++;
            }
        }

        // 2. Generate 6 Classrooms with Varying Capacities
        Classroom c1 = new Classroom("CR001", "Main Examination Hall", "101", "Block A", 120, 120);
        c1.setRows(10); c1.setColumns(12);
        c1.setBlocked(List.of(1, 12, 109, 120)); // Corner seats blocked for equipment

        Classroom c2 = new Classroom("CR002", "Lecture Theatre 1", "102", "Block A", 80, 80);
        c2.setRows(8); c2.setColumns(10);

        Classroom c3 = new Classroom("CR003", "Advanced Computing Lab", "201", "Block B", 60, 60);
        c3.setRows(6); c3.setColumns(10);
        c3.setBlocked(List.of(5, 6, 25, 26)); // Severely damaged terminal desks

        Classroom c4 = new Classroom("CR004", "Seminar Hall", "202", "Block B", 50, 50);
        c4.setRows(5); c4.setColumns(10);

        Classroom c5 = new Classroom("CR005", "VLSI Design Centre", "301", "Block C", 45, 45);
        c5.setRows(5); c5.setColumns(9);

        Classroom c6 = new Classroom("CR006", "Drawing Studio", "302", "Block C", 30, 30);
        c6.setRows(5); c6.setColumns(6);

        data.classrooms.addAll(List.of(c1, c2, c3, c4, c5, c6));

        // 3. Generate 5 Examinations with Overlapping Schedules for Clashes
        Examination e1 = new Examination(
            "EX001",
            "Semester End: Data Structures & Algorithms",
            "Data Structures & Algorithms",
            "21CS32",
            "2026-12-05",
            "09:30",
            "12:30"
        );

        Examination e2 = new Examination(
            "EX002",
            "Semester End: Digital Signal Processing",
            "Digital Signal Processing",
            "21EC33",
            "2026-12-05",
            "09:30",
            "12:30"
        );

        Examination e3 = new Examination(
            "EX003",
            "Semester End: Database Management Systems",
            "Database Management Systems",
            "21IS34",
            "2026-12-05",
            "10:00", // Clashes with e1 & e2
            "13:00"
        );

        Examination e4 = new Examination(
            "EX004",
            "Semester End: Control Systems & Power",
            "Control Systems & Power",
            "21EE35",
            "2026-12-06",
            "09:30",
            "12:30"
        );

        Examination e5 = new Examination(
            "EX005",
            "Elective: Machine Learning & Intelligent Systems",
            "Machine Learning Systems",
            "21CS51",
            "2026-12-06",
            "14:00",
            "17:00"
        );

        data.examinations.addAll(List.of(e1, e2, e3, e4, e5));

        // 4. Register Students to Exams
        // EX001: Register all CSE students (55 students) + 15 ISE students = 70 students
        for (int i = 0; i < 55; i++) {
            data.registrations.add(new Registration("EX001", data.students.get(i).getUsn()));
        }
        for (int i = 165; i < 180; i++) {
            data.registrations.add(new Registration("EX001", data.students.get(i).getUsn()));
        }

        // EX002: Register all ECE students (55 students) + 20 EEE students = 75 students
        for (int i = 55; i < 110; i++) {
            data.registrations.add(new Registration("EX002", data.students.get(i).getUsn()));
        }
        for (int i = 110; i < 130; i++) {
            data.registrations.add(new Registration("EX002", data.students.get(i).getUsn()));
        }

        // EX003: Register ISE students (55 students)
        for (int i = 165; i < 220; i++) {
            data.registrations.add(new Registration("EX003", data.students.get(i).getUsn()));
        }

        // EX004: Register EEE students (55 students)
        for (int i = 110; i < 165; i++) {
            data.registrations.add(new Registration("EX004", data.students.get(i).getUsn()));
        }

        // EX005: Register 40 CSE students + 20 ISE students
        for (int i = 0; i < 40; i++) {
            data.registrations.add(new Registration("EX005", data.students.get(i).getUsn()));
        }
        for (int i = 165; i < 185; i++) {
            data.registrations.add(new Registration("EX005", data.students.get(i).getUsn()));
        }

        return data;
    }
}
