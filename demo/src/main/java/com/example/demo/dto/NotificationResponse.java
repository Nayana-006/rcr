package com.example.demo.dto;

import com.example.demo.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;

@Getter
@Builder
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private NotificationType type;
    private boolean readStatus;
    private Instant createdAt;
    private Long userId;
    private String userName;
}
