package com.banfico.banking.controller;

import com.banfico.banking.dto.CustomerCreationRequestResponse;
import com.banfico.banking.dto.CustomerRequest;
import com.banfico.banking.service.CustomerCreationRequestService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/customer-requests")
@CrossOrigin(origins = "http://localhost:4200")
public class CustomerCreationRequestController {
    private final CustomerCreationRequestService service;

    public CustomerCreationRequestController(CustomerCreationRequestService service) { this.service = service; }

    @PostMapping
    @PreAuthorize("hasRole('MAKER')")
    public CustomerCreationRequestResponse create(@Valid @RequestBody CustomerRequest input, Authentication authentication) { return service.create(input, authentication); }

    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public List<CustomerCreationRequestResponse> list(Authentication authentication) { return service.list(authentication); }

    @GetMapping("/pending-approval")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public List<CustomerCreationRequestResponse> pending() { return service.pending(); }

    @PutMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public CustomerCreationRequestResponse approve(@PathVariable Long id, Authentication authentication) { return service.approve(id, authentication); }

    @PutMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public CustomerCreationRequestResponse reject(@PathVariable Long id, @RequestParam String reason, Authentication authentication) { return service.reject(id, reason, authentication); }
}
