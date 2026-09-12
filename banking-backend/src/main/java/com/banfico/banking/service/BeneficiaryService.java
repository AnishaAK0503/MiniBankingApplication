package com.banfico.banking.service;

import com.banfico.banking.dto.BeneficiaryRequest;
import com.banfico.banking.dto.BeneficiaryResponse;
import com.banfico.banking.entity.Beneficiary;
import com.banfico.banking.entity.Customer;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.BeneficiaryRepository;
import com.banfico.banking.repository.CustomerRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BeneficiaryService {

    @Autowired
    private BeneficiaryRepository beneficiaryRepository;
    @Autowired
    private CustomerRepository customerRepository;

    public BeneficiaryResponse createBeneficiary(BeneficiaryRequest request){
        Customer customer = customerRepository.findById(request.getCustomerId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Customer not found"));
        Beneficiary beneficiary = new Beneficiary();

        beneficiary.setName(request.getName());
        beneficiary.setAccountNumber(request.getAccountNumber());
        beneficiary.setBankName(request.getBankName());
        beneficiary.setCustomer(customer);
        Beneficiary saved = beneficiaryRepository.save(beneficiary);
        return map(saved);
    }

    public List<BeneficiaryResponse> getAllBeneficiaries(){
        return beneficiaryRepository.findAll()
                .stream()
                .map(this::map)
                .toList();
    }

    public List<BeneficiaryResponse> getBeneficiariesByCustomer(Long customerId){
        return beneficiaryRepository.findByCustomerId(customerId)
                .stream()
                .map(this::map)
                .toList();
    }

    public void deleteBeneficiary(Long id){
        Beneficiary beneficiary = beneficiaryRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Beneficiary not found"));
        beneficiaryRepository.delete(beneficiary);
    }

    private BeneficiaryResponse map(Beneficiary beneficiary){
        BeneficiaryResponse response = new BeneficiaryResponse();
        response.setId(beneficiary.getId());
        response.setName(beneficiary.getName());
        response.setAccountNumber(beneficiary.getAccountNumber());
        response.setBankName(beneficiary.getBankName());
        response.setCustomerId(
                beneficiary.getCustomer().getId());
        return response;
    }

}