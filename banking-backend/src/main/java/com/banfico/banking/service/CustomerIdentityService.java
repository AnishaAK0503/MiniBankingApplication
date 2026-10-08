package com.banfico.banking.service;

import com.banfico.banking.entity.Customer;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.CustomerRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;

@Service
public class CustomerIdentityService {
    private final CustomerRepository customerRepository;

    public CustomerIdentityService(CustomerRepository customerRepository) {
        this.customerRepository = customerRepository;
    }

    public boolean hasRole(Authentication authentication, String role) {
        return authentication != null && authentication.getAuthorities().stream()
                .anyMatch(authority -> authority.getAuthority().equals("ROLE_" + role));
    }

    public Customer currentCustomer(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Authentication is required");
        }
        String email = authentication.getName();
        if (authentication instanceof JwtAuthenticationToken jwt) {
            String claimEmail = jwt.getToken().getClaimAsString("email");
            if (claimEmail != null && !claimEmail.isBlank()) email = claimEmail;
        }
        return customerRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException("No customer profile is linked to this login"));
    }

    public void requireCustomerOwner(Customer customer, Authentication authentication) {
        if (!hasRole(authentication, "CUSTOMER")) return;
        Customer current = currentCustomer(authentication);
        if (!current.getId().equals(customer.getId())) {
            throw new AccessDeniedException("You are not authorized to access this customer");
        }
    }
}
