package com.example.demo.dto;

import com.example.demo.entity.MeetingStatus;
import lombok.Builder;
import lombok.Data;

import java.time.Instant;

@Data
@Builder
public class MeetingResponse {
    private Long id;
    private Long courseId;
    private String courseTitle;
    private Long facultyId;
    private String facultyName;
    private String title;
    private String description;
    private Instant scheduledStartTime;
    private Instant actualStartTime;
    private Instant actualEndTime;
    private MeetingStatus status;
}
