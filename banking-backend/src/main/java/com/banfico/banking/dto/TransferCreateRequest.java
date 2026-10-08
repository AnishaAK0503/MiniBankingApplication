package com.banfico.banking.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class TransferCreateRequest {
    @NotNull(message = "Source account is required")
    private Long sourceAccountId;

    private Long destinationAccountId;

    private String destinationAccountNumber;

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
    private Double amount;

    private String description;
}
