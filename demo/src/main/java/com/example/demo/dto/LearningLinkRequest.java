package com.example.demo.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class LearningLinkRequest {
    @NotBlank
    @Size(max = 255)
    private String label;

    @NotBlank
    @Size(max = 50)
    private String type;

    @NotBlank
    @Size(max = 2000)
    private String url;
}
