package com.banfico.banking.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DeleteReasonRequest {
    @NotBlank(message = "Deletion reason is required")
    private String reason;
}
