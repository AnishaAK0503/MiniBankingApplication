package com.banfico.banking.repository;

import com.banfico.banking.entity.AccountRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AccountRequestRepository extends JpaRepository<AccountRequest, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from AccountRequest r where r.id = :id")
    java.util.Optional<AccountRequest> findLockedById(@Param("id") Long id);
    List<AccountRequest> findByCustomerId(Long customerId);
    List<AccountRequest> findByStatus(String status);
    List<AccountRequest> findByStatusIn(List<String> statuses);
    List<AccountRequest> findByRequestedByOrderByRequestedAtDesc(String requestedBy);
}