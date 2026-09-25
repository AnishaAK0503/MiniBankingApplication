package com.banfico.banking.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.util.Collection;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

public class KeycloakRoleConverter
        implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {

        Set<String> roles = new HashSet<>();
        addRoles(roles, jwt.getClaim("realm_access"));

        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess != null) {
            resourceAccess.values().forEach(client -> addRoles(roles, client));
        }

        if (roles.isEmpty()) {
            return new JwtAuthenticationToken(jwt);
        }

        List<GrantedAuthority> authorities = roles.stream()
                .map(Object::toString)
                .map(role -> role.toUpperCase(Locale.ROOT))
                .map(role -> role.startsWith("ROLE_") ? role : "ROLE_" + role)
                .map(SimpleGrantedAuthority::new)
                .collect(Collectors.toList());

        return new JwtAuthenticationToken(jwt, authorities);
    }

    private void addRoles(Set<String> roles, Object access) {
        if (!(access instanceof Map<?, ?> accessMap)) return;
        Object rolesObject = accessMap.get("roles");
        if (rolesObject instanceof Collection<?> roleCollection) {
            roleCollection.forEach(role -> roles.add(role.toString()));
        }
    }
}