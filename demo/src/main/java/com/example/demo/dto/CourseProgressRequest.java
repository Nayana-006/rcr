package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CourseProgressRequest {
    @NotNull
    private Long studentId;

    @NotNull
    private Long courseId;
}
