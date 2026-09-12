package com.banfico.banking.service;

import com.banfico.banking.dto.TransactionRequest;
import com.banfico.banking.dto.TransactionResponse;
import com.banfico.banking.entity.BankAccount;
import com.banfico.banking.entity.BankTransaction;
import com.banfico.banking.exception.InsufficientBalanceException;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.BankTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @Autowired
    private BankTransactionRepository transactionRepository;
    @Autowired
    private BankAccountRepository accountRepository;

    public TransactionResponse createTransaction(Long accountId,
                                                 TransactionRequest request) {
        BankAccount account = accountRepository.findById(accountId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Account not found"));

        if (request.getType().equalsIgnoreCase("DEBIT")) {
            if (account.getBalance() < request.getAmount()) {
                throw new InsufficientBalanceException(
                        "Insufficient Balance");
            }
            account.setBalance(
                    account.getBalance() - request.getAmount());
        }
        else if (request.getType().equalsIgnoreCase("CREDIT")) {
            account.setBalance(
                    account.getBalance() + request.getAmount());

        }
        accountRepository.save(account);

        BankTransaction transaction = new BankTransaction();
        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setDescription(request.getDescription());
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setAccount(account);

        BankTransaction saved =
                transactionRepository.save(transaction);
        return map(saved);

    }

    public List<TransactionResponse> getTransactions(Long accountId){
        return transactionRepository.findByAccountId(accountId)
                .stream()
                .map(this::map)
                .collect(Collectors.toList());
    }

    private TransactionResponse map(BankTransaction transaction){
        TransactionResponse response =
                new TransactionResponse();

        response.setId(transaction.getId());
        response.setAmount(transaction.getAmount());
        response.setType(transaction.getType());
        response.setDescription(transaction.getDescription());
        response.setCreatedAt(transaction.getCreatedAt());
        response.setAccountId(
                transaction.getAccount().getId());
        return response;
    }
}