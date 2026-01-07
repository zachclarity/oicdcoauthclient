package com.example.demo.config;

import com.example.demo.security.KeycloakAccessDeniedHandler;
import com.example.demo.security.KeycloakAuthenticationEntryPoint;
import com.example.demo.security.KeycloakJwtAuthenticationConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * Security configuration for OAuth2 Resource Server with Keycloak.
 * Configures JWT validation, CORS, and endpoint security.
 * 
 * Features:
 * - Redirects anonymous browser requests to Keycloak login
 * - Returns 401 JSON for API clients (detected via Accept header)
 * - Validates JWT tokens against Keycloak
 * - Extracts roles from groups, realm_access, and resource_access
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true, securedEnabled = true)
public class SecurityConfig {

    private final KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter;
    private final KeycloakAuthenticationEntryPoint keycloakAuthenticationEntryPoint;
    private final KeycloakAccessDeniedHandler keycloakAccessDeniedHandler;

    @Value("${app.cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
    private String allowedOrigins;

    public SecurityConfig(
            KeycloakJwtAuthenticationConverter keycloakJwtAuthenticationConverter,
            KeycloakAuthenticationEntryPoint keycloakAuthenticationEntryPoint,
            KeycloakAccessDeniedHandler keycloakAccessDeniedHandler) {
        this.keycloakJwtAuthenticationConverter = keycloakJwtAuthenticationConverter;
        this.keycloakAuthenticationEntryPoint = keycloakAuthenticationEntryPoint;
        this.keycloakAccessDeniedHandler = keycloakAccessDeniedHandler;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // Disable CSRF for stateless API
            .csrf(AbstractHttpConfigurer::disable)
            
            // Configure CORS
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            
            // Stateless session management
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            
            // Authorization rules
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/actuator/health").permitAll()
                .requestMatchers("/error").permitAll()
                
                // Admin endpoints require ADMIN role (from group or realm/client roles)
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // Hello endpoint requires ADMIN role
                .requestMatchers("/api/hello/**").hasRole("ADMIN")
                
                // All other API endpoints require authentication
                .requestMatchers("/api/**").authenticated()
                
                // Any other request requires authentication
                .anyRequest().authenticated()
            )
            
            // Configure exception handling with custom entry point
            // This redirects anonymous users to Keycloak login
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint(keycloakAuthenticationEntryPoint)
                .accessDeniedHandler(keycloakAccessDeniedHandler)
            )
            
            // Configure OAuth2 Resource Server with JWT
            .oauth2ResourceServer(oauth2 -> oauth2
                .jwt(jwt -> jwt
                    .jwtAuthenticationConverter(keycloakJwtAuthenticationConverter)
                )
                // Also use the custom entry point for OAuth2 auth failures
                .authenticationEntryPoint(keycloakAuthenticationEntryPoint)
            );

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        
        // Split the allowed origins string and set them
        List<String> origins = Arrays.asList(allowedOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        
        // Allow common HTTP methods
        configuration.setAllowedMethods(Arrays.asList(
            "GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"
        ));
        
        // Allow common headers including Authorization for Bearer tokens
        configuration.setAllowedHeaders(Arrays.asList(
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With"
        ));
        
        // Expose headers that the client might need
        configuration.setExposedHeaders(Arrays.asList(
            "Authorization",
            "Content-Disposition"
        ));
        
        // Allow credentials (cookies, authorization headers)
        configuration.setAllowCredentials(true);
        
        // Cache preflight requests for 1 hour
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
