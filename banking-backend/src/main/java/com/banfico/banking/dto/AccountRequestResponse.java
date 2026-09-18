package com.banfico.banking.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AccountRequestResponse {
    private Long id;
    private Long customerId;
    private String customerName;
    private String accountType;
    private String remarks;
    private String status;
    private LocalDateTime requestedAt;
    private String reviewedByMaker;
    private LocalDateTime reviewedAt;
    private String approvedByChecker;
    private LocalDateTime approvedAt;
    private String rejectionReason;
    private AccountResponse account;
}