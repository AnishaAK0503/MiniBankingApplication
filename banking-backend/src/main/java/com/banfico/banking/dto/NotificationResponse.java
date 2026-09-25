package com.banfico.banking.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private String title;
    private String message;
    private String type;
    private String referenceType;
    private Long referenceId;
    private boolean read;
    private LocalDateTime createdAt;
}
