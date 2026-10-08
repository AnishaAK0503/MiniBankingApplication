package com.banfico.banking.service;

import com.banfico.banking.dto.CustomerRequest;
import com.banfico.banking.dto.CustomerResponse;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.CustomerRepository;
import com.banfico.banking.repository.BankAccountRepository;
import com.banfico.banking.repository.BeneficiaryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CustomerService {
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private BankAccountRepository accountRepository;
    @Autowired
    private BeneficiaryRepository beneficiaryRepository;
    @Autowired
    private NotificationService notificationService;
    @Autowired
    private CustomerIdentityService customerIdentityService;
    @Autowired
    private KeycloakProvisioningService keycloakProvisioningService;

    public CustomerResponse createCustomer(CustomerRequest request) {
        if (customerRepository.existsByEmailIgnoreCase(request.getEmail().trim())) {
            throw new IllegalArgumentException("A customer with this email already exists");
        }
        Customer customer = new Customer(null, request.getName().trim(),
                request.getEmail().trim().toLowerCase(), request.getPhone().trim(), null, null,
                null);
        String keycloakUserId = keycloakProvisioningService.provision(customer);
        customer.setKeycloakUserId(keycloakUserId);
        Customer savedCustomer;
        try {
            savedCustomer = customerRepository.save(customer);
        } catch (RuntimeException ex) {
            keycloakProvisioningService.deleteUser(keycloakUserId);
            throw new IllegalStateException("Customer was not saved after Keycloak provisioning",
                    ex);
        }

        CustomerResponse response = new CustomerResponse();
        response.setId(savedCustomer.getId());
        response.setName(savedCustomer.getName());
        response.setEmail(savedCustomer.getEmail());
        response.setPhone(savedCustomer.getPhone());

        return response;
    }

    public void changePassword(com.banfico.banking.dto.PasswordChangeRequest request,
            Authentication authentication) {
        keycloakProvisioningService.changePassword(authentication, request);
    }

    public List<CustomerResponse> getAllCustomers(Authentication authentication) {
        if (customerIdentityService.hasRole(authentication, "CUSTOMER")) {
            return List
                    .of(convertToResponse(customerIdentityService.currentCustomer(authentication)));
        }
        return customerRepository.findAll().stream().map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public CustomerResponse getCustomerById(Long id, Authentication authentication) {
        Customer customer = customerRepository.findById(id).orElseThrow(
                () -> new ResourceNotFoundException("Customer not found with ID : " + id));
        customerIdentityService.requireCustomerOwner(customer, authentication);
        return convertToResponse(customer);
    }

    @Transactional
    public void deleteCustomer(Long id, String reason, Authentication authentication) {
        if (reason == null || reason.isBlank())
            throw new IllegalArgumentException("Deletion reason is required");
        Customer customer = customerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        if (!accountRepository.findByCustomerId(id).isEmpty()
                || !beneficiaryRepository.findByCustomerId(id).isEmpty()) {
            throw new IllegalStateException(
                    "Customer cannot be deleted while accounts or beneficiaries are linked");
        }
        customerRepository.delete(customer);
        String actor = NotificationService.displayName(authentication);
        notificationService
                .notifyRole(
                        "MAKER", "Customer Deleted", "Customer " + customer.getName()
                                + " was deleted by " + actor + ". Reason: " + reason.trim(),
                        "CUSTOMER_DELETED", "CUSTOMER", id);
        notificationService
                .notifyRole(
                        "CHECKER", "Customer Deleted", "Customer " + customer.getName()
                                + " was deleted by " + actor + ". Reason: " + reason.trim(),
                        "CUSTOMER_DELETED", "CUSTOMER", id);
    }

    private CustomerResponse convertToResponse(Customer customer) {
        CustomerResponse response = new CustomerResponse();
        response.setId(customer.getId());
        response.setName(customer.getName());
        response.setEmail(customer.getEmail());
        response.setPhone(customer.getPhone());
        return response;
    }

}