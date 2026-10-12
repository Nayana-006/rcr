package com.example.demo.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.Instant;

@Data
public class CreateMeetingRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Long courseId;

    @NotNull
    @Future
    private Instant scheduledStartTime;
}
