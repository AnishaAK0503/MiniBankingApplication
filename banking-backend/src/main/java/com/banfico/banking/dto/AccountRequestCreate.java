package com.banfico.banking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class AccountRequestCreate {
    private Long customerId;
    @NotBlank
    private String accountType;
    private String remarks;
}