package com.banfico.banking.service;

import com.banfico.banking.dto.NotificationResponse;
import com.banfico.banking.entity.Notification;
import com.banfico.banking.exception.ResourceNotFoundException;
import com.banfico.banking.repository.NotificationRepository;
import com.banfico.banking.entity.AuditLog;
import com.banfico.banking.repository.AuditLogRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class NotificationService {
    private final NotificationRepository repository;
    private final CustomerIdentityService customerIdentityService;
    private final AuditLogRepository auditLogRepository;

    public NotificationService(NotificationRepository repository, CustomerIdentityService customerIdentityService, AuditLogRepository auditLogRepository) {
        this.repository = repository;
        this.customerIdentityService = customerIdentityService;
        this.auditLogRepository = auditLogRepository;
    }

    public void notifyUser(String username, String role, String title, String message, String type, String referenceType, Long referenceId) {
        save(username, role, title, message, type, referenceType, referenceId);
    }

    public void notifyRole(String role, String title, String message, String type, String referenceType, Long referenceId) {
        save("*", role, title, message, type, referenceType, referenceId);
    }

    public static String displayName(Authentication authentication) {
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            String name = jwtAuthentication.getToken().getClaimAsString("name");
            if (name == null || name.isBlank()) name = jwtAuthentication.getToken().getClaimAsString("preferred_username");
            if (name == null || name.isBlank()) name = jwtAuthentication.getToken().getClaimAsString("given_name");
            if (name != null && !name.isBlank()) return name;
        }
        return authentication.getName();
    }

    public List<NotificationResponse> list(Authentication authentication) {
        String username = recipient(authentication);
        return repository.findForRecipient(username, role(authentication)).stream().map(this::map).toList();
    }

    public long unreadCount(Authentication authentication) {
        return repository.countUnreadForRecipient(recipient(authentication), role(authentication));
    }

    @Transactional
    public NotificationResponse markRead(Long id, Authentication authentication) {
        Notification notification = owned(id, authentication);
        notification.setRead(true);
        return map(repository.save(notification));
    }

    @Transactional
    public void markAllRead(Authentication authentication) {
        repository.findForRecipient(recipient(authentication), role(authentication)).stream()
                .filter(notification -> !notification.isRead())
                .forEach(notification -> notification.setRead(true));
    }

    private Notification save(String recipient, String role, String title, String message, String type, String referenceType, Long referenceId) {
        auditLogRepository.save(new AuditLog(null, recipient, type, referenceType, referenceId, LocalDateTime.now()));
        Notification notification = new Notification(null, recipient, role, title, message, type, referenceType, referenceId, false, LocalDateTime.now());
        return repository.save(notification);
    }

    private Notification owned(Long id, Authentication authentication) {
        Notification notification = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));
        if (!notification.getRecipient().equals(recipient(authentication)) &&
                !("*".equals(notification.getRecipient()) && notification.getRecipientRole().equalsIgnoreCase(role(authentication)))) {
            throw new AccessDeniedException("Notification does not belong to the authenticated user");
        }
        return notification;
    }

    private String role(Authentication authentication) {
        if (authentication.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_ADMIN"))) return "ADMIN";
        if (authentication.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_CHECKER"))) return "CHECKER";
        if (authentication.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_MAKER"))) return "MAKER";
        if (authentication.getAuthorities().stream().anyMatch(authority -> authority.getAuthority().equals("ROLE_CUSTOMER"))) return "CUSTOMER";
        return "";
    }

    private String recipient(Authentication authentication) {
        return customerIdentityService.hasRole(authentication, "CUSTOMER")
                ? customerIdentityService.currentCustomer(authentication).getEmail()
                : authentication.getName();
    }

    private NotificationResponse map(Notification notification) {
        NotificationResponse response = new NotificationResponse();
        response.setId(notification.getId());
        response.setTitle(notification.getTitle());
        response.setMessage(notification.getMessage());
        response.setType(notification.getType());
        response.setReferenceType(notification.getReferenceType());
        response.setReferenceId(notification.getReferenceId());
        response.setRead(notification.isRead());
        response.setCreatedAt(notification.getCreatedAt());
        return response;
    }
}
