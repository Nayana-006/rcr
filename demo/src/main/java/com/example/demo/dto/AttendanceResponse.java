package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Builder
public class AttendanceResponse {
    private Long id;
    private LocalDate date;
    private boolean present;
    private Instant createdAt;
    private Long studentId;
    private String studentName;
    private Long courseId;
    private String courseTitle;
    private Long facultyId;
    private String facultyName;
}
