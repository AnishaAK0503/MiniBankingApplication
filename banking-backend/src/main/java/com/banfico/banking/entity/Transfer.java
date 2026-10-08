package com.banfico.banking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "transfers")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Transfer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String referenceNumber;

    @ManyToOne(optional = false)
    @JoinColumn(name = "source_account_id")
    private BankAccount sourceAccount;

    @ManyToOne(optional = false)
    @JoinColumn(name = "destination_account_id")
    private BankAccount destinationAccount;

    @Column(nullable = false)
    private Double amount;

    private String description;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String initiatedBy;

    private String initiatedByName;
    private String approvedBy;
    private LocalDateTime createdAt;
    private LocalDateTime completedAt;
    private String rejectionReason;
}
