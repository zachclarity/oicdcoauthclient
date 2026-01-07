package com.example.demo.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Custom Authentication Entry Point that redirects unauthenticated users
 * to Keycloak login page instead of returning 401 Unauthorized.
 * 
 * This is useful when the API is accessed directly from a browser.
 * For programmatic API access (mobile apps, etc.), clients should handle
 * 401 responses and initiate OAuth flow themselves.
 */
@Component
public class KeycloakAuthenticationEntryPoint implements AuthenticationEntryPoint {

    @Value("${keycloak.auth-server-url:http://192.168.1.30:8180}")
    private String keycloakBaseUrl;

    @Value("${keycloak.realm:demo}")
    private String realm;

    @Value("${keycloak.client-id:react-client}")
    private String clientId;

    @Value("${keycloak.redirect-uri:http://192.168.1.30:7371/callback}")
    private String defaultRedirectUri;

    @Value("${keycloak.enable-redirect:true}")
    private boolean enableRedirect;

    private final SecureRandom secureRandom = new SecureRandom();

    @Override
    public void commence(HttpServletRequest request, 
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        
        // Check if client prefers JSON response (API call from app)
        String acceptHeader = request.getHeader("Accept");
        String xRequestedWith = request.getHeader("X-Requested-With");
        boolean isApiRequest = isApiRequest(acceptHeader, xRequestedWith);

        if (!enableRedirect || isApiRequest) {
            // Return 401 JSON response for API clients
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding("UTF-8");
            
            String jsonResponse = String.format(
                "{\"error\":\"unauthorized\"," +
                "\"message\":\"Authentication required\"," +
                "\"login_url\":\"%s\"," +
                "\"timestamp\":\"%s\"}",
                buildLoginUrl(request),
                java.time.Instant.now().toString()
            );
            
            response.getWriter().write(jsonResponse);
            return;
        }

        // Redirect browser requests to Keycloak login
        String loginUrl = buildLoginUrl(request);
        response.sendRedirect(loginUrl);
    }

    /**
     * Build the Keycloak authorization URL with all required parameters
     */
    private String buildLoginUrl(HttpServletRequest request) {
        // Generate state parameter for CSRF protection
        String state = generateState();
        
        // Build the original request URL for redirect after login
        String originalUrl = buildOriginalUrl(request);
        
        // Determine redirect URI - use the original URL or default
        String redirectUri = defaultRedirectUri;
        
        // Build Keycloak authorization endpoint URL
        String authorizationEndpoint = String.format(
            "%s/realms/%s/protocol/openid-connect/auth",
            keycloakBaseUrl,
            realm
        );

        return UriComponentsBuilder.fromHttpUrl(authorizationEndpoint)
                .queryParam("client_id", clientId)
                .queryParam("redirect_uri", redirectUri)
                .queryParam("response_type", "code")
                .queryParam("scope", "openid profile email groups")
                .queryParam("state", state)
                // Store original URL in state or use a separate parameter
                .queryParam("original_url", URLEncoder.encode(originalUrl, StandardCharsets.UTF_8))
                .build()
                .toUriString();
    }

    /**
     * Reconstruct the original request URL
     */
    private String buildOriginalUrl(HttpServletRequest request) {
        StringBuilder url = new StringBuilder();
        url.append(request.getScheme())
           .append("://")
           .append(request.getServerName());
        
        int port = request.getServerPort();
        if ((request.getScheme().equals("http") && port != 80) ||
            (request.getScheme().equals("https") && port != 443)) {
            url.append(":").append(port);
        }
        
        url.append(request.getRequestURI());
        
        if (request.getQueryString() != null) {
            url.append("?").append(request.getQueryString());
        }
        
        return url.toString();
    }

    /**
     * Generate a cryptographically secure state parameter
     */
    private String generateState() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * Determine if this is an API request (vs browser request)
     */
    private boolean isApiRequest(String acceptHeader, String xRequestedWith) {
        // XMLHttpRequest indicates AJAX call
        if ("XMLHttpRequest".equals(xRequestedWith)) {
            return true;
        }
        
        // Check Accept header for JSON preference
        if (acceptHeader != null) {
            // If client explicitly wants JSON and doesn't want HTML
            if (acceptHeader.contains("application/json") && 
                !acceptHeader.contains("text/html")) {
                return true;
            }
        }
        
        return false;
    }
}
