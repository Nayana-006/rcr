package com.example.demo.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

/**
 * Stores aggregated features for a student and the latest prediction result.
 */
@Entity
@Table(name = "student_performance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentPerformance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** The student this record belongs to */
    private Long studentId;

    /** Feature: total quiz attempts */
    private Integer totalQuizAttempts;

    /** Feature: average quiz score (0-100) */
    private Double avgQuizScore;

    /** Feature: total assignments submitted */
    private Integer totalAssignments;

    /** Feature: assignment submission rate (0-1) */
    private Double assignmentSubmissionRate;

    /** Feature: login frequency (logins per week) */
    private Double loginFrequency;

    /** Feature: video watch time in minutes */
    private Double videoWatchTime;

    /** Feature: forum/doubt participation count */
    private Integer doubtCount;

    /** Predicted probability of good performance (0-1) */
    private Double predictedScore;

    /** When the prediction was last updated */
    private LocalDateTime predictionTimestamp;
}
