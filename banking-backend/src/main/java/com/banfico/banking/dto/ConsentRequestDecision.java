package com.banfico.banking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ConsentRequestDecision {
    @NotBlank(message = "Decision is required")
    private String decision;

    private String rejectionReason;
}
