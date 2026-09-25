package com.banfico.banking.controller;

import com.banfico.banking.dto.CustomerRequest;
import com.banfico.banking.dto.CustomerResponse;
import com.banfico.banking.service.CustomerService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@CrossOrigin(origins = "http://localhost:4200")
public class CustomerController {
    @Autowired
    private CustomerService customerService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerResponse createCustomer(
            @Valid @RequestBody CustomerRequest request) {
        return customerService.createCustomer(request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public List<CustomerResponse> getAllCustomers(Authentication authentication) {
        return customerService.getAllCustomers(authentication);
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public CustomerResponse getCustomerById(
            @PathVariable Long id, Authentication authentication) {
        return customerService.getCustomerById(id, authentication);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteCustomer(@PathVariable Long id, @Valid @RequestBody com.banfico.banking.dto.DeleteReasonRequest request, Authentication authentication) {
        customerService.deleteCustomer(id, request.getReason(), authentication);
    }

}