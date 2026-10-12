package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class AssignmentResponse {
    private Long id;
    private String title;
    private String description;
    private Instant dueDate;
    private Double maxMarks;
    private Boolean allowLateSubmission;
    private Instant createdAt;
    private Instant updatedAt;
    private Long courseId;
    private String courseTitle;
}
