package com.banfico.banking.repository;

import com.banfico.banking.entity.Transfer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransferRepository extends JpaRepository<Transfer, Long> {
    List<Transfer> findByInitiatedByOrderByCreatedAtDesc(String initiatedBy);
    List<Transfer> findBySourceAccountCustomerIdOrDestinationAccountCustomerIdOrderByCreatedAtDesc(Long sourceCustomerId, Long destinationCustomerId);
    List<Transfer> findByStatusOrderByCreatedAtDesc(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select t from Transfer t where t.id = :id")
    Optional<Transfer> findLockedById(@Param("id") Long id);
}
