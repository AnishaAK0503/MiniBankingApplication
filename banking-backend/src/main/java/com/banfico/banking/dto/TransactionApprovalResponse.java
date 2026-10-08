package com.banfico.banking.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TransactionApprovalResponse {
    private Long id;
    private Long accountId;
    private String accountNumber;
    private String customerName;
    private Double amount;
    private String type;
    private String description;
    private String referenceNumber;
    private String status;
    private String requestedBy;
    private String approvedBy;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long transactionId;
}