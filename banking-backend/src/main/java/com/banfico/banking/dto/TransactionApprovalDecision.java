package com.banfico.banking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TransactionApprovalDecision {
    @NotBlank(message = "Rejection reason is required")
    private String rejectionReason;
}