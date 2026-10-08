package com.banfico.banking.repository;

import com.banfico.banking.entity.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findTop500ByOrderByCreatedAtDesc();
}
