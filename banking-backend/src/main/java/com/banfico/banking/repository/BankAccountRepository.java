package com.banfico.banking.repository;

import com.banfico.banking.entity.BankAccount;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface BankAccountRepository extends JpaRepository<BankAccount, Long> {
	java.util.Optional<BankAccount> findByAccountNumber(String accountNumber);
	boolean existsByAccountNumber(String accountNumber);
	java.util.List<BankAccount> findByCustomerId(Long customerId);

	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("select a from BankAccount a where a.id = :id")
	java.util.Optional<BankAccount> findLockedById(@Param("id") Long id);
}