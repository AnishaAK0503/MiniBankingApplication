package com.banfico.banking.dto;

import lombok.Data;

@Data
public class BeneficiaryRequest {
    private String name;

    private String accountNumber;

    private String bankName;

    private String ifsc;

    private String confirmAccountNumber;

    private Long customerId;

    private Long internalAccountId;
}