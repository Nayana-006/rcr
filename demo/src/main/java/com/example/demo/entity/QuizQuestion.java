package com.example.demo.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Entity
@Table(name = "quiz_questions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 2000)
    @Column(nullable = false, length = 2000)
    private String questionText;

    @NotBlank
    @Size(max = 500)
    @Column(nullable = false, length = 500)
    private String optionA;

    @NotBlank
    @Size(max = 500)
    @Column(nullable = false, length = 500)
    private String optionB;

    @NotBlank
    @Size(max = 500)
    @Column(nullable = false, length = 500)
    private String optionC;

    @NotBlank
    @Size(max = 500)
    @Column(nullable = false, length = 500)
    private String optionD;

    @NotBlank
    @Size(max = 1)
    @Column(nullable = false, length = 1)
    private String correctOption; // 'A', 'B', 'C', or 'D'

    @Column(nullable = false)
    private Integer marks;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "quiz_id", nullable = false)
    private Quiz quiz;
}
