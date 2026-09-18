package com.banfico.banking.service;

import com.banfico.banking.dto.AccountRequestCreate;
import com.banfico.banking.dto.AccountRequestDecision;
import com.banfico.banking.dto.AccountRequestResponse;
import com.banfico.banking.dto.AccountResponse;
import com.banfico.banking.entity.AccountRequest;
import com.banfico.banking.entity.BankAccount;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.AccountRequestRepository;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.CustomerRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountRequestService {
    private final AccountRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final BankAccountRepository accountRepository;

    public AccountRequestService(AccountRequestRepository requestRepository, CustomerRepository customerRepository, BankAccountRepository accountRepository) {
        this.requestRepository = requestRepository;
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
    }

    public AccountRequestResponse create(AccountRequestCreate input) {
        Customer customer = customerRepository.findById(input.getCustomerId()).orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        AccountRequest request = new AccountRequest(null, customer, normalizeType(input.getAccountType()), input.getRemarks(), "PENDING", LocalDateTime.now(), null, null, null, null, null);
        return map(requestRepository.save(request));
    }

    public List<AccountRequestResponse> all() { return requestRepository.findAll().stream().map(this::map).toList(); }
    public List<AccountRequestResponse> forCustomer(Long customerId) { return requestRepository.findByCustomerId(customerId).stream().map(this::map).toList(); }
    public List<AccountRequestResponse> pendingApproval() { return requestRepository.findByStatus("PENDING_APPROVAL").stream().map(this::map).toList(); }

    public AccountRequestResponse submitForApproval(Long id, AccountRequestDecision input) {
        AccountRequest request = find(id);
        if (!"PENDING".equals(request.getStatus())) throw new IllegalStateException("Only pending requests can be submitted for approval");
        request.setStatus("PENDING_APPROVAL");
        request.setReviewedByMaker(input.getActorName());
        request.setReviewedAt(LocalDateTime.now());
        return map(requestRepository.save(request));
    }

    @Transactional
    public AccountRequestResponse approve(Long id, AccountRequestDecision input) {
        AccountRequest request = find(id);
        if (!"PENDING_APPROVAL".equals(request.getStatus())) throw new IllegalStateException("Only requests pending approval can be approved");
        BankAccount account = new BankAccount();
        account.setAccountNumber("PENDING-" + System.nanoTime());
        account.setAccountType(request.getAccountType());
        account.setBalance(0D);
        account.setStatus("ACTIVE");
        account.setCreatedAt(LocalDateTime.now());
        account.setCustomer(request.getCustomer());
        BankAccount saved = accountRepository.save(account);
        saved.setAccountNumber("AC" + String.format("%06d", saved.getId()));
        accountRepository.save(saved);
        request.setStatus("APPROVED");
        request.setApprovedByChecker(input.getActorName());
        request.setApprovedAt(LocalDateTime.now());
        return map(requestRepository.save(request));
    }

    public AccountRequestResponse reject(Long id, AccountRequestDecision input) {
        AccountRequest request = find(id);
        if (!"PENDING_APPROVAL".equals(request.getStatus())) throw new IllegalStateException("Only requests pending approval can be rejected");
        if (input.getRejectionReason() == null || input.getRejectionReason().isBlank()) throw new IllegalArgumentException("Rejection reason is required");
        request.setStatus("REJECTED");
        request.setRejectionReason(input.getRejectionReason());
        request.setApprovedByChecker(input.getActorName());
        request.setApprovedAt(LocalDateTime.now());
        return map(requestRepository.save(request));
    }

    private AccountRequest find(Long id) { return requestRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Account request not found")); }
    private String normalizeType(String type) { return "CHECKING".equalsIgnoreCase(type) ? "CURRENT" : type.toUpperCase(); }

    private AccountRequestResponse map(AccountRequest request) {
        AccountRequestResponse response = new AccountRequestResponse();
        response.setId(request.getId()); response.setCustomerId(request.getCustomer().getId()); response.setCustomerName(request.getCustomer().getName());
        response.setAccountType(request.getAccountType()); response.setRemarks(request.getRemarks()); response.setStatus(request.getStatus()); response.setRequestedAt(request.getRequestedAt());
        response.setReviewedByMaker(request.getReviewedByMaker()); response.setReviewedAt(request.getReviewedAt()); response.setApprovedByChecker(request.getApprovedByChecker()); response.setApprovedAt(request.getApprovedAt()); response.setRejectionReason(request.getRejectionReason());
        return response;
    }
}