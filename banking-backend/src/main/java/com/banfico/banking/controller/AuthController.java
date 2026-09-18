package com.banfico.banking.controller;

import com.banfico.banking.dto.AuthRequest;
import com.banfico.banking.dto.UserCreateRequest;
import com.banfico.banking.dto.UserResponse;
import com.banfico.banking.service.AppUserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:4200")
public class AuthController {
    private final AppUserService service;
    public AuthController(AppUserService service) { this.service = service; }
    @PostMapping("/login") public UserResponse login(@Valid @RequestBody AuthRequest input) { return service.login(input); }
    @PostMapping("/register") public UserResponse register(@Valid @RequestBody UserCreateRequest input) { return service.register(input); }
    @GetMapping("/users") public List<UserResponse> users() { return service.all(); }
}