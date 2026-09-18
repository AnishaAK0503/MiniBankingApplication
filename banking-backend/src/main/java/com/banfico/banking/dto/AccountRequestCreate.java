package com.banfico.banking.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AccountRequestCreate {
    @NotNull
    private Long customerId;
    @NotBlank
    private String accountType;
    private String remarks;
}