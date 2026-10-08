package com.banfico.banking.controller;

import com.banfico.banking.dto.TransferCreateRequest;
import com.banfico.banking.dto.TransferDecisionRequest;
import com.banfico.banking.dto.TransferResponse;
import com.banfico.banking.service.NotificationService;
import com.banfico.banking.service.TransferService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transfers")
@CrossOrigin(origins = "http://localhost:4200")
public class TransferController {
    private final TransferService service;

    public TransferController(TransferService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'ADMIN')")
    public TransferResponse create(@Valid @RequestBody TransferCreateRequest request, Authentication authentication) {
        return service.create(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'CHECKER', 'ADMIN')")
    public List<TransferResponse> list(Authentication authentication) {
        return service.list(authentication);
    }

    @GetMapping("/pending-approval")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public List<TransferResponse> pendingApproval() {
        return service.pendingApproval();
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public TransferResponse approve(@PathVariable Long id, Authentication authentication) {
        return service.approve(id, authentication);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public TransferResponse reject(@PathVariable Long id, @RequestBody TransferDecisionRequest request, Authentication authentication) {
        return service.reject(id, request, authentication);
    }
}
