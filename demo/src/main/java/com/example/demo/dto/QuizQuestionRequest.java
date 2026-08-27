package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizQuestionRequest {

    @NotBlank
    @Size(max = 2000)
    private String questionText;

    @NotBlank
    @Size(max = 500)
    private String optionA;

    @NotBlank
    @Size(max = 500)
    private String optionB;

    @NotBlank
    @Size(max = 500)
    private String optionC;

    @NotBlank
    @Size(max = 500)
    private String optionD;

    @NotBlank
    @Size(max = 1)
    private String correctOption;

    @NotNull
    private Integer marks;
}
