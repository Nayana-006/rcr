package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import com.example.demo.dto.LearningLinkResponse;

@Getter
@Builder
public class CourseResponse {
    private Long id;
    private String title;
    private String description;
    private String thumbnailUrl;
    private Instant createdAt;
    private Long facultyId;
    private String facultyName;
    private List<LearningLinkResponse> learningLinks;
}