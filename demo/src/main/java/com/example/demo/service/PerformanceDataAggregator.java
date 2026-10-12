package com.example.demo.service;

import com.example.demo.entity.*;
import com.example.demo.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Aggregates raw activity data into a feature vector for a given student.
 * This data is later used for model training and predictions.
 */
@Service
@RequiredArgsConstructor
public class PerformanceDataAggregator {
    private final QuizAttemptRepository quizAttemptRepository;
    private final SubmissionRepository submissionRepository;
    private final LoginLogRepository loginLogRepository;
    private final LearningLinkRepository learningLinkRepository; // assuming video watch logs stored here
    private final DoubtRepository doubtRepository;

    @Transactional(readOnly = true)
    public StudentPerformance aggregate(Long studentId) {
        // Total quiz attempts and average score
        List<QuizAttempt> attempts = quizAttemptRepository.findByStudentId(studentId);
        int totalQuizAttempts = attempts.size();
        double avgQuizScore = attempts.stream()
                .mapToDouble(QuizAttempt::getScore)
                .average()
                .orElse(0.0);

        // Assignment submissions
        List<Submission> submissions = submissionRepository.findByStudentId(studentId);
        int totalAssignments = submissions.size();
        long submittedCount = submissions.size();
        double assignmentSubmissionRate = totalAssignments == 0 ? 0.0 : (double) submittedCount / totalAssignments;

        // Login frequency (logins per week)
        long loginCount = loginLogRepository.countByStudentId(studentId);
        double loginFrequency = loginCount / 7.0; // simplistic weekly average

        // Watch-time tracking is not part of the current learning-link model.
        double videoWatchTime = 0.0;

        // Forum/doubt participation count
        int doubtCount = doubtRepository.findByStudentId(studentId).size();

        return StudentPerformance.builder()
                .studentId(studentId)
                .totalQuizAttempts(totalQuizAttempts)
                .avgQuizScore(avgQuizScore)
                .totalAssignments(totalAssignments)
                .assignmentSubmissionRate(assignmentSubmissionRate)
                .loginFrequency(loginFrequency)
                .videoWatchTime(videoWatchTime)
                .doubtCount(doubtCount)
                .build();
    }
}
