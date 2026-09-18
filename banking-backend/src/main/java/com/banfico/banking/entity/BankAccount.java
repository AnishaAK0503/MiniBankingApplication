package com.banfico.banking.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;
import java.time.LocalDateTime;

@Entity
@Table(name = "bank_accounts")
@Data
@NoArgsConstructor
@AllArgsConstructor

public class BankAccount {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String accountNumber;
    private String accountType;
    private Double balance;
    private String status;
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "account")
    private List<BankTransaction> transactions;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;
}
