package com.example.demo.dto;

import com.example.demo.entity.NotificationType;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class NotificationRequest {
    @NotNull
    private Long userId;

    private String title;
    private String message;
    private NotificationType type;
}
