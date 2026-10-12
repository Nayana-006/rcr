package com.example.demo.controller;

import com.example.demo.dto.AssignmentRequest;
import com.example.demo.dto.AssignmentResponse;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.AssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assignments")
@RequiredArgsConstructor
public class AssignmentController {
    private final AssignmentService assignmentService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<AssignmentResponse>> getAll(Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getAllAssignments(currentUser(authentication)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AssignmentResponse> getById(@PathVariable Long id, Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getAssignmentById(id, currentUser(authentication)));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AssignmentResponse>> getByCourse(@PathVariable Long courseId, Authentication authentication) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByCourse(courseId, currentUser(authentication)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<AssignmentResponse> create(@Valid @RequestBody AssignmentRequest req, Authentication authentication) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(assignmentService.createAssignment(req, currentUser(authentication)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<AssignmentResponse> update(@PathVariable Long id, @Valid @RequestBody AssignmentRequest req,
                                                     Authentication authentication) {
        return ResponseEntity.ok(assignmentService.updateAssignment(id, req, currentUser(authentication)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        assignmentService.deleteAssignment(id, currentUser(authentication));
        return ResponseEntity.noContent().build();
    }

    private User currentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
