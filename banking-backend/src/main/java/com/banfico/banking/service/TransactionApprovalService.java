package com.banfico.banking.service;

import com.banfico.banking.dto.TransactionApprovalCreate;
import com.banfico.banking.dto.TransactionApprovalDecision;
import com.banfico.banking.dto.TransactionApprovalResponse;
import com.banfico.banking.entity.BankAccount;
import com.banfico.banking.entity.BankTransaction;
import com.banfico.banking.entity.TransactionApprovalRequest;
import com.banfico.banking.exception.InsufficientBalanceException;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.BankTransactionRepository;
import com.banfico.banking.repository.TransactionApprovalRequestRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class TransactionApprovalService {
    private static final String PENDING = "PENDING_APPROVAL";
    private final TransactionApprovalRequestRepository requestRepository;
    private final BankAccountRepository accountRepository;
    private final BankTransactionRepository transactionRepository;
    private final NotificationService notificationService;

    public TransactionApprovalService(TransactionApprovalRequestRepository requestRepository,
            BankAccountRepository accountRepository,
            BankTransactionRepository transactionRepository,
            NotificationService notificationService) {
        this.requestRepository = requestRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.notificationService = notificationService;
    }

    @Transactional
    public TransactionApprovalResponse create(TransactionApprovalCreate input,
            Authentication authentication) {
        BankAccount account = accountRepository.findById(input.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        String type = normalizeType(input.getType());
        if (!"CREDIT".equals(type) && !"DEBIT".equals(type)) {
            throw new IllegalArgumentException(
                    "Transaction requests support deposits and withdrawals only");
        }
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new IllegalStateException("Account is not active");
        }
        TransactionApprovalRequest request = new TransactionApprovalRequest();
        request.setAccount(account);
        request.setAmount(input.getAmount());
        request.setType(type);
        request.setDescription(input.getDescription());
        request.setReferenceNumber(reference());
        request.setStatus(PENDING);
        request.setRequestedBy(authentication.getName());
        request.setRequestedByName(NotificationService.displayName(authentication));
        request.setCreatedAt(LocalDateTime.now());
        TransactionApprovalRequest saved = requestRepository.save(request);
        notificationService.notifyRole("CHECKER", "Transaction Request",
                "A " + type.toLowerCase() + " request is awaiting approval.",
                "TRANSACTION_REQUEST_CREATED", "TRANSACTION_REQUEST", saved.getId());
        notificationService.notifyRole("ADMIN", "Transaction Request",
                "A " + type.toLowerCase() + " request is awaiting approval.",
                "TRANSACTION_REQUEST_CREATED", "TRANSACTION_REQUEST", saved.getId());
        return map(saved);
    }

    public List<TransactionApprovalResponse> list(Authentication authentication) {
        boolean reviewer = authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_CHECKER")
                        || authority.getAuthority().equals("ROLE_ADMIN"));
        List<TransactionApprovalRequest> requests = reviewer ? requestRepository.findAll()
                : requestRepository.findByRequestedByOrderByCreatedAtDesc(authentication.getName());
        return requests.stream().map(this::map).toList();
    }

    public List<TransactionApprovalResponse> pending() {
        return requestRepository.findByStatusOrderByCreatedAtDesc(PENDING).stream().map(this::map)
                .toList();
    }

    @Transactional
    public TransactionApprovalResponse approve(Long id, Authentication authentication) {
        TransactionApprovalRequest request = findLocked(id);
        requirePending(request);
        if (request.getRequestedBy().equals(authentication.getName())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You cannot approve your own request");
        }
        BankAccount account = accountRepository.findLockedById(request.getAccount().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));
        if (!"ACTIVE".equalsIgnoreCase(account.getStatus())) {
            throw new IllegalStateException("Account is not active");
        }
        double balance = account.getBalance() == null ? 0D : account.getBalance();
        if ("DEBIT".equals(request.getType()) && balance < request.getAmount()) {
            throw new InsufficientBalanceException(
                    "Insufficient balance. Available balance: " + balance);
        }
        double updatedBalance = "DEBIT".equals(request.getType()) ? balance - request.getAmount()
                : balance + request.getAmount();
        account.setBalance(updatedBalance);
        accountRepository.save(account);

        BankTransaction transaction = new BankTransaction();
        transaction.setAccount(account);
        transaction.setAmount(request.getAmount());
        transaction.setType(request.getType());
        transaction.setReferenceId(request.getReferenceNumber());
        transaction.setDescription(request.getDescription());
        transaction.setBalanceAfter(updatedBalance);
        transaction.setCreatedAt(LocalDateTime.now());
        request.setTransaction(transactionRepository.save(transaction));
        request.setStatus("APPROVED");
        request.setApprovedBy(NotificationService.displayName(authentication));
        request.setReviewedAt(LocalDateTime.now());
        TransactionApprovalRequest saved = requestRepository.save(request);
        notificationService.notifyUser(saved.getRequestedBy(), "MAKER",
                "Transaction Request Approved",
                "Your " + saved.getType().toLowerCase() + " request was approved.",
                "TRANSACTION_REQUEST_APPROVED", "TRANSACTION_REQUEST", id);
        return map(saved);
    }

    @Transactional
    public TransactionApprovalResponse reject(Long id, TransactionApprovalDecision input,
            Authentication authentication) {
        TransactionApprovalRequest request = findLocked(id);
        requirePending(request);
        if (request.getRequestedBy().equals(authentication.getName())) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You cannot reject your own request");
        }
        request.setStatus("REJECTED");
        request.setApprovedBy(NotificationService.displayName(authentication));
        request.setRejectionReason(input.getRejectionReason().trim());
        request.setReviewedAt(LocalDateTime.now());
        TransactionApprovalRequest saved = requestRepository.save(request);
        notificationService.notifyUser(saved.getRequestedBy(), "MAKER",
                "Transaction Request Rejected",
                "Your transaction request was rejected. Reason: " + saved.getRejectionReason(),
                "TRANSACTION_REQUEST_REJECTED", "TRANSACTION_REQUEST", id);
        return map(saved);
    }

    private TransactionApprovalRequest findLocked(Long id) {
        return requestRepository.findLockedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction request not found"));
    }

    private void requirePending(TransactionApprovalRequest request) {
        if (!PENDING.equals(request.getStatus()))
            throw new IllegalStateException("Only pending transaction requests can be processed");
    }

    private String normalizeType(String type) {
        String normalized = type.trim().toUpperCase();
        if ("DEPOSIT".equals(normalized))
            return "CREDIT";
        if ("WITHDRAWAL".equals(normalized))
            return "DEBIT";
        return normalized;
    }

    private String reference() {
        return "TXR-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private TransactionApprovalResponse map(TransactionApprovalRequest request) {
        TransactionApprovalResponse response = new TransactionApprovalResponse();
        response.setId(request.getId());
        response.setAccountId(request.getAccount().getId());
        response.setAccountNumber(request.getAccount().getAccountNumber());
        response.setCustomerName(request.getAccount().getCustomer().getName());
        response.setAmount(request.getAmount());
        response.setType(request.getType());
        response.setDescription(request.getDescription());
        response.setReferenceNumber(request.getReferenceNumber());
        response.setStatus(request.getStatus());
        response.setRequestedBy(request.getRequestedByName() == null ? request.getRequestedBy()
                : request.getRequestedByName());
        response.setApprovedBy(request.getApprovedBy());
        response.setRejectionReason(request.getRejectionReason());
        response.setCreatedAt(request.getCreatedAt());
        response.setReviewedAt(request.getReviewedAt());
        response.setTransactionId(
                request.getTransaction() == null ? null : request.getTransaction().getId());
        return response;
    }
}