package com.example.demo.controller;

import com.example.demo.dto.SubmissionRequest;
import com.example.demo.dto.SubmissionResponse;
import com.example.demo.entity.Role;
import com.example.demo.entity.SubmissionStatus;
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
        // ensure student matches authenticated user unless admin
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (current.getRole() == Role.STUDENT && !current.getId().equals(req.getStudentId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(submissionService.submitAssignment(req));
    }

    @GetMapping("/assignment/{assignmentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<List<SubmissionResponse>> getByAssignment(@PathVariable Long assignmentId) {
        return ResponseEntity.ok(submissionService.getSubmissionsByAssignment(assignmentId));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ResponseEntity<List<SubmissionResponse>> getByStudent(@PathVariable Long studentId, Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (current.getRole() == Role.STUDENT && !current.getId().equals(studentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(submissionService.getSubmissionsByStudent(studentId));
    }

    @PutMapping("/{id}/grade")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<SubmissionResponse> grade(@PathVariable Long id, @RequestParam Double grade, @RequestParam(required = false) String feedback, Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Optionally in future: confirm faculty belongs to assignment's course
        return ResponseEntity.ok(submissionService.gradeSubmission(id, grade, feedback, current.getId()));
    }
}
