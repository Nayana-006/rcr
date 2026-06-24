package com.example.demo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class AttendanceRequest {
    @NotNull
    private LocalDate date;

    @NotNull
    private Boolean present;

    @NotNull
    private Long studentId;

    @NotNull
    private Long courseId;

    @NotNull
    private Long facultyId;
}
