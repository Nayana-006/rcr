package com.example.demo.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class ChatResponse {
    private String reply;
    private Long studentId;
    private String sender;
    private Instant createdAt;
}
