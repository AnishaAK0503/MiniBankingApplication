package com.banfico.banking.controller;

import com.banfico.banking.dto.AccountRequest;
import com.banfico.banking.dto.AccountResponse;
import com.banfico.banking.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "http://localhost:4200")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public AccountResponse createAccount(
            @Valid @RequestBody AccountRequest request) {
        return accountService.createAccount(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public List<AccountResponse> getAllAccounts(Authentication authentication) {
        return accountService.getAllAccounts(authentication);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public AccountResponse getAccountById(
            @PathVariable Long id, Authentication authentication) {
        return accountService.getAccountById(id, authentication);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteAccount(@PathVariable Long id, @Valid @RequestBody com.banfico.banking.dto.DeleteReasonRequest request, Authentication authentication) {
        accountService.deleteAccount(id, request.getReason(), authentication);
    }

}