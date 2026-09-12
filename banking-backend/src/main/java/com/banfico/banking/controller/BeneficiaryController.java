package com.banfico.banking.controller;

import com.banfico.banking.dto.BeneficiaryRequest;
import com.banfico.banking.dto.BeneficiaryResponse;
import com.banfico.banking.service.BeneficiaryService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/beneficiaries")
@CrossOrigin(origins = "http://localhost:4200")
public class BeneficiaryController {

    @Autowired
    private BeneficiaryService beneficiaryService;

    @PostMapping
    public BeneficiaryResponse createBeneficiary(
            @Valid @RequestBody BeneficiaryRequest request){
        return beneficiaryService.createBeneficiary(request);
    }

    @GetMapping
    public List<BeneficiaryResponse> getAllBeneficiaries(){
        return beneficiaryService.getAllBeneficiaries();
    }

    @GetMapping("/customer/{customerId}")
    public List<BeneficiaryResponse> getCustomerBeneficiaries(
            @PathVariable Long customerId){
        return beneficiaryService
                .getBeneficiariesByCustomer(customerId);
    }

    @DeleteMapping("/{id}")
    public String deleteBeneficiary(
            @PathVariable Long id){
        beneficiaryService.deleteBeneficiary(id);
        return "Beneficiary deleted successfully";
    }

}