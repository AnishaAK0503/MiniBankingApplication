package com.banfico.banking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "consent_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConsentRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(optional = false)
    @JoinColumn(name = "account_id")
    private BankAccount account;

    @ManyToOne
    @JoinColumn(name = "beneficiary_id")
    private Beneficiary beneficiary;

    @Column(nullable = false)
    private String consentType;

    private Double amount;

    @Column(nullable = false)
    private String status;

    @Column(nullable = false)
    private String requestedBy;

    private String requestedByName;
    private String reviewedBy;
    private String rejectionReason;

    @Column(nullable = false)
    private LocalDateTime requestedAt;

    private LocalDateTime reviewedAt;
    private LocalDateTime expiresAt;
}
