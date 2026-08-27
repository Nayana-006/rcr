package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizAttemptRequest {

    @NotBlank
    private String answersJson; // e.g. {"questionId": "A/B/C/D"}

    @NotNull
    private Long studentId;
}
