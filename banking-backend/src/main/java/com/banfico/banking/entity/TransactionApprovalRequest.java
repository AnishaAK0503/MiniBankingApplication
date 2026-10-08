package com.banfico.banking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "transaction_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TransactionApprovalRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "account_id")
    private BankAccount account;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String type;

    private String description;

    @Column(nullable = false, unique = true)
    private String referenceNumber;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String requestedBy;

    private String requestedByName;
    private String approvedBy;
    private String rejectionReason;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private LocalDateTime reviewedAt;

    @OneToOne
    @JoinColumn(name = "transaction_id")
    private BankTransaction transaction;
}