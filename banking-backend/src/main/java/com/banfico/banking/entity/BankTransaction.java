package com.banfico.banking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_transactions")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class BankTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Double amount;
    private String type;
    private String counterpartyAccount;
    private String referenceId;
    private String description;
    private LocalDateTime  createdAt;
    private Double balanceAfter;

    @ManyToOne
    @JoinColumn(name = "account_id")
    private BankAccount account;
}