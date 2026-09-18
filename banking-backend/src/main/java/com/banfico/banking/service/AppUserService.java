package com.banfico.banking.service;

import com.banfico.banking.dto.AuthRequest;
import com.banfico.banking.dto.UserCreateRequest;
import com.banfico.banking.dto.UserResponse;
import com.banfico.banking.entity.AppUser;
import com.banfico.banking.repository.AppUserRepository;
import com.banfico.banking.repository.CustomerRepository;
import com.banfico.banking.entity.Customer;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AppUserService {
    private final AppUserRepository repository;
    private final CustomerRepository customerRepository;

    public AppUserService(AppUserRepository repository, CustomerRepository customerRepository) {
        this.repository = repository;
        this.customerRepository = customerRepository;
        seed("Anisha", "anisha@bank.com", "123456", "admin");
        seed("Riya", "riya@bank.com", "123456", "maker");
        seed("Arjun", "arjun@bank.com", "123456", "customer");
        seed("Neha", "neha@bank.com", "123456", "checker");
        ensureCustomer("Arjun", "arjun@bank.com", "0000000000");
    }

    public UserResponse login(AuthRequest input) {
        AppUser user = repository.findByEmailIgnoreCase(input.getEmail()).orElseThrow(() -> new IllegalArgumentException("Invalid email or password."));
        if (!user.isActive() || !user.getPassword().equals(input.getPassword())) throw new IllegalArgumentException("Invalid email or password.");
        return map(user);
    }

    public UserResponse register(UserCreateRequest input) {
        if (repository.existsByEmailIgnoreCase(input.getEmail())) throw new IllegalArgumentException("An account with this email already exists.");
        AppUser user = new AppUser(null, input.getName().trim(), input.getEmail().trim(), input.getPassword(), input.getRole().toLowerCase(), true);
        if ("customer".equalsIgnoreCase(input.getRole())) ensureCustomer(input.getName().trim(), input.getEmail().trim(), "");
        return map(repository.save(user));
    }

    public List<UserResponse> all() { return repository.findAll().stream().map(this::map).toList(); }

    private void seed(String name, String email, String password, String role) {
        if (!repository.existsByEmailIgnoreCase(email)) repository.save(new AppUser(null, name, email, password, role, true));
    }

    private void ensureCustomer(String name, String email, String phone) {
        if (customerRepository.findByEmailIgnoreCase(email).isEmpty()) customerRepository.save(new Customer(null, name, email, phone, null, null));
    }

    private UserResponse map(AppUser user) {
        UserResponse response = new UserResponse(); response.setId(user.getId()); response.setName(user.getName()); response.setEmail(user.getEmail()); response.setRole(user.getRole()); response.setActive(user.isActive()); return response;
    }
}