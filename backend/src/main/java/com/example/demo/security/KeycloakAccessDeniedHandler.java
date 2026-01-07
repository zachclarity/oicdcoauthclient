package com.example.demo.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.time.Instant;

/**
 * Custom Access Denied Handler for authenticated users who lack required permissions.
 * This handles cases where a user is logged in but doesn't have the ADMIN role.
 */
@Component
public class KeycloakAccessDeniedHandler implements AccessDeniedHandler {

    @Override
    public void handle(HttpServletRequest request,
                       HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");

        String username = request.getUserPrincipal() != null 
            ? request.getUserPrincipal().getName() 
            : "unknown";

        String jsonResponse = String.format(
            "{" +
            "\"error\":\"access_denied\"," +
            "\"message\":\"You don't have permission to access this resource. ADMIN role is required.\"," +
            "\"user\":\"%s\"," +
            "\"required_role\":\"ADMIN\"," +
            "\"path\":\"%s\"," +
            "\"timestamp\":\"%s\"" +
            "}",
            escapeJson(username),
            escapeJson(request.getRequestURI()),
            Instant.now().toString()
        );

        response.getWriter().write(jsonResponse);
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t");
    }
}
