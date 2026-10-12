package com.example.demo.controller;

import com.example.demo.dto.AssignmentTrackingResponse;
import com.example.demo.dto.SubmissionRequest;
import com.example.demo.dto.SubmissionResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {
    private final SubmissionService submissionService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    public ResponseEntity<SubmissionResponse> submit(@Valid @RequestBody SubmissionRequest req, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(submissionService.submitAssignment(req, currentUser(authentication)));
    }

    @GetMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<List<SubmissionResponse>> getByAssignment(@PathVariable Long assignmentId,
                                                                    Authentication authentication) {
        return ResponseEntity.ok(submissionService.getSubmissionsByAssignment(assignmentId, currentUser(authentication)));
    }

    @GetMapping("/assignment/{assignmentId}/tracking")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<List<AssignmentTrackingResponse>> getTracking(@PathVariable Long assignmentId,
                                                                        Authentication authentication) {
        return ResponseEntity.ok(submissionService.getAssignmentTracking(assignmentId, currentUser(authentication)));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ResponseEntity<List<SubmissionResponse>> getByStudent(@PathVariable Long studentId,
                                                                 Authentication authentication) {
        return ResponseEntity.ok(submissionService.getSubmissionsByStudent(studentId, currentUser(authentication)));
    }

    @PutMapping("/{id}/grade")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<SubmissionResponse> grade(@PathVariable Long id, @RequestParam Double grade,
                                                     @RequestParam(required = false) String feedback,
                                                     Authentication authentication) {
        return ResponseEntity.ok(submissionService.gradeSubmission(id, grade, feedback, currentUser(authentication)));
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
