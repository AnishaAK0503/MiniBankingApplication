package com.banfico.banking.dto;

import lombok.Data;

@Data
public class TransferDecisionRequest {
    private String rejectionReason;
    private String actorName;
}
