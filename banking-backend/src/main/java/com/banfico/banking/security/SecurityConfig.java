package com.banfico.banking.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

        @Bean
        public JwtDecoder jwtDecoder(
                        @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri,
                        @Value("${banking.security.jwt.jwk-set-uri:}") String jwkSetUri) {
                if (jwkSetUri == null || jwkSetUri.isBlank()) {
                        return JwtDecoders.fromIssuerLocation(issuerUri);
                }
                NimbusJwtDecoder decoder = NimbusJwtDecoder.withJwkSetUri(jwkSetUri).build();
                decoder.setJwtValidator(JwtValidators.createDefaultWithIssuer(issuerUri));
                return decoder;
        }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
                .csrf(csrf -> csrf.disable()) //stateless REST API, so CSRF protection is not needed

                .cors(Customizer.withDefaults())

                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                )

                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/health", "/api/health", "/api/info").permitAll()
                        .anyRequest().authenticated()
                )

                .oauth2ResourceServer(oauth2 ->
        oauth2.jwt(jwt ->
                jwt.jwtAuthenticationConverter(
                        new KeycloakRoleConverter()
                )
        )
);

        return http.build();
    }

        @Bean
        public CorsConfigurationSource corsConfigurationSource() {
                CorsConfiguration configuration = new CorsConfiguration();
                configuration.setAllowedOrigins(List.of("http://localhost:4200", "http://localhost:8080"));
                configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                configuration.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin"));
                configuration.setExposedHeaders(List.of("Authorization"));
                configuration.setAllowCredentials(true);

                UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
                source.registerCorsConfiguration("/**", configuration);
                return source;
        }
}