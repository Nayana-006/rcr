package com.example.demo.controller;

import com.example.demo.dto.CourseProgressRequest;
import com.example.demo.dto.CourseProgressResponse;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.CourseProgressService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress")
@RequiredArgsConstructor
public class CourseProgressController {

    private final CourseProgressService courseProgressService;
    private final UserRepository userRepository;

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ResponseEntity<List<CourseProgressResponse>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        ensureStudentCanRead(studentId, authentication);
        return ResponseEntity.ok(courseProgressService.getProgressByStudent(studentId));
    }

    @GetMapping("/student/{studentId}/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ResponseEntity<CourseProgressResponse> getByStudentAndCourse(
            @PathVariable Long studentId,
            @PathVariable Long courseId,
            Authentication authentication) {
        ensureStudentCanRead(studentId, authentication);
        return ResponseEntity.ok(courseProgressService.getProgress(studentId, courseId));
    }

    @PostMapping("/open")
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    public ResponseEntity<CourseProgressResponse> markOpened(@Valid @RequestBody CourseProgressRequest request, Authentication authentication) {
        User current = getCurrentUser(authentication);
        if (current.getRole() == Role.STUDENT && !current.getId().equals(request.getStudentId())) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(courseProgressService.markCourseOpened(request.getStudentId(), request.getCourseId()));
    }

    private void ensureStudentCanRead(Long studentId, Authentication authentication) {
        User current = getCurrentUser(authentication);
        if (current.getRole() == Role.STUDENT && !current.getId().equals(studentId)) {
            throw new IllegalArgumentException("You can only view your own progress");
        }
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
