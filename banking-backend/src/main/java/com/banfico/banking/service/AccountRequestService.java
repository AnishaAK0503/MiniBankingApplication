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
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AccountRequestService {
    private final AccountRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final BankAccountRepository accountRepository;
    private final NotificationService notificationService;

    public AccountRequestService(AccountRequestRepository requestRepository, CustomerRepository customerRepository, BankAccountRepository accountRepository, NotificationService notificationService) {
        this.requestRepository = requestRepository;
        this.customerRepository = customerRepository;
        this.accountRepository = accountRepository;
        this.notificationService = notificationService;
    }

    public AccountRequestResponse create(AccountRequestCreate input, Authentication authentication) {
        Customer customer;
        if (input.getCustomerId() != null) {
            customer = customerRepository.findById(input.getCustomerId())
                    .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        } else {
            throw new IllegalArgumentException("Customer ID is required for staff-created requests");
        }
        String displayName = NotificationService.displayName(authentication);
        AccountRequest request = new AccountRequest(null, customer, normalizeType(input.getAccountType()), input.getRemarks(), "PENDING", LocalDateTime.now(), authentication.getName(), displayName, null, null, null, null, null, null);
        AccountRequest saved = requestRepository.save(request);
        notificationService.notifyRole("CHECKER", "New Account Creation Request", "A new account creation request has been submitted by " + displayName + ". Please review it.", "ACCOUNT_REQUEST_CREATED", "ACCOUNT_REQUEST", saved.getId());
        notificationService.notifyRole("ADMIN", "New Account Request", "A new account creation request has been submitted by " + displayName + ".", "ACCOUNT_REQUEST_CREATED", "ACCOUNT_REQUEST", saved.getId());
        return map(saved);
    }

    public List<AccountRequestResponse> all() { return requestRepository.findAll().stream().map(this::map).toList(); }
    public List<AccountRequestResponse> forCustomer(Long customerId) { return requestRepository.findByCustomerId(customerId).stream().map(this::map).toList(); }
    public List<AccountRequestResponse> list(Long customerId, Authentication authentication) {
        if (customerId != null) return forCustomer(customerId);
        boolean privileged = authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_CHECKER") || a.getAuthority().equals("ROLE_ADMIN"));
        return (privileged ? requestRepository.findAll() : requestRepository.findByRequestedByOrderByRequestedAtDesc(authentication.getName())).stream().map(this::map).toList();
    }
    public List<AccountRequestResponse> pendingApproval() { return requestRepository.findByStatus("PENDING_APPROVAL").stream().map(this::map).toList(); }

    @Transactional
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
        request.setAccount(saved);
        notificationService.notifyUser(request.getRequestedBy(), "MAKER", "Account Request Approved", "Your account creation request for " + request.getCustomer().getName() + " has been approved. Account " + saved.getAccountNumber() + " has been created.", "ACCOUNT_REQUEST_APPROVED", "ACCOUNT_REQUEST", id);
        notificationService.notifyRole("ADMIN", "Account Request Approved", "Account creation request submitted by " + request.getRequestedByName() + " has been approved and Account " + saved.getAccountNumber() + " has been created.", "ACCOUNT_REQUEST_APPROVED", "ACCOUNT_REQUEST", id);
        return map(requestRepository.save(request));
    }

    @Transactional
    public AccountRequestResponse reject(Long id, AccountRequestDecision input) {
        AccountRequest request = find(id);
        if (!"PENDING_APPROVAL".equals(request.getStatus())) throw new IllegalStateException("Only requests pending approval can be rejected");
        if (input.getRejectionReason() == null || input.getRejectionReason().isBlank()) throw new IllegalArgumentException("Rejection reason is required");
        request.setStatus("REJECTED");
        request.setRejectionReason(input.getRejectionReason());
        request.setApprovedByChecker(input.getActorName());
        request.setApprovedAt(LocalDateTime.now());
        notificationService.notifyUser(request.getRequestedBy(), "MAKER", "Account Request Rejected", "Your account creation request for " + request.getCustomer().getName() + " was rejected. Reason: " + input.getRejectionReason().trim(), "ACCOUNT_REQUEST_REJECTED", "ACCOUNT_REQUEST", id);
        notificationService.notifyRole("ADMIN", "Account Request Rejected", "Account creation request submitted by " + request.getRequestedByName() + " was rejected by " + input.getActorName() + ".", "ACCOUNT_REQUEST_REJECTED", "ACCOUNT_REQUEST", id);
        return map(requestRepository.save(request));
    }

    private AccountRequest find(Long id) { return requestRepository.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("Account request not found")); }
    private String normalizeType(String type) { return "CHECKING".equalsIgnoreCase(type) ? "CURRENT" : type.toUpperCase(); }


    private AccountRequestResponse map(AccountRequest request) {
        AccountRequestResponse response = new AccountRequestResponse();
        response.setId(request.getId()); response.setCustomerId(request.getCustomer().getId()); response.setCustomerName(request.getCustomer().getName());
        response.setAccountType(request.getAccountType()); response.setRemarks(request.getRemarks()); response.setStatus(request.getStatus()); response.setRequestedAt(request.getRequestedAt());
        response.setRequestedBy(request.getRequestedByName() == null ? request.getRequestedBy() : request.getRequestedByName());
        response.setReviewedByMaker(request.getReviewedByMaker()); response.setReviewedAt(request.getReviewedAt()); response.setApprovedByChecker(request.getApprovedByChecker()); response.setApprovedAt(request.getApprovedAt()); response.setRejectionReason(request.getRejectionReason());
        if (request.getAccount() != null) response.setAccount(mapAccount(request.getAccount()));
        return response;
    }

    private AccountResponse mapAccount(BankAccount account) {
        AccountResponse response = new AccountResponse();
        response.setId(account.getId()); response.setAccountNumber(account.getAccountNumber()); response.setAccountType(account.getAccountType()); response.setBalance(account.getBalance());
        response.setCustomerId(account.getCustomer().getId()); response.setCustomerName(account.getCustomer().getName()); response.setStatus(account.getStatus()); response.setCreatedAt(account.getCreatedAt());
        return response;
    }
}