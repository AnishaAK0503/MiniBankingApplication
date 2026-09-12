package com.banfico.banking.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TransactionResponse {
    private Long id;
    private Double amount;
    private String type;
    private String description;
    private LocalDateTime createdAt;
    private Long accountId;
}