package com.banfico.banking.service;

import com.banfico.banking.dto.TransferCreateRequest;
import com.banfico.banking.dto.TransferDecisionRequest;
import com.banfico.banking.dto.TransferResponse;
import com.banfico.banking.entity.BankAccount;
import com.banfico.banking.entity.BankTransaction;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.entity.Transfer;
import com.banfico.banking.exception.InsufficientBalanceException;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.BankTransactionRepository;
import com.banfico.banking.repository.TransferRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
public class TransferService {
    private static final String PENDING_APPROVAL = "PENDING_APPROVAL";
    private static final String COMPLETED = "COMPLETED";
    private final TransferRepository transferRepository;
    private final BankAccountRepository accountRepository;
    private final BankTransactionRepository transactionRepository;
    private final CustomerIdentityService identityService;
    private final NotificationService notificationService;
    private final ConsentRequestService consentRequestService;

    public TransferService(TransferRepository transferRepository,
            BankAccountRepository accountRepository,
            BankTransactionRepository transactionRepository,
            CustomerIdentityService identityService, NotificationService notificationService,
            ConsentRequestService consentRequestService) {
        this.transferRepository = transferRepository;
        this.accountRepository = accountRepository;
        this.transactionRepository = transactionRepository;
        this.identityService = identityService;
        this.notificationService = notificationService;
        this.consentRequestService = consentRequestService;
    }

    @Transactional
    public TransferResponse create(TransferCreateRequest input, Authentication authentication) {
        BankAccount source = accountRepository.findById(input.getSourceAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));
        BankAccount destination = resolveDestination(input);
        validateAccounts(source, destination);
        if (identityService.hasRole(authentication, "CUSTOMER")) {
            identityService.requireCustomerOwner(source.getCustomer(), authentication);
        }

        Transfer transfer = new Transfer();
        transfer.setReferenceNumber(reference());
        transfer.setSourceAccount(source);
        transfer.setDestinationAccount(destination);
        transfer.setAmount(input.getAmount());
        transfer.setDescription(input.getDescription());
        transfer.setInitiatedBy(identityService.hasRole(authentication, "CUSTOMER")
                ? identityService.currentCustomer(authentication).getEmail()
                : authentication.getName());
        transfer.setInitiatedByName(NotificationService.displayName(authentication));
        transfer.setCreatedAt(LocalDateTime.now());

        if (identityService.hasRole(authentication, "MAKER")) {
            transfer.setStatus(PENDING_APPROVAL);
            Transfer saved = transferRepository.save(transfer);
            notifyPending(saved);
            return map(saved);
        }

