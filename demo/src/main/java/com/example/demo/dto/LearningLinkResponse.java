package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class LearningLinkResponse {
    private Long id;
    private String label;
    private String type;
    private String url;
    private Instant createdAt;
}
