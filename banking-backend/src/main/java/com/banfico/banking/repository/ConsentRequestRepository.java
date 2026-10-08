package com.banfico.banking.repository;

import com.banfico.banking.entity.ConsentRequest;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConsentRequestRepository extends JpaRepository<ConsentRequest, Long> {
    List<ConsentRequest> findByCustomerIdOrderByRequestedAtDesc(Long customerId);
    List<ConsentRequest> findByStatusOrderByRequestedAtDesc(String status);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select c from ConsentRequest c where c.id = :id")
    Optional<ConsentRequest> findLockedById(@Param("id") Long id);
}
