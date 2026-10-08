package com.banfico.banking.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class ConsentRequestResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private Long accountId;
    private String accountNumber;
    private Long beneficiaryId;
    private String beneficiaryName;
    private String consentType;
    private Double amount;
    private String status;
    private String requestedBy;
    private String reviewedBy;
    private String rejectionReason;
    private LocalDateTime requestedAt;
    private LocalDateTime reviewedAt;
    private LocalDateTime expiresAt;
}
