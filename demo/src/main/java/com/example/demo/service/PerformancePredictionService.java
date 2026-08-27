package com.example.demo.service;

import com.example.demo.entity.StudentPerformance;
import com.example.demo.repository.StudentPerformanceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Provides prediction results for a given student.
 * For now, this implementation returns the stored prediction if present,
 * otherwise returns a default placeholder score.
 */
@Service
@RequiredArgsConstructor
public class PerformancePredictionService {
    private final StudentPerformanceRepository repository;

    @Transactional(readOnly = true)
    public StudentPerformance getPrediction(Long studentId) {
        return repository.findByStudentId(studentId)
                .orElseGet(() -> {
                    // Placeholder: create a default prediction record
                    StudentPerformance sp = StudentPerformance.builder()
                            .studentId(studentId)
                            .predictedScore(0.5)
                            .predictionTimestamp(java.time.LocalDateTime.now())
                            .build();
                    return repository.save(sp);
                });
    }
}
