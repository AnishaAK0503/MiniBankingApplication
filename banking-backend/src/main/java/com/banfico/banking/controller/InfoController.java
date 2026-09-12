package com.banfico.banking.controller;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api")
public class InfoController {

    @GetMapping("/info")
    public Map<String, String> info() {

        Map<String, String> response = new HashMap<>();

        response.put("application", "Mini Banking System");
        response.put("version", "1.0");
        response.put("status", "Running");

        return response;
    }
}