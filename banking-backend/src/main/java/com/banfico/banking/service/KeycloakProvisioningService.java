package com.banfico.banking.service;

import com.banfico.banking.dto.PasswordChangeRequest;
import com.banfico.banking.entity.Customer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.List;
import java.util.Map;

@Service
public class KeycloakProvisioningService {
    private final RestClient client;
    private final String realm;
    private final String adminRealm;
    private final String clientId;
    private final String clientSecret;
    private final String adminUsername;
    private final String adminPassword;
    private final String temporaryPassword;

    public KeycloakProvisioningService(@Value("${banking.keycloak.base-url}") String baseUrl,
            @Value("${banking.keycloak.realm:mini-banking}") String realm,
            @Value("${banking.keycloak.admin-realm:master}") String adminRealm,
            @Value("${banking.keycloak.client-id:mini-banking-app}") String clientId,
            @Value("${banking.keycloak.client-secret:}") String clientSecret,
            @Value("${banking.keycloak.admin-username:}") String adminUsername,
            @Value("${banking.keycloak.admin-password:}") String adminPassword,
            @Value("${banking.keycloak.temporary-password}") String temporaryPassword) {
        this.client = RestClient.builder().baseUrl(baseUrl).build();
        this.realm = realm;
        this.adminRealm = adminRealm;
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
        this.temporaryPassword = temporaryPassword;
    }

    public String provision(Customer customer) {
        String token = adminToken();
        String userId = null;
        try {
            String username = customer.getName().trim();
            if (!findUser(token, username).isEmpty()) {
                throw new IllegalArgumentException(
                        "A Keycloak user with this username already exists");
            }
            Map<String, Object> user = Map.of("username", username, "email", customer.getEmail(),
                    "enabled", true, "emailVerified", false);
            var response = client.post().uri("/admin/realms/{realm}/users", realm)
                    .headers(headers -> headers.setBearerAuth(token))
                    .contentType(MediaType.APPLICATION_JSON).body(user).retrieve()
                    .toBodilessEntity();
            String location = response.getHeaders().getFirst("Location");
            userId = location == null
                    ? findUser(token, username).stream().findFirst()
                            .map(item -> String.valueOf(item.get("id")))
                            .orElseThrow(() -> new IllegalStateException(
                                    "Keycloak did not return the created user"))
                    : location.substring(location.lastIndexOf('/') + 1);

            Map<String, Object> role = client.get()
                    .uri("/admin/realms/{realm}/roles/{role}", realm, "CUSTOMER")
                    .headers(headers -> headers.setBearerAuth(token)).retrieve().body(Map.class);
            client.post().uri("/admin/realms/{realm}/users/{id}/role-mappings/realm", realm, userId)
                    .headers(headers -> headers.setBearerAuth(token))
                    .contentType(MediaType.APPLICATION_JSON).body(List.of(role)).retrieve()
                    .toBodilessEntity();
            setPassword(token, userId, temporaryPassword, true);
            return userId;
        } catch (RuntimeException ex) {
            if (userId != null) {
                try {
                    client.delete().uri("/admin/realms/{realm}/users/{id}", realm, userId)
                            .headers(headers -> headers.setBearerAuth(token)).retrieve()
                            .toBodilessEntity();
                } catch (RuntimeException cleanupFailure) {
                    ex.addSuppressed(cleanupFailure);
                }
            }
            throw new IllegalStateException("Customer Keycloak provisioning failed", ex);
        }
    }

    public void deleteUser(String userId) {
        if (userId == null || userId.isBlank())
            return;
        client.delete().uri("/admin/realms/{realm}/users/{id}", realm, userId)
                .headers(headers -> headers.setBearerAuth(adminToken())).retrieve()
                .toBodilessEntity();
    }

    public void changePassword(Authentication authentication, PasswordChangeRequest request) {
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("New password and confirmation must match");
        }
        if (!(authentication instanceof JwtAuthenticationToken jwt)) {
            throw new AccessDeniedException("A Keycloak login is required");
        }
        String username = jwt.getToken().getClaimAsString("preferred_username");
        if (username == null || username.isBlank())
            username = authentication.getName();
        validateCurrentPassword(username, request.getCurrentPassword());
        String userId = jwt.getToken().getSubject();
        setPassword(adminToken(), userId, request.getNewPassword(), false);
    }

    private void validateCurrentPassword(String username, String password) {
        var form = new LinkedMultiValueMap<String, String>();
        form.add("grant_type", "password");
        form.add("client_id", clientId);
        if (!clientSecret.isBlank())
            form.add("client_secret", clientSecret);
        form.add("username", username);
        form.add("password", password);
        try {
            client.post().uri("/realms/{realm}/protocol/openid-connect/token", realm)
                    .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve()
                    .toBodilessEntity();
        } catch (RestClientResponseException ex) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
    }

    private void setPassword(String token, String userId, String password, boolean temporary) {
        client.put().uri("/admin/realms/{realm}/users/{id}/reset-password", realm, userId)
                .headers(headers -> headers.setBearerAuth(token))
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of("type", "password", "value", password, "temporary", temporary))
                .retrieve().toBodilessEntity();
    }

    private List<Map<String, Object>> findUser(String token, String username) {
        List<Map<String, Object>> users = client.get()
                .uri(uri -> uri.path("/admin/realms/{realm}/users").queryParam("username", username)
                        .queryParam("exact", true).build(realm))
                .headers(headers -> headers.setBearerAuth(token)).retrieve().body(List.class);
        return users == null ? List.of() : users;
    }

    private String adminToken() {
        if (adminUsername.isBlank() && clientSecret.isBlank()) {
            throw new IllegalStateException("Keycloak admin credentials are not configured");
        }
        var form = new LinkedMultiValueMap<String, String>();
        form.add("client_id", clientId);
        if (adminUsername.isBlank()) {
            form.add("grant_type", "client_credentials");
            form.add("client_secret", clientSecret);
        } else {
            if (adminPassword.isBlank()) {
                throw new IllegalStateException("Keycloak admin password is not configured");
            }
            form.add("grant_type", "password");
            if (!clientSecret.isBlank())
                form.add("client_secret", clientSecret);
            form.add("username", adminUsername);
            form.add("password", adminPassword);
        }
        Map<String, Object> response = client.post()
                .uri("/realms/{realm}/protocol/openid-connect/token", adminRealm)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED).body(form).retrieve()
                .body(Map.class);
        Object token = response == null ? null : response.get("access_token");
        if (token == null)
            throw new IllegalStateException("Keycloak admin token was not returned");
        return String.valueOf(token);
    }
}
