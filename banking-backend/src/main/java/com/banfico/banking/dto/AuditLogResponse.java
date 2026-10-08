package com.banfico.banking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AuditLogResponse {
    private Long id;
    private String actor;
    private String action;
    private String entityType;
    private Long entityId;
    private LocalDateTime createdAt;
}
