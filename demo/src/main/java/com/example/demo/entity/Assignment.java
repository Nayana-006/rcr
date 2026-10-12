package com.example.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "assignments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Assignment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 255)
    @Column(nullable = false)
    private String title;

    @Size(max = 2000)
    @Column(length = 2000)
    private String description;

    private Instant dueDate;

    // Database defaults give existing assignments safe values when Hibernate adds these columns.
    @Builder.Default
    @Column(nullable = false, columnDefinition = "double default 100")
    private Double maxMarks = 100.0;

    @Builder.Default
    @Column(nullable = false, columnDefinition = "boolean default false")
    private Boolean allowLateSubmission = false;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    private Instant updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = Instant.now();
        }
        if (maxMarks == null) maxMarks = 100.0;
        if (allowLateSubmission == null) allowLateSubmission = false;
        updatedAt = createdAt;
    }

    @PreUpdate
    public void preUpdate() {
        updatedAt = Instant.now();
    }
}
