package com.banfico.banking.dto;

import lombok.Data;

@Data
public class AccountRequestDecision {
    private String actorName;
    private String rejectionReason;
}