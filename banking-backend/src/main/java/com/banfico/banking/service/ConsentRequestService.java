package com.banfico.banking.service;

import com.banfico.banking.dto.ConsentRequestCreate;
import com.banfico.banking.dto.ConsentRequestDecision;
import com.banfico.banking.dto.ConsentRequestResponse;
import com.banfico.banking.entity.Beneficiary;
import com.banfico.banking.entity.BankAccount;
import com.banfico.banking.entity.ConsentRequest;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.entity.BankTransaction;
import com.banfico.banking.exception.InsufficientBalanceException;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.BeneficiaryRepository;
import com.banfico.banking.repository.ConsentRequestRepository;
import com.banfico.banking.repository.BankTransactionRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ConsentRequestService {
    private final ConsentRequestRepository repository;
    private final BankAccountRepository accountRepository;
    private final BeneficiaryRepository beneficiaryRepository;
    private final NotificationService notificationService;
    private final CustomerIdentityService customerIdentityService;
    private final BankTransactionRepository transactionRepository;

    public ConsentRequestService(ConsentRequestRepository repository,
            BankAccountRepository accountRepository, BeneficiaryRepository beneficiaryRepository,
            NotificationService notificationService,
            CustomerIdentityService customerIdentityService,
            BankTransactionRepository transactionRepository) {
        this.repository = repository;
        this.accountRepository = accountRepository;
        this.beneficiaryRepository = beneficiaryRepository;
        this.notificationService = notificationService;
        this.customerIdentityService = customerIdentityService;
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public ConsentRequestResponse create(ConsentRequestCreate input,
            Authentication authentication) {
        if (!"PAYMENT".equalsIgnoreCase(input.getConsentType())) {
            throw new IllegalArgumentException("Only payment consent requests are supported");
        }
        Customer customer = customerIdentityService.currentCustomer(authentication);
        BankAccount account = accountRepository.findById(input.getAccountId())
                .orElseThrow(() -> new ResourceNotFoundException("Account not found"));

        if (!account.getCustomer().getId().equals(customer.getId())) {
            throw new AccessDeniedException("You can only create consent for your own account");
        }

        Beneficiary beneficiary = null;
        if (input.getBeneficiaryId() != null) {
            beneficiary = beneficiaryRepository.findById(input.getBeneficiaryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found"));
            if (!beneficiary.getCustomer().getId().equals(customer.getId())) {
                throw new AccessDeniedException(
                        "You can only create consent for your own beneficiary");
            }
        }
        if (beneficiary == null) {
            throw new IllegalArgumentException("A beneficiary is required for a payment consent");
        }
        if (input.getAmount() == null || input.getAmount() <= 0) {
            throw new IllegalArgumentException("A payment amount greater than zero is required");
        }

        ConsentRequest consent = new ConsentRequest();
        consent.setCustomer(customer);
        consent.setAccount(account);
        consent.setBeneficiary(beneficiary);
        consent.setConsentType(input.getConsentType().trim());
        consent.setAmount(input.getAmount());
        consent.setStatus("PENDING_APPROVAL");
        consent.setRequestedBy(authentication.getName());
        consent.setRequestedByName(NotificationService.displayName(authentication));
        consent.setRequestedAt(LocalDateTime.now());
        consent.setExpiresAt(LocalDateTime.now().plusDays(30));

        ConsentRequest saved = repository.save(consent);
        notificationService.notifyRole("CHECKER", "New Consent Request",
                "A new consent request was submitted by " + consent.getRequestedByName() + ".",
                "CONSENT_REQUEST_CREATED", "CONSENT", saved.getId());
        notificationService.notifyRole("ADMIN", "New Consent Request",
                "A new consent request was submitted by " + consent.getRequestedByName() + ".",
                "CONSENT_REQUEST_CREATED", "CONSENT", saved.getId());
        return map(saved);
    }

    public List<ConsentRequestResponse> list(Authentication authentication) {
        if (customerIdentityService.hasRole(authentication, "CUSTOMER")) {
            return repository
                    .findByCustomerIdOrderByRequestedAtDesc(
                            customerIdentityService.currentCustomer(authentication).getId())
                    .stream().filter(this::isPaymentConsent).map(this::map).toList();
        }
        return repository.findAll().stream().filter(this::isPaymentConsent).map(this::map).toList();
    }

    public List<ConsentRequestResponse> pendingApproval() {
        return repository.findByStatusOrderByRequestedAtDesc("PENDING_APPROVAL").stream()
                .filter(this::isPaymentConsent).map(this::map).toList();
    }

    @Transactional
    public ConsentRequestResponse approve(Long id, Authentication authentication) {
        ConsentRequest consent = findLocked(id);
        if (!"PENDING_APPROVAL".equals(consent.getStatus())) {
            throw new IllegalStateException(
                    "Only pending approval consent requests can be approved");
        }
        if (consent.getRequestedBy().equals(authentication.getName())) {
            throw new AccessDeniedException("You cannot approve your own consent request");
        }
        if (!hasRole(authentication, "CHECKER") && !hasRole(authentication, "ADMIN")) {
            throw new AccessDeniedException("Only checker or admin can approve a consent request");
        }

        consent.setStatus("APPROVED");
        consent.setReviewedBy(NotificationService.displayName(authentication));
        consent.setReviewedAt(LocalDateTime.now());
        if ("PAYMENT".equalsIgnoreCase(consent.getConsentType())) {
            executePayment(consent);
        }
        ConsentRequest saved = repository.save(consent);

        notificationService.notifyUser(consent.getCustomer().getEmail(), "CUSTOMER",
                "Consent Approved",
                "Your consent request for account " + consent.getAccount().getAccountNumber()
                        + " was approved"
                        + ("PAYMENT".equalsIgnoreCase(consent.getConsentType())
                                ? " and the payment of " + consent.getAmount() + " was processed."
                                : "."),
                "CONSENT_APPROVED", "CONSENT", saved.getId());
        return map(saved);
    }

    @Transactional
    public ConsentRequestResponse reject(Long id, ConsentRequestDecision input,
            Authentication authentication) {
        if (input == null || input.getRejectionReason() == null
                || input.getRejectionReason().isBlank()) {
            throw new IllegalArgumentException("Rejection reason is required");
        }
        ConsentRequest consent = findLocked(id);
        if (!"PENDING_APPROVAL".equals(consent.getStatus())) {
            throw new IllegalStateException(
                    "Only pending approval consent requests can be rejected");
        }
        if (consent.getRequestedBy().equals(authentication.getName())) {
            throw new AccessDeniedException("You cannot reject your own consent request");
        }
        if (!hasRole(authentication, "CHECKER") && !hasRole(authentication, "ADMIN")) {
            throw new AccessDeniedException("Only checker or admin can reject a consent request");
        }

        consent.setStatus("REJECTED");
        consent.setReviewedBy(NotificationService.displayName(authentication));
        consent.setReviewedAt(LocalDateTime.now());
        consent.setRejectionReason(input.getRejectionReason().trim());
        ConsentRequest saved = repository.save(consent);

        notificationService.notifyUser(consent.getCustomer().getEmail(), "CUSTOMER",
                "Consent Rejected",
                "Your consent request was rejected. Reason: " + saved.getRejectionReason(),
                "CONSENT_REJECTED", "CONSENT", saved.getId());
        return map(saved);
    }

    @Transactional
    public ConsentRequestResponse revoke(Long id, Authentication authentication) {
        ConsentRequest consent = findLocked(id);
        if (!consent.getCustomer().getId()
                .equals(customerIdentityService.currentCustomer(authentication).getId())
                && !hasRole(authentication, "ADMIN")) {
            throw new AccessDeniedException("You cannot revoke this consent request");
        }

        consent.setStatus("REVOKED");
        consent.setReviewedBy(NotificationService.displayName(authentication));
        consent.setReviewedAt(LocalDateTime.now());
        return map(repository.save(consent));
    }

    public boolean isApprovedForCustomer(Long customerId, Long accountId, Long beneficiaryId,
            String consentType) {
        return repository.findByCustomerIdOrderByRequestedAtDesc(customerId).stream()
                .filter(c -> c.getAccount().getId().equals(accountId))
                .filter(c -> c.getConsentType().equalsIgnoreCase(consentType))
                .filter(c -> beneficiaryId == null || (c.getBeneficiary() != null
                        && c.getBeneficiary().getId().equals(beneficiaryId)))
                .anyMatch(c -> "APPROVED".equals(c.getStatus()) && c.getExpiresAt() != null
                        && c.getExpiresAt().isAfter(LocalDateTime.now()));
    }

    private ConsentRequest findLocked(Long id) {
        return repository.findLockedById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Consent request not found"));
    }

    private boolean hasRole(Authentication authentication, String role) {
        return authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    private boolean isPaymentConsent(ConsentRequest consent) {
        return "PAYMENT".equalsIgnoreCase(consent.getConsentType());
    }

    private ConsentRequestResponse map(ConsentRequest consent) {
        ConsentRequestResponse response = new ConsentRequestResponse();
        response.setId(consent.getId());
        response.setCustomerId(consent.getCustomer().getId());
        response.setCustomerName(consent.getCustomer().getName());
        response.setAccountId(consent.getAccount().getId());
        response.setAccountNumber(consent.getAccount().getAccountNumber());
        response.setBeneficiaryId(
                consent.getBeneficiary() == null ? null : consent.getBeneficiary().getId());
        response.setBeneficiaryName(
                consent.getBeneficiary() == null ? null : consent.getBeneficiary().getName());
        response.setConsentType(consent.getConsentType());
        response.setAmount(consent.getAmount());
        response.setStatus(consent.getStatus());
        response.setRequestedBy(consent.getRequestedByName() == null ? consent.getRequestedBy()
                : consent.getRequestedByName());
        response.setReviewedBy(consent.getReviewedBy());
        response.setRejectionReason(consent.getRejectionReason());
        response.setRequestedAt(consent.getRequestedAt());
        response.setReviewedAt(consent.getReviewedAt());
        response.setExpiresAt(consent.getExpiresAt());
        return response;
    }

    private void executePayment(ConsentRequest consent) {
        BankAccount source = accountRepository.findLockedById(consent.getAccount().getId())
                .orElseThrow(() -> new ResourceNotFoundException("Source account not found"));
        double amount = consent.getAmount() == null ? 0D : consent.getAmount();
        double sourceBalance = source.getBalance() == null ? 0D : source.getBalance();
        if (sourceBalance < amount) {
            throw new InsufficientBalanceException(
                    "Insufficient balance. Available balance: " + sourceBalance);
        }

        BankAccount destination = accountRepository
                .findByAccountNumber(consent.getBeneficiary().getAccountNumber().trim())
                .orElse(null);
        source.setBalance(sourceBalance - amount);
        accountRepository.save(source);
        LocalDateTime now = LocalDateTime.now();
        String reference = "CNS-" + consent.getId();
        transactionRepository
                .save(paymentTransaction(source, amount, "DEBIT",
                        destination == null ? consent.getBeneficiary().getAccountNumber()
                                : destination.getAccountNumber(),
                        reference, source.getBalance(), now));

        if (destination != null && !destination.getId().equals(source.getId())) {
            destination = accountRepository.findLockedById(destination.getId()).orElseThrow(
                    () -> new ResourceNotFoundException("Destination account not found"));
            destination.setBalance(
                    (destination.getBalance() == null ? 0D : destination.getBalance()) + amount);
            accountRepository.save(destination);
            transactionRepository.save(paymentTransaction(destination, amount, "CREDIT",
                    source.getAccountNumber(), reference, destination.getBalance(), now));
            notificationService.notifyUser(destination.getCustomer().getEmail(), "CUSTOMER",
                    "Payment Received", "You received a payment of " + amount + " from "
                            + source.getAccountNumber() + ".",
                    "PAYMENT_RECEIVED", "CONSENT", consent.getId());
        } else {
            notificationService.notifyUser(consent.getCustomer().getEmail(), "CUSTOMER",
                    "Beneficiary Payment Sent",
                    "Payment of " + amount + " was sent to beneficiary "
                            + consent.getBeneficiary().getName()
                            + ". The external beneficiary has no linked account in this application.",
                    "BENEFICIARY_PAYMENT_SENT", "CONSENT", consent.getId());
        }
    }

    private BankTransaction paymentTransaction(BankAccount account, double amount, String type,
            String counterparty, String reference, double balanceAfter, LocalDateTime createdAt) {
        BankTransaction transaction = new BankTransaction();
        transaction.setAccount(account);
        transaction.setAmount(amount);
        transaction.setType(type);
        transaction.setCounterpartyAccount(counterparty);
        transaction.setReferenceId(reference);
        transaction.setDescription("Payment processed from approved consent");
        transaction.setBalanceAfter(balanceAfter);
        transaction.setCreatedAt(createdAt);
        return transaction;
    }
}
