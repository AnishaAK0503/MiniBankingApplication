package com.banfico.banking.controller;

import com.banfico.banking.dto.TransactionApprovalCreate;
import com.banfico.banking.dto.TransactionApprovalDecision;
import com.banfico.banking.dto.TransactionApprovalResponse;
import com.banfico.banking.service.TransactionApprovalService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transaction-requests")
@CrossOrigin(origins = "http://localhost:4200")
public class TransactionApprovalController {
    private final TransactionApprovalService service;

    public TransactionApprovalController(TransactionApprovalService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('MAKER')")
    public TransactionApprovalResponse create(@Valid @RequestBody TransactionApprovalCreate input, Authentication authentication) {
        return service.create(input, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public List<TransactionApprovalResponse> list(Authentication authentication) {
        return service.list(authentication);
    }

    @GetMapping("/pending-approval")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public List<TransactionApprovalResponse> pending() {
        return service.pending();
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public TransactionApprovalResponse approve(@PathVariable Long id, Authentication authentication) {
        return service.approve(id, authentication);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public TransactionApprovalResponse reject(@PathVariable Long id, @Valid @RequestBody TransactionApprovalDecision input, Authentication authentication) {
        return service.reject(id, input, authentication);
    }
}