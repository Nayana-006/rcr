package com.example.demo.controller;

import com.example.demo.dto.*;
import com.example.demo.entity.Role;
import com.example.demo.entity.User;
import com.example.demo.exception.ResourceNotFoundException;
import com.example.demo.repository.UserRepository;
import com.example.demo.service.QuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/quizzes")
@RequiredArgsConstructor
public class QuizController {

    private final QuizService quizService;
    private final UserRepository userRepository;

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<QuizResponse>> getByCourse(@PathVariable Long courseId) {
        return ResponseEntity.ok(quizService.getQuizzesByCourse(courseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<QuizResponse> getById(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuizById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<QuizResponse> create(@Valid @RequestBody QuizRequest req, Authentication authentication) {
        User current = getCurrentUser(authentication);
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.createQuiz(req, current.getId()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<QuizResponse> update(@PathVariable Long id, @Valid @RequestBody QuizRequest req, Authentication authentication) {
        User current = getCurrentUser(authentication);
        boolean isAdmin = current.getRole() == Role.ADMIN;
        return ResponseEntity.ok(quizService.updateQuiz(id, req, current.getId(), isAdmin));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        User current = getCurrentUser(authentication);
        boolean isAdmin = current.getRole() == Role.ADMIN;
        quizService.deleteQuiz(id, current.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    // Questions
    @GetMapping("/{id}/questions")
    public ResponseEntity<List<QuizQuestionResponse>> getQuestions(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getQuestionsByQuiz(id));
    }

    @PostMapping("/{id}/questions")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<QuizQuestionResponse> addQuestion(@PathVariable Long id, @Valid @RequestBody QuizQuestionRequest req, Authentication authentication) {
        User current = getCurrentUser(authentication);
        boolean isAdmin = current.getRole() == Role.ADMIN;
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.addQuestion(id, req, current.getId(), isAdmin));
    }

    @DeleteMapping("/questions/{questionId}")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<Void> deleteQuestion(@PathVariable Long questionId, Authentication authentication) {
        User current = getCurrentUser(authentication);
        boolean isAdmin = current.getRole() == Role.ADMIN;
        quizService.deleteQuestion(questionId, current.getId(), isAdmin);
        return ResponseEntity.noContent().build();
    }

    // Attempts
    @PostMapping("/{id}/attempt")
    @PreAuthorize("hasRole('STUDENT')")
    public ResponseEntity<QuizAttemptResponse> submitAttempt(@PathVariable Long id, @Valid @RequestBody QuizAttemptRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(quizService.submitAttempt(id, req));
    }

    @GetMapping("/student/{studentId}/attempts")
    public ResponseEntity<List<QuizAttemptResponse>> getStudentAttempts(@PathVariable Long studentId) {
        return ResponseEntity.ok(quizService.getAttemptsByStudent(studentId));
    }

    @GetMapping("/{id}/attempts")
    @PreAuthorize("hasAnyRole('ADMIN','FACULTY')")
    public ResponseEntity<List<QuizAttemptResponse>> getQuizAttempts(@PathVariable Long id) {
        return ResponseEntity.ok(quizService.getAttemptsByQuiz(id));
    }

    @GetMapping("/{id}/student/{studentId}/attempts")
    public ResponseEntity<List<QuizAttemptResponse>> getQuizAndStudentAttempts(@PathVariable Long id, @PathVariable Long studentId) {
        return ResponseEntity.ok(quizService.getAttemptsByQuizAndStudent(id, studentId));
    }

    private User getCurrentUser(Authentication authentication) {
        return userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
