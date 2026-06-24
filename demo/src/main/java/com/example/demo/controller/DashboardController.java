package com.example.demo.controller;

import com.example.demo.dto.AdminDashboardResponse;
import com.example.demo.dto.FacultyDashboardResponse;
import com.example.demo.dto.StudentDashboardResponse;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;
    private final UserRepository userRepository;

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    public ResponseEntity<StudentDashboardResponse> studentDashboard(@PathVariable Long studentId, Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (current.getRole() == Role.STUDENT && !current.getId().equals(studentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        // validate target student exists
        userRepository.findById(studentId).orElseThrow(() -> new ResourceNotFoundException("Student not found"));

        return ResponseEntity.ok(dashboardService.getStudentDashboard(studentId));
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<FacultyDashboardResponse> facultyDashboard(@PathVariable Long facultyId, Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (current.getRole() == Role.FACULTY && !current.getId().equals(facultyId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        userRepository.findById(facultyId).orElseThrow(() -> new ResourceNotFoundException("Faculty not found"));

        return ResponseEntity.ok(dashboardService.getFacultyDashboard(facultyId));
    }

    @GetMapping("/admin")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AdminDashboardResponse> adminDashboard() {
        return ResponseEntity.ok(dashboardService.getAdminDashboard());
    }
}
