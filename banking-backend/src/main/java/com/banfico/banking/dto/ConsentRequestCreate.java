package com.banfico.banking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ConsentRequestCreate {
    @NotNull(message = "Account ID is required")
    private Long accountId;

    private Long beneficiaryId;

    private Double amount;

    @NotBlank(message = "Consent type is required")
    private String consentType;
}
