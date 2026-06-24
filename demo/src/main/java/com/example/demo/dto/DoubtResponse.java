package com.example.demo.dto;

import com.example.demo.entity.DoubtStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class DoubtResponse {
    private Long id;
    private String title;
    private String message;
    private DoubtStatus status;
    private Instant createdAt;
    private Long studentId;
    private String studentName;
    private Long facultyId;
    private String facultyName;
    private Long courseId;
    private String courseTitle;
}
