package com.example.demo.controller;

import com.example.demo.dto.DoubtRequest;
import com.example.demo.dto.DoubtResponse;
import com.example.demo.entity.Role;
import com.example.demo.entity.DoubtStatus;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.DoubtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/doubts")
@RequiredArgsConstructor
public class DoubtController {

    private final DoubtService doubtService;
    private final UserRepository userRepository;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','STUDENT')")
    public ResponseEntity<DoubtResponse> create(@Valid @RequestBody DoubtRequest req, Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (current.getRole() == Role.STUDENT && !current.getId().equals(req.getStudentId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(doubtService.createDoubt(req));
    }

    @PutMapping("/{id}/reply")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<DoubtResponse> reply(@PathVariable Long id, @RequestParam String message, Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return ResponseEntity.ok(doubtService.replyToDoubt(id, message, current.getId()));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<DoubtResponse> resolve(@PathVariable Long id, Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        return ResponseEntity.ok(doubtService.resolveDoubt(id, current.getId()));
    }

    @GetMapping("/student/{studentId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ResponseEntity<List<DoubtResponse>> byStudent(@PathVariable Long studentId, Authentication authentication) {
        User current = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (current.getRole() == Role.STUDENT && !current.getId().equals(studentId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        return ResponseEntity.ok(doubtService.getDoubtsByStudent(studentId));
    }

    @GetMapping("/faculty/{facultyId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<List<DoubtResponse>> byFaculty(@PathVariable Long facultyId) {
        return ResponseEntity.ok(doubtService.getDoubtsByFaculty(facultyId));
    }

    @GetMapping("/course/{courseId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY','STUDENT')")
    public ResponseEntity<List<DoubtResponse>> byCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(doubtService.getDoubtsByCourse(courseId));
    }
}
