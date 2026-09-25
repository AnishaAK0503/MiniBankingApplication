package com.banfico.banking.controller;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class SecurityTestController {

    @GetMapping("/api/security/me")
    public String currentUser(Authentication authentication) {

        return authentication.getName()
                + " -> "
                + authentication.getAuthorities();
    }
}