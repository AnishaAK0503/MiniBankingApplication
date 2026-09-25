package com.banfico.banking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class RequestDecision {
    private String actorName;

    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
}
