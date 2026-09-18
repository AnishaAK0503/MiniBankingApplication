package com.banfico.banking.controller;

import com.banfico.banking.dto.AccountRequestCreate;
import com.banfico.banking.dto.AccountRequestDecision;
import com.banfico.banking.dto.AccountRequestResponse;
import com.banfico.banking.service.AccountRequestService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-requests")
@CrossOrigin(origins = "http://localhost:4200")
public class AccountRequestController {
    private final AccountRequestService service;
    public AccountRequestController(AccountRequestService service) { this.service = service; }

    @PostMapping public AccountRequestResponse create(@Valid @RequestBody AccountRequestCreate input) { return service.create(input); }
    @GetMapping public List<AccountRequestResponse> list(@RequestParam(required = false) Long customerId) { return customerId == null ? service.all() : service.forCustomer(customerId); }
    @GetMapping("/pending-approval") public List<AccountRequestResponse> pendingApproval() { return service.pendingApproval(); }
    @PutMapping("/{id}/submit") public AccountRequestResponse submit(@PathVariable Long id, @RequestBody AccountRequestDecision input) { return service.submitForApproval(id, input); }
    @PutMapping("/{id}/approve") public AccountRequestResponse approve(@PathVariable Long id, @RequestBody AccountRequestDecision input) { return service.approve(id, input); }
    @PutMapping("/{id}/reject") public AccountRequestResponse reject(@PathVariable Long id, @RequestBody AccountRequestDecision input) { return service.reject(id, input); }
}