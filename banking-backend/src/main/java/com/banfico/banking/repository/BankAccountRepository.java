package com.banfico.banking.repository;

import com.banfico.banking.entity.BankAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
	java.util.Optional<BankAccount> findByAccountNumber(String accountNumber);
	boolean existsByAccountNumber(String accountNumber);
	java.util.List<BankAccount> findByCustomerId(Long customerId);
}