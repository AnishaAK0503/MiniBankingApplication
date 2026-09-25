package com.banfico.banking.service;

import com.banfico.banking.dto.AccountRequest;
import com.banfico.banking.dto.AccountResponse;
import com.banfico.banking.entity.BankAccount;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.CustomerRepository;
import com.banfico.banking.repository.BankTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.core.Authentication;
import java.util.List;
import java.util.stream.Collectors;
import java.time.LocalDateTime;

@Service
public class AccountService {

    @Autowired
    private BankAccountRepository accountRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private BankTransactionRepository transactionRepository;
    @Autowired
    private NotificationService notificationService;

    public AccountResponse createAccount(AccountRequest request) {
        if (accountRepository.existsByAccountNumber(request.getAccountNumber().trim())) {
            throw new IllegalArgumentException("Account number already exists");
        }
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Customer not found"));

        BankAccount account = new BankAccount();
        account.setAccountNumber(request.getAccountNumber().trim());
        String accountType = request.getAccountType().trim().toUpperCase();
        if (!List.of("SAVINGS", "CURRENT", "CHECKING").contains(accountType)) throw new IllegalArgumentException("Account type must be SAVINGS or CURRENT");
        account.setAccountType("CHECKING".equals(accountType) ? "CURRENT" : accountType);
        account.setBalance(request.getBalance());
        account.setStatus("ACTIVE");
        account.setCreatedAt(LocalDateTime.now());
        account.setCustomer(customer);

        BankAccount savedAccount = accountRepository.save(account);

        return mapToResponse(savedAccount);
    }

    public List<AccountResponse> getAllAccounts(Authentication authentication) {
        return accountRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public AccountResponse getAccountById(Long id, Authentication authentication) {
        BankAccount account = accountRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Account not found"));
        return mapToResponse(account);
    }

    @Transactional
    public void deleteAccount(Long id, String reason, Authentication authentication) {
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Deletion reason is required");
        BankAccount account = accountRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (!transactionRepository.findByAccountId(id).isEmpty()) throw new IllegalStateException("Account cannot be deleted while transactions exist");
        accountRepository.delete(account);
        String actor = NotificationService.displayName(authentication);
        notificationService.notifyRole("MAKER", "Account Deleted", "Account " + account.getAccountNumber() + " was deleted by " + actor + ". Reason: " + reason.trim(), "ACCOUNT_DELETED", "ACCOUNT", id);
        notificationService.notifyRole("CHECKER", "Account Deleted", "Account " + account.getAccountNumber() + " was deleted by " + actor + ". Reason: " + reason.trim(), "ACCOUNT_DELETED", "ACCOUNT", id);
    }

    private AccountResponse mapToResponse(BankAccount account) {
        AccountResponse response = new AccountResponse();
        response.setId(account.getId());
        response.setAccountNumber(account.getAccountNumber());
        response.setAccountType(account.getAccountType());
        response.setBalance(account.getBalance());

        response.setCustomerId(account.getCustomer().getId());
        response.setCustomerName(account.getCustomer().getName());
        response.setStatus(account.getStatus() == null ? "ACTIVE" : account.getStatus());
        response.setCreatedAt(account.getCreatedAt());
        return response;
    }

}