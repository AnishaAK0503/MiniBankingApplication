package com.banfico.banking.controller;

import com.banfico.banking.dto.TransactionRequest;
import com.banfico.banking.dto.TransactionResponse;
import com.banfico.banking.service.TransactionService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@CrossOrigin(origins = "http://localhost:4200")
public class TransactionController {

    @Autowired
    private TransactionService transactionService;

    @PostMapping("/{accountId}/transactions")
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public TransactionResponse createTransaction(
            @PathVariable Long accountId,
            @Valid @RequestBody TransactionRequest request){
        return transactionService.createTransaction(
                accountId,
                request);
    }

    @GetMapping("/{accountId}/transactions")
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public List<TransactionResponse> getTransactions(
            @PathVariable Long accountId, Authentication authentication){
        return transactionService.getTransactions(accountId, authentication);

    }

}