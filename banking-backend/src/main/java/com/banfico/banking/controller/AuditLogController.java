package com.banfico.banking.controller;

import com.banfico.banking.dto.AuditLogResponse;
import com.banfico.banking.entity.AuditLog;
import com.banfico.banking.repository.AuditLogRepository;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/audit-logs")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {
    private final AuditLogRepository repository;

    public AuditLogController(AuditLogRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<AuditLogResponse> list() {
        return repository.findTop500ByOrderByCreatedAtDesc().stream().map(this::map).toList();
    }

    private AuditLogResponse map(AuditLog item) {
        AuditLogResponse response = new AuditLogResponse();
        response.setId(item.getId());
        response.setActor("*".equals(item.getActor()) ? "Role notification" : item.getActor());
        response.setAction(item.getAction());
        response.setEntityType(item.getEntityType());
        response.setEntityId(item.getEntityId());
        response.setCreatedAt(item.getCreatedAt());
        return response;
    }
}
