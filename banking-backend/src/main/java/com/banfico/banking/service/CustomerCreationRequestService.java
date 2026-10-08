package com.banfico.banking.service;

import com.banfico.banking.dto.CustomerCreationRequestResponse;
import com.banfico.banking.dto.CustomerRequest;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.entity.CustomerCreationRequest;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.CustomerCreationRequestRepository;
import com.banfico.banking.repository.CustomerRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class CustomerCreationRequestService {
    private static final String PENDING = "PENDING";
    private final CustomerCreationRequestRepository requestRepository;
    private final CustomerRepository customerRepository;
    private final NotificationService notificationService;
    private final CustomerService customerService;
    private final KeycloakProvisioningService keycloakProvisioningService;

    public CustomerCreationRequestService(CustomerCreationRequestRepository requestRepository, CustomerRepository customerRepository, NotificationService notificationService, CustomerService customerService, KeycloakProvisioningService keycloakProvisioningService) {
        this.requestRepository = requestRepository;
        this.customerRepository = customerRepository;
        this.notificationService = notificationService;
        this.customerService = customerService;
        this.keycloakProvisioningService = keycloakProvisioningService;
    }

    public CustomerCreationRequestResponse create(CustomerRequest input, Authentication authentication) {
        String displayName = NotificationService.displayName(authentication);
        CustomerCreationRequest request = new CustomerCreationRequest(null, input.getName().trim(), input.getEmail().trim(), input.getPhone().trim(), authentication.getName(), displayName, PENDING, null, null, LocalDateTime.now(), null, null);
        CustomerCreationRequest saved = requestRepository.save(request);
        return map(saved);
    }

    public List<CustomerCreationRequestResponse> list(Authentication authentication) {
        boolean checkerOrAdmin = hasRole(authentication, "CHECKER") || hasRole(authentication, "ADMIN");
        List<CustomerCreationRequest> requests = checkerOrAdmin
                ? requestRepository.findAll()
                : requestRepository.findByRequestedByOrderByCreatedAtDesc(authentication.getName());
        return requests.stream().map(this::map).toList();
    }

    public List<CustomerCreationRequestResponse> pending() {
        return requestRepository.findByStatusOrderByCreatedAtDesc("PENDING_APPROVAL").stream().map(this::map).toList();
    }

    @Transactional
    public CustomerCreationRequestResponse submitForApproval(Long id, Authentication authentication) {
        CustomerCreationRequest request = find(id);
        if (!request.getRequestedBy().equals(authentication.getName())) {
            throw new AccessDeniedException("You can only submit your own customer requests");
        }
        requirePending(request);
        request.setStatus("PENDING_APPROVAL");
        CustomerCreationRequest saved = requestRepository.save(request);
        String displayName = NotificationService.displayName(authentication);
        notificationService.notifyRole("CHECKER", "New Customer Creation Request", "A new customer creation request has been submitted by " + displayName + ". Please review it.", "CUSTOMER_REQUEST_CREATED", "CUSTOMER_REQUEST", saved.getId());
        notificationService.notifyRole("ADMIN", "New Customer Request", "A new customer creation request has been submitted by " + displayName + ".", "CUSTOMER_REQUEST_CREATED", "CUSTOMER_REQUEST", saved.getId());
        return map(saved);
    }

    @Transactional
    public CustomerCreationRequestResponse approve(Long id, Authentication authentication) {
        CustomerCreationRequest request = find(id);
        requirePendingApproval(request);
        if (!hasRole(authentication, "CHECKER") && !hasRole(authentication, "ADMIN")) throw new AccessDeniedException("Only a checker can approve customer requests");
        if (request.getRequestedBy().equals(authentication.getName())) throw new AccessDeniedException("You cannot approve your own request");
        if (customerRepository.existsByEmailIgnoreCase(request.getEmail())) throw new IllegalStateException("A customer with this email already exists");
        CustomerRequest customerInput = new CustomerRequest();
        customerInput.setName(request.getName());
        customerInput.setEmail(request.getEmail());
        customerInput.setPhone(request.getPhone());
        customerService.createCustomer(customerInput);
        Customer saved = customerRepository.findByEmailIgnoreCase(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("Provisioned customer was not found"));
        CustomerCreationRequest result;
        try {
            request.setCustomer(saved);
            request.setStatus("APPROVED");
            request.setReviewedBy(authentication.getName());
            request.setReviewedAt(LocalDateTime.now());
            result = requestRepository.save(request);
        } catch (RuntimeException ex) {
            // The customer service already compensates if its own save fails.
            // Compensate here if the surrounding approval transaction fails afterward.
            keycloakProvisioningService.deleteUser(saved.getKeycloakUserId());
            throw new IllegalStateException("Customer approval could not be completed", ex);
        }
        notificationService.notifyUser(request.getRequestedBy(), "MAKER", "Customer Request Approved", "Your customer creation request for " + request.getName() + " has been approved. The customer has been created successfully.", "CUSTOMER_REQUEST_APPROVED", "CUSTOMER_REQUEST", id);
        notificationService.notifyRole("ADMIN", "Customer Request Approved", "Customer creation request submitted by " + request.getRequestedByName() + " has been approved and the customer has been created.", "CUSTOMER_REQUEST_APPROVED", "CUSTOMER_REQUEST", id);
        return map(result);
    }

    @Transactional
    public CustomerCreationRequestResponse reject(Long id, String reason, Authentication authentication) {
        CustomerCreationRequest request = find(id);
        requirePendingApproval(request);
        if (request.getRequestedBy().equals(authentication.getName())) throw new AccessDeniedException("You cannot reject your own request");
        if (reason == null || reason.isBlank()) throw new IllegalArgumentException("Rejection reason is required");
        request.setStatus("REJECTED");
        request.setReviewedBy(authentication.getName());
        request.setReviewedAt(LocalDateTime.now());
        request.setRejectionReason(reason.trim());
        CustomerCreationRequest result = requestRepository.save(request);
        notificationService.notifyUser(request.getRequestedBy(), "MAKER", "Customer Request Rejected", "Your customer creation request for " + request.getName() + " was rejected. Reason: " + reason.trim(), "CUSTOMER_REQUEST_REJECTED", "CUSTOMER_REQUEST", id);
        notificationService.notifyRole("ADMIN", "Customer Request Rejected", "Customer creation request submitted by " + request.getRequestedByName() + " was rejected by " + NotificationService.displayName(authentication) + ".", "CUSTOMER_REQUEST_REJECTED", "CUSTOMER_REQUEST", id);
        return map(result);
    }

    private CustomerCreationRequest find(Long id) { return requestRepository.findLockedById(id).orElseThrow(() -> new ResourceNotFoundException("Customer request not found")); }
    private void requirePending(CustomerCreationRequest request) { if (!PENDING.equals(request.getStatus())) throw new IllegalStateException("Request has already been processed"); }
    private void requirePendingApproval(CustomerCreationRequest request) { if (!"PENDING_APPROVAL".equals(request.getStatus())) throw new IllegalStateException("Only requests pending approval can be processed"); }
    private boolean hasRole(Authentication authentication, String role) { return authentication.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_" + role)); }

    private CustomerCreationRequestResponse map(CustomerCreationRequest request) {
        CustomerCreationRequestResponse response = new CustomerCreationRequestResponse();
        response.setId(request.getId()); response.setName(request.getName()); response.setEmail(request.getEmail()); response.setPhone(request.getPhone());
        response.setRequestedBy(request.getRequestedByName() == null ? request.getRequestedBy() : request.getRequestedByName()); response.setStatus(request.getStatus()); response.setReviewedBy(request.getReviewedBy()); response.setRejectionReason(request.getRejectionReason());
        response.setCreatedAt(request.getCreatedAt()); response.setReviewedAt(request.getReviewedAt()); response.setCustomerId(request.getCustomer() == null ? null : request.getCustomer().getId());
        return response;
    }
}
