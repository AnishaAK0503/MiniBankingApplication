package com.banfico.banking.dto;

import lombok.Data;

@Data
public class BeneficiaryResponse {
    private Long id;
    private String name;
    private String accountNumber;
    private String bankName;
    private Long customerId;
}