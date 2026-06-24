package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class SubmissionResponse {
    private Long id;
    private Instant submittedAt;
    private String status;
    private Double grade;
    private String feedback;
    private Long assignmentId;
    private String assignmentTitle;
    private Long studentId;
    private String studentName;
    private String studentEmail;
}
