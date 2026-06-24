package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class SubmissionRequest {
    @NotNull
    private Long assignmentId;

    @NotNull
    private Long studentId;

    private String feedback; // optional initial feedback or text
}
