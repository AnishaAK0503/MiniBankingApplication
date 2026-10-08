package com.banfico.banking.controller;

import com.banfico.banking.dto.ConsentRequestCreate;
import com.banfico.banking.dto.ConsentRequestDecision;
import com.banfico.banking.dto.ConsentRequestResponse;
import com.banfico.banking.service.ConsentRequestService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/consents")
@CrossOrigin(origins = "http://localhost:4200")
public class ConsentRequestController {
    private final ConsentRequestService service;

    public ConsentRequestController(ConsentRequestService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ConsentRequestResponse create(@Valid @RequestBody ConsentRequestCreate input, Authentication authentication) {
        return service.create(input, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('CUSTOMER', 'MAKER', 'CHECKER', 'ADMIN')")
    public List<ConsentRequestResponse> list(Authentication authentication) {
        return service.list(authentication);
    }

    @GetMapping("/pending-approval")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public List<ConsentRequestResponse> pendingApproval() {
        return service.pendingApproval();
    }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public ConsentRequestResponse approve(@PathVariable Long id, Authentication authentication) {
        return service.approve(id, authentication);
    }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public ConsentRequestResponse reject(@PathVariable Long id, @Valid @RequestBody ConsentRequestDecision input, Authentication authentication) {
        return service.reject(id, input, authentication);
    }

    @PutMapping("/{id}/revoke")
    @PreAuthorize("hasAnyRole('CUSTOMER', 'ADMIN')")
    public ConsentRequestResponse revoke(@PathVariable Long id, Authentication authentication) {
        return service.revoke(id, authentication);
    }
}
