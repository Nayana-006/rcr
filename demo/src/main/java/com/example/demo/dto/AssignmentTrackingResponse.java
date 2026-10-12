package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class AssignmentTrackingResponse {
    private Long studentId;
    private String studentName;
    private boolean submitted;
    private String status;
    private Instant submittedAt;
    private String answerText;
    private Boolean late;
    private Double grade;
    private String feedback;
    private Instant gradedAt;
}
