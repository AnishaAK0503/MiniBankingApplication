package com.banfico.banking.dto;

import lombok.Data;

@Data
public class AccountResponse {
    private Long id;
    private String accountNumber;
    private String accountType;
    private Double balance;
    private Long customerId;
    private String customerName;
}