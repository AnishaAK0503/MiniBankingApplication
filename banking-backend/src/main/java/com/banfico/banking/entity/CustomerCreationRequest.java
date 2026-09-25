package com.banfico.banking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "customer_creation_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CustomerCreationRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = false)
    private String email;

    @Column(nullable = false)
    private String phone;

    @Column(nullable = false)
    private String requestedBy;
    private String requestedByName;

    @Column(nullable = false)
    private String status;

    private String reviewedBy;
    private String rejectionReason;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;

    @OneToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;
}
