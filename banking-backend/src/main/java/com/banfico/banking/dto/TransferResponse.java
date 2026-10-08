package com.banfico.banking.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TransferResponse {
    private Long id;
    private String referenceNumber;
    private Long sourceAccountId;
    private String sourceAccountNumber;
    private Long destinationAccountId;
    private String destinationAccountNumber;
    private String destinationCustomerName;
    private Double amount;
    private String description;
    private String status;
    private String initiatedBy;
    private String approvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String rejectionReason;
}
