package com.example.demo.service;

import com.example.demo.dto.NotificationRequest;
import com.example.demo.dto.NotificationResponse;
import com.example.demo.entity.Notification;
import com.example.demo.entity.NotificationType;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    @Transactional
    public NotificationResponse createNotification(NotificationRequest req) {
        User user = userRepository.findById(req.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + req.getUserId()));

        Notification n = Notification.builder()
                .title(req.getTitle())
                .message(req.getMessage())
                .type(req.getType() == null ? NotificationType.SYSTEM : req.getType())
                .user(user)
                .build();

        return toResponse(notificationRepository.save(n));
    }

    public List<NotificationResponse> getNotificationsByUser(Long userId) {
        if (!userRepository.existsById(userId)) throw new ResourceNotFoundException("User not found");
        return notificationRepository.findByUserId(userId).stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public NotificationResponse markAsRead(Long id, Long userId) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!n.getUser().getId().equals(userId)) throw new IllegalArgumentException("You can only mark your own notifications");

        n.setReadStatus(true);
        return toResponse(notificationRepository.save(n));
    }

    @Transactional
    public void deleteNotification(Long id, Long userId, boolean isAdmin) {
        Notification n = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with id: " + id));

        if (!isAdmin && !n.getUser().getId().equals(userId)) throw new IllegalArgumentException("You can only delete your own notifications");

        notificationRepository.delete(n);
    }

    private NotificationResponse toResponse(Notification n) {
        return NotificationResponse.builder()
                .id(n.getId())
                .title(n.getTitle())
                .message(n.getMessage())
                .type(n.getType())
                .readStatus(n.isReadStatus())
                .createdAt(n.getCreatedAt())
                .userId(n.getUser().getId())
                .userName(n.getUser().getName())
                .build();
    }
}
