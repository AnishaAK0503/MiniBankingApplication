package com.banfico.banking.controller;

import com.banfico.banking.dto.NotificationResponse;
import com.banfico.banking.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "http://localhost:4200")
@PreAuthorize("hasAnyRole('ADMIN', 'MAKER', 'CHECKER')")
public class NotificationController {
    private final NotificationService service;

    public NotificationController(NotificationService service) {
        this.service = service;
    }

    @GetMapping
    public List<NotificationResponse> list(Authentication authentication) {
        return service.list(authentication);
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(Authentication authentication) {
        return Map.of("count", service.unreadCount(authentication));
    }

    @PatchMapping("/{id}/read")
    public NotificationResponse markRead(@PathVariable Long id, Authentication authentication) {
        return service.markRead(id, authentication);
    }

    @PatchMapping("/read-all")
    public void markAllRead(Authentication authentication) {
        service.markAllRead(authentication);
    }
}
