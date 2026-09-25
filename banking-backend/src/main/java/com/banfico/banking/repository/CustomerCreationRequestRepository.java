package com.banfico.banking.repository;

import com.banfico.banking.entity.CustomerCreationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CustomerCreationRequestRepository extends JpaRepository<CustomerCreationRequest, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from CustomerCreationRequest r where r.id = :id")
    java.util.Optional<CustomerCreationRequest> findLockedById(@Param("id") Long id);
    List<CustomerCreationRequest> findByRequestedByOrderByCreatedAtDesc(String requestedBy);
    List<CustomerCreationRequest> findByStatusOrderByCreatedAtDesc(String status);
}
