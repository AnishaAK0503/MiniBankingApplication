package com.banfico.banking.service;

import com.banfico.banking.dto.TransactionRequest;
import com.banfico.banking.dto.TransactionResponse;
import com.banfico.banking.entity.BankAccount;
import com.banfico.banking.entity.BankTransaction;
import com.banfico.banking.exception.InsufficientBalanceException;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.BankTransactionRepository;
import com.banfico.banking.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    @Autowired
    private BankTransactionRepository transactionRepository;
    @Autowired
    private BankAccountRepository accountRepository;
        @Autowired
        private CustomerRepository customerRepository;

        @Transactional
        public TransactionResponse createTransaction(Long accountId,
                                                 TransactionRequest request) {
                String type = request.getType().trim().toUpperCase();
                if ("DEPOSIT".equals(type)) type = "CREDIT";
                if ("WITHDRAWAL".equals(type)) type = "DEBIT";
                if (!"DEBIT".equals(type) && !"CREDIT".equals(type) && !"TRANSFER".equals(type)) {
                        throw new IllegalArgumentException("Transaction type must be CREDIT, DEBIT, or TRANSFER");
                }
        BankAccount account = accountRepository.findById(accountId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Account not found"));

        if ("DEBIT".equals(type) || "TRANSFER".equals(type)) {
            if (account.getBalance() < request.getAmount()) {
                throw new InsufficientBalanceException(
                        "Insufficient Balance");
            }
            account.setBalance(
                    account.getBalance() - request.getAmount());
                        if ("TRANSFER".equals(type)) {
                                if (request.getCounterpartyAccount() == null || request.getCounterpartyAccount().isBlank()) {
                                        throw new IllegalArgumentException("Counterparty account is required for transfers");
                                }
                                BankAccount destination = accountRepository.findByAccountNumber(request.getCounterpartyAccount())
                                                .orElseThrow(() -> new ResourceNotFoundException("Counterparty account not found"));
                                destination.setBalance((destination.getBalance() == null ? 0D : destination.getBalance()) + request.getAmount());
                                accountRepository.save(destination);
                        }
        }
        else {
            account.setBalance(
                    account.getBalance() + request.getAmount());

        }
        accountRepository.save(account);

        BankTransaction transaction = new BankTransaction();
        transaction.setAmount(request.getAmount());
        transaction.setType(type);
        transaction.setCounterpartyAccount(request.getCounterpartyAccount());
        transaction.setReferenceId(request.getReferenceId());
        transaction.setDescription(request.getDescription());
        transaction.setCreatedAt(LocalDateTime.now());
        transaction.setAccount(account);
        transaction.setBalanceAfter(account.getBalance());

        BankTransaction saved =
                transactionRepository.save(transaction);
        return map(saved);

    }

        public List<TransactionResponse> getTransactions(Long accountId, Authentication authentication){
                BankAccount account = accountRepository.findById(accountId)
                                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
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
        response.setCounterpartyAccount(transaction.getCounterpartyAccount());
        response.setReferenceId(transaction.getReferenceId());
        response.setDescription(transaction.getDescription());
        response.setCreatedAt(transaction.getCreatedAt());
        response.setAccountId(
                transaction.getAccount().getId());
        response.setBalanceAfter(transaction.getBalanceAfter());
        return response;
    }
}