package com.banfico.banking.repository;

import com.banfico.banking.entity.AccountRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AccountRequestRepository extends JpaRepository<AccountRequest, Long> {
    List<AccountRequest> findByCustomerId(Long customerId);
    List<AccountRequest> findByStatus(String status);
    List<AccountRequest> findByStatusIn(List<String> statuses);
}