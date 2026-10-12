package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionRequest {
    @NotNull
    private Long assignmentId;

    // Retained for API compatibility; student callers are resolved from JWT.
    private Long studentId;

    @Size(max = 10000)
    private String answerText;

    // Legacy clients used feedback as the submitted answer.
    @Size(max = 10000)
    private String feedback;
}
