package com.banfico.banking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "account_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AccountRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @Column(nullable = false)
    private String accountType;
    private String remarks;
    @Column(nullable = false)
    private String status;
    @Column(nullable = false)
    private LocalDateTime requestedAt;
    private String reviewedByMaker;
    private LocalDateTime reviewedAt;
    private String approvedByChecker;
    private LocalDateTime approvedAt;
    private String rejectionReason;
}