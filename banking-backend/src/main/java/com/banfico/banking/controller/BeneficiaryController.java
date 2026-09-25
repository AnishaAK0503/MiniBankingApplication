package com.banfico.banking.controller;

import com.banfico.banking.dto.BeneficiaryRequest;
import com.banfico.banking.dto.BeneficiaryResponse;
import com.banfico.banking.service.BeneficiaryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@CrossOrigin(origins = "http://localhost:4200")
public class BeneficiaryController {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @PostMapping
    @PreAuthorize("hasAnyRole('MAKER', 'ADMIN')")
    public BeneficiaryResponse createBeneficiary(
            @Valid @RequestBody BeneficiaryRequest request, Authentication authentication){
        return beneficiaryService.createBeneficiary(request, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public List<BeneficiaryResponse> getAllBeneficiaries(Authentication authentication){
        return beneficiaryService.getAllBeneficiaries(authentication);
    }

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("hasAnyRole('MAKER', 'CHECKER', 'ADMIN')")
    public List<BeneficiaryResponse> getCustomerBeneficiaries(
            @PathVariable Long customerId, Authentication authentication){
        return beneficiaryService
                .getBeneficiariesByCustomer(customerId, authentication);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CHECKER', 'ADMIN')")
    public String deleteBeneficiary(
            @PathVariable Long id){
        beneficiaryService.deleteBeneficiary(id);
        return "Beneficiary deleted successfully";
    }

}