        transfer.setStatus(COMPLETED);
        try {
            applyTransfer(transfer);
        } catch (InsufficientBalanceException exception) {
            transfer.setStatus("FAILED");
            transfer.setRejectionReason(exception.getMessage());
            transfer.setCompletedAt(LocalDateTime.now());
            Transfer failed = transferRepository.save(transfer);
            if (identityService.hasRole(authentication, "CUSTOMER")) {
                notificationService.notifyUser(transfer.getInitiatedBy(), "CUSTOMER",
                        "Transfer Failed",
                        "Transfer " + transfer.getReferenceNumber() + " failed: "
                                + exception.getMessage(),
                        "TRANSFER_FAILED", "TRANSFER", failed.getId());
            }
            return map(failed);
        }
        Transfer saved = transferRepository.save(transfer);
        notifyCompleted(saved,
                identityService.hasRole(authentication, "CUSTOMER") ? "CUSTOMER" : "ADMIN");
        return map(saved);
    }

    public List<TransferResponse> list(Authentication authentication) {
        List<Transfer> transfers;
        if (identityService.hasRole(authentication, "CUSTOMER")) {
            Long customerId = identityService.currentCustomer(authentication).getId();
            transfers = transferRepository
                    .findBySourceAccountCustomerIdOrDestinationAccountCustomerIdOrderByCreatedAtDesc(
                            customerId, customerId);
        } else if (identityService.hasRole(authentication, "MAKER")) {
            transfers = transferRepository
                    .findByInitiatedByOrderByCreatedAtDesc(authentication.getName());
        } else {
            transfers = transferRepository.findAll();
        }
        return transfers.stream().map(this::map).toList();
    }

    public List<TransferResponse> pendingApproval() {
        return transferRepository.findByStatusOrderByCreatedAtDesc(PENDING_APPROVAL).stream()
                .map(this::map).toList();
    }

    @Transactional
    public TransferResponse approve(Long id, Authentication authentication) {
        Transfer transfer = transferRepository.findLockedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer request not found"));
        if (!PENDING_APPROVAL.equals(transfer.getStatus())) {
            throw new IllegalStateException("Only pending transfers can be approved");
        }
        if (transfer.getInitiatedBy().equals(authentication.getName())) {
            throw new AccessDeniedException("You cannot approve your own transfer");
        }
        transfer.setApprovedBy(NotificationService.displayName(authentication));
        applyTransfer(transfer);
        transfer.setStatus("APPROVED");
        transfer.setCompletedAt(LocalDateTime.now());
        Transfer saved = transferRepository.save(transfer);
        notifyCompleted(saved, "MAKER");
        return map(saved);
    }

    @Transactional
    public TransferResponse reject(Long id, TransferDecisionRequest input,
            Authentication authentication) {
        if (input.getRejectionReason() == null || input.getRejectionReason().isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        Transfer transfer = transferRepository.findLockedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Transfer request not found"));
        if (!PENDING_APPROVAL.equals(transfer.getStatus())) {
            throw new IllegalStateException("Only pending transfers can be rejected");
        }
        if (transfer.getInitiatedBy().equals(authentication.getName())) {
            throw new AccessDeniedException("You cannot reject your own transfer");
        }
        transfer.setStatus("REJECTED");
        transfer.setApprovedBy(NotificationService.displayName(authentication));
        transfer.setRejectionReason(input.getRejectionReason().trim());
        transfer.setCompletedAt(LocalDateTime.now());
        Transfer saved = transferRepository.save(transfer);
        notificationService.notifyUser(saved.getInitiatedBy(), "MAKER", "Transfer Rejected",
                "Transfer " + saved.getReferenceNumber() + " was rejected. Reason: "
                        + saved.getRejectionReason(),
                "TRANSFER_REJECTED", "TRANSFER", saved.getId());
        return map(saved);
    }

    private void validateAccounts(BankAccount source, BankAccount destination) {
        if (source.getId().equals(destination.getId())) {
            throw new IllegalArgumentException(
                    "Source and destination accounts cannot be the same");
        }
        if (!"ACTIVE".equalsIgnoreCase(source.getStatus())
                || !"ACTIVE".equalsIgnoreCase(destination.getStatus())) {
            throw new IllegalStateException("Both accounts must be active");
        }
    }

    private void validateCustomerConsent(BankAccount source, BankAccount destination,
            Authentication authentication) {
        Customer currentCustomer = identityService.currentCustomer(authentication);
        boolean approved = consentRequestService.isApprovedForCustomer(currentCustomer.getId(),
                source.getId(), null, "PAYMENT");
        if (!approved && !source.getCustomer().getId().equals(destination.getCustomer().getId())) {
            throw new AccessDeniedException(
                    "Consent approval is required before this transfer can be processed");
        }
    }

    private BankAccount resolveDestination(TransferCreateRequest input) {
        if (input.getDestinationAccountId() != null) {
            return accountRepository.findById(input.getDestinationAccountId()).orElseThrow(
                    () -> new ResourceNotFoundException("Destination account not found"));
        }
        if (input.getDestinationAccountNumber() != null
                && !input.getDestinationAccountNumber().isBlank()) {
            return accountRepository.findByAccountNumber(input.getDestinationAccountNumber().trim())
                    .orElseThrow(
                            () -> new ResourceNotFoundException("Destination account not found"));
        }
        throw new IllegalArgumentException("Destination account is required");
    }

    private void applyTransfer(Transfer transfer) {
        BankAccount source = accountRepository.findLockedById(transfer.getSourceAccount().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));
        BankAccount destination = accountRepository
                .findLockedById(transfer.getDestinationAccount().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Destination account not found"));
        if (source.getBalance() == null || source.getBalance() < transfer.getAmount()) {
            throw new InsufficientBalanceException("Insufficient balance. Available balance: "
                    + (source.getBalance() == null ? 0D : source.getBalance()));
        }
        source.setBalance(source.getBalance() - transfer.getAmount());
        destination.setBalance((destination.getBalance() == null ? 0D : destination.getBalance())
                + transfer.getAmount());
        accountRepository.save(source);
        accountRepository.save(destination);

        LocalDateTime now = LocalDateTime.now();
        transactionRepository.save(transaction(source, transfer.getAmount(), "DEBIT", transfer,
                source.getBalance(), now));
        transactionRepository.save(transaction(destination, transfer.getAmount(), "CREDIT",
                transfer, destination.getBalance(), now));
        transfer.setCompletedAt(now);
    }

    private BankTransaction transaction(BankAccount account, Double amount, String type,
            Transfer transfer, Double balanceAfter, LocalDateTime createdAt) {
        BankTransaction transaction = new BankTransaction();
        transaction.setAccount(account);
        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setCounterpartyAccount(
                type.equals("DEBIT") ? transfer.getDestinationAccount().getAccountNumber()
                        : transfer.getSourceAccount().getAccountNumber());
        transaction.setReferenceId(transfer.getReferenceNumber());
        transaction.setDescription(transfer.getDescription());
        transaction.setBalanceAfter(balanceAfter);
        transaction.setCreatedAt(createdAt);
        return transaction;
    }

    private void notifyPending(Transfer transfer) {
        notificationService.notifyRole("CHECKER", "New Transfer Request",
                "Transfer " + transfer.getReferenceNumber() + " is awaiting approval.",
                "TRANSFER_REQUEST_CREATED", "TRANSFER", transfer.getId());
        notificationService.notifyRole("ADMIN", "New Transfer Request",
                "Transfer " + transfer.getReferenceNumber() + " is awaiting approval.",
                "TRANSFER_REQUEST_CREATED", "TRANSFER", transfer.getId());
    }

    private void notifyCompleted(Transfer transfer, String initiatorRole) {
        Customer destination = transfer.getDestinationAccount().getCustomer();
        notificationService.notifyUser(destination.getEmail(), "CUSTOMER", "Transfer Received",
                "You received a transfer of " + transfer.getAmount() + ".", "TRANSFER_RECEIVED",
                "TRANSFER", transfer.getId());
        notificationService.notifyUser(transfer.getInitiatedBy(), initiatorRole,
                "Transfer Successful",
                "Transfer " + transfer.getReferenceNumber() + " completed successfully.",
                "TRANSFER_COMPLETED", "TRANSFER", transfer.getId());
    }

    private String reference() {
        return "TRF-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 6).toUpperCase();
    }

    private TransferResponse map(Transfer transfer) {
        TransferResponse response = new TransferResponse();
        response.setId(transfer.getId());
        response.setReferenceNumber(transfer.getReferenceNumber());
        response.setSourceAccountId(transfer.getSourceAccount().getId());
        response.setSourceAccountNumber(transfer.getSourceAccount().getAccountNumber());
        response.setDestinationAccountId(transfer.getDestinationAccount().getId());
        response.setDestinationAccountNumber(transfer.getDestinationAccount().getAccountNumber());
        response.setDestinationCustomerName(
                transfer.getDestinationAccount().getCustomer().getName());
        response.setAmount(transfer.getAmount());
        response.setDescription(transfer.getDescription());
        response.setStatus(transfer.getStatus());
        response.setInitiatedBy(transfer.getInitiatedByName() == null ? transfer.getInitiatedBy()
                : transfer.getInitiatedByName());
        response.setApprovedBy(transfer.getApprovedBy());
        response.setCreatedAt(transfer.getCreatedAt());
        response.setCompletedAt(transfer.getCompletedAt());
        response.setRejectionReason(transfer.getRejectionReason());
        return response;
    }
}
