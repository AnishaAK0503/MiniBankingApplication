package com.banfico.banking.repository;

import com.banfico.banking.entity.TransactionApprovalRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TransactionApprovalRequestRepository extends JpaRepository<TransactionApprovalRequest, Long> {
    List<TransactionApprovalRequest> findByRequestedByOrderByCreatedAtDesc(String requestedBy);
    List<TransactionApprovalRequest> findByStatusOrderByCreatedAtDesc(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from TransactionApprovalRequest r where r.id = :id")
    Optional<TransactionApprovalRequest> findLockedById(@Param("id") Long id);
}