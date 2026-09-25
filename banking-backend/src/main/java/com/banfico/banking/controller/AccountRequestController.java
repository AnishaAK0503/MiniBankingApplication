package com.banfico.banking.controller;

import com.banfico.banking.dto.AccountRequestCreate;
import com.banfico.banking.dto.AccountRequestDecision;
import com.banfico.banking.dto.AccountRequestResponse;
import com.banfico.banking.service.AccountRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/account-requests")
@CrossOrigin(origins = "http://localhost:4200")
public class AccountRequestController {
    private final AccountRequestService service;
    public AccountRequestController(AccountRequestService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public AccountRequestResponse create(@Valid @RequestBody AccountRequestCreate input, Authentication authentication) { return service.create(input, authentication); }

    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public List<AccountRequestResponse> list(@RequestParam(required = false) Long customerId, Authentication authentication) { return service.list(customerId, authentication); }

    @GetMapping("/pending-approval")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public List<AccountRequestResponse> pendingApproval() { return service.pendingApproval(); }

    @PutMapping("/{id}/submit")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public AccountRequestResponse submit(@PathVariable Long id, @RequestBody AccountRequestDecision input, Authentication authentication) { return service.submitForApproval(id, input); }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public AccountRequestResponse approve(@PathVariable Long id, @RequestBody AccountRequestDecision input, Authentication authentication) { input.setActorName(com.banfico.banking.service.NotificationService.displayName(authentication)); return service.approve(id, input); }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public AccountRequestResponse reject(@PathVariable Long id, @RequestBody AccountRequestDecision input, Authentication authentication) { input.setActorName(com.banfico.banking.service.NotificationService.displayName(authentication)); return service.reject(id, input); }
}