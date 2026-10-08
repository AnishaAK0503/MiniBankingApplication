package com.banfico.banking.service;

import com.banfico.banking.dto.BeneficiaryRequest;
import com.banfico.banking.dto.BeneficiaryResponse;
import com.banfico.banking.entity.Beneficiary;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.BeneficiaryRepository;
import com.banfico.banking.repository.CustomerRepository;
import com.banfico.banking.repository.BankAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.security.core.Authentication;

import java.util.List;

@Service
public class BeneficiaryService {

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;
    @Autowired
    private CustomerRepository customerRepository;
    @Autowired
    private BankAccountRepository accountRepository;
    @Autowired
    private CustomerIdentityService customerIdentityService;
    @Autowired
    private NotificationService notificationService;

    public BeneficiaryResponse createBeneficiary(BeneficiaryRequest request,
            Authentication authentication) {
        Customer customer = customerIdentityService.hasRole(authentication, "CUSTOMER")
                ? customerIdentityService.currentCustomer(authentication)
                : customerRepository.findById(request.getCustomerId())
                        .orElseThrow(() -> new ResourceNotFoundException("Customer not found"));
        String accountNumber;
        String name;
        String bankName;
        String ifsc;
        if (request.getInternalAccountId() != null) {
            var internalAccount = accountRepository.findById(request.getInternalAccountId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Selected internal account was not found"));
            if (internalAccount.getCustomer().getId().equals(customer.getId())) {
                throw new IllegalArgumentException(
                        "You cannot add your own account as a beneficiary");
            }
            accountNumber = internalAccount.getAccountNumber();
            name = internalAccount.getCustomer().getName();
            bankName = "Mini Banking";
            ifsc = "MINI0INTERNAL";
        } else {
            accountNumber = request.getAccountNumber() == null ? ""
                    : request.getAccountNumber().trim();
            name = request.getName() == null ? "" : request.getName().trim();
            bankName = request.getBankName() == null ? "" : request.getBankName().trim();
            ifsc = request.getIfsc() == null ? "" : request.getIfsc().trim().toUpperCase();
            if (!accountNumber.matches("[0-9]{6,18}"))
                throw new IllegalArgumentException("Account number must contain 6 to 18 digits");
            if (!name.isBlank() && request.getConfirmAccountNumber() != null
                    && !accountNumber.equals(request.getConfirmAccountNumber().trim())) {
                throw new IllegalArgumentException("Account number confirmation does not match");
            }
            if (name.isBlank() || bankName.isBlank()
                    || !ifsc.matches("[A-Za-z]{4}0[A-Za-z0-9]{6}")) {
                throw new IllegalArgumentException(
                        "External beneficiary requires a name, bank name, valid IFSC, and matching account number");
            }
        }
        if (beneficiaryRepository.existsByCustomerIdAndAccountNumberIgnoreCase(customer.getId(),
                accountNumber)) {
            throw new IllegalArgumentException("This beneficiary account has already been added");
        }
        Beneficiary beneficiary = new Beneficiary();

        beneficiary.setName(name);
        beneficiary.setAccountNumber(accountNumber);
        beneficiary.setBankName(bankName);
        beneficiary.setIfsc(ifsc);
        beneficiary.setCustomer(customer);
        Beneficiary saved = beneficiaryRepository.save(beneficiary);
        if (customerIdentityService.hasRole(authentication, "CUSTOMER")) {
            notificationService.notifyUser(customer.getEmail(), "CUSTOMER", "Beneficiary Added",
                    saved.getName() + " was added to your beneficiaries.", "BENEFICIARY_ADDED",
                    "BENEFICIARY", saved.getId());
        }
        return map(saved);
    }

    public List<BeneficiaryResponse> getAllBeneficiaries(Authentication authentication) {
        List<Beneficiary> beneficiaries = customerIdentityService.hasRole(authentication,
                "CUSTOMER")
                        ? beneficiaryRepository.findByCustomerId(
                                customerIdentityService.currentCustomer(authentication).getId())
                        : beneficiaryRepository.findAll();
        return beneficiaries.stream().map(this::map).toList();
    }

    public List<BeneficiaryResponse> getBeneficiariesByCustomer(Long customerId,
            Authentication authentication) {
        if (customerIdentityService.hasRole(authentication, "CUSTOMER") && !customerIdentityService
                .currentCustomer(authentication).getId().equals(customerId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                    "You are not authorized to access these beneficiaries");
        }
        return beneficiaryRepository.findByCustomerId(customerId).stream().map(this::map).toList();
    }

    public void deleteBeneficiary(Long id, Authentication authentication) {
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Beneficiary not found"));
        customerIdentityService.requireCustomerOwner(beneficiary.getCustomer(), authentication);
        beneficiaryRepository.delete(beneficiary);
        if (customerIdentityService.hasRole(authentication, "CUSTOMER")) {
            notificationService.notifyUser(beneficiary.getCustomer().getEmail(), "CUSTOMER",
                    "Beneficiary Removed",
                    beneficiary.getName() + " was removed from your beneficiaries.",
                    "BENEFICIARY_DELETED", "BENEFICIARY", id);
        }
    }

    private BeneficiaryResponse map(Beneficiary beneficiary) {
        BeneficiaryResponse response = new BeneficiaryResponse();
        response.setId(beneficiary.getId());
        response.setName(beneficiary.getName());
        response.setAccountNumber(beneficiary.getAccountNumber());
        response.setBankName(beneficiary.getBankName());
        response.setIfsc(beneficiary.getIfsc());
        response.setCustomerId(beneficiary.getCustomer().getId());
        return response;
    }

}