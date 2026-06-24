package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class DoubtRequest {
    @NotBlank
    private String title;

    private String message;

    @NotNull
    private Long studentId;

    @NotNull
    private Long courseId;
}
