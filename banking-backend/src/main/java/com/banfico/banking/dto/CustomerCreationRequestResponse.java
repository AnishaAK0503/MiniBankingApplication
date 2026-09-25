package com.banfico.banking.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CustomerCreationRequestResponse {
    private Long id;
    private String name;
    private String email;
    private String phone;
    private String requestedBy;
    private String status;
    private String reviewedBy;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private Long customerId;
}
