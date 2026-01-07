package com.example.demo.security;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.stereotype.Component;

import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Custom JWT converter that extracts roles from Keycloak JWT tokens.
 * Supports roles from:
 * - realm_access.roles (realm roles)
 * - resource_access.{client_id}.roles (client roles)
 * - groups claim (group memberships mapped to roles)
 */
@Component
public class KeycloakJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final JwtGrantedAuthoritiesConverter defaultGrantedAuthoritiesConverter = 
            new JwtGrantedAuthoritiesConverter();

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = Stream.concat(
                defaultGrantedAuthoritiesConverter.convert(jwt).stream(),
                extractKeycloakAuthorities(jwt).stream()
        ).collect(Collectors.toSet());

        return new JwtAuthenticationToken(jwt, authorities, getPrincipalName(jwt));
    }

    private String getPrincipalName(Jwt jwt) {
        String preferredUsername = jwt.getClaimAsString("preferred_username");
        if (preferredUsername != null) {
            return preferredUsername;
        }
        return jwt.getSubject();
    }

    private Collection<GrantedAuthority> extractKeycloakAuthorities(Jwt jwt) {
        Set<GrantedAuthority> authorities = new HashSet<>();

        // Extract realm roles from realm_access.roles
        authorities.addAll(extractRealmRoles(jwt));

        // Extract client roles from resource_access.{client_id}.roles
        authorities.addAll(extractResourceRoles(jwt));

        // Extract groups and convert to roles
        authorities.addAll(extractGroupRoles(jwt));

        return authorities;
    }

    /**
     * Extract roles from realm_access.roles claim
     */
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractRealmRoles(Jwt jwt) {
        Map<String, Object> realmAccess = jwt.getClaim("realm_access");
        if (realmAccess == null) {
            return Collections.emptySet();
        }

        List<String> roles = (List<String>) realmAccess.get("roles");
        if (roles == null) {
            return Collections.emptySet();
        }

        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                .collect(Collectors.toSet());
    }

    /**
     * Extract roles from resource_access.{client_id}.roles claims
     */
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractResourceRoles(Jwt jwt) {
        Map<String, Object> resourceAccess = jwt.getClaim("resource_access");
        if (resourceAccess == null) {
            return Collections.emptySet();
        }

        Set<GrantedAuthority> authorities = new HashSet<>();
        
        resourceAccess.forEach((clientId, clientAccess) -> {
            if (clientAccess instanceof Map) {
                Map<String, Object> clientAccessMap = (Map<String, Object>) clientAccess;
                List<String> roles = (List<String>) clientAccessMap.get("roles");
                if (roles != null) {
                    roles.forEach(role -> 
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()))
                    );
                }
            }
        });

        return authorities;
    }

    /**
     * Extract groups from the groups claim and convert to role authorities.
     * Groups in Keycloak typically start with "/" (e.g., "/ADMIN", "/users/moderators")
     * We extract the group name and convert to ROLE_GROUP_XXX format.
     */
    @SuppressWarnings("unchecked")
    private Collection<GrantedAuthority> extractGroupRoles(Jwt jwt) {
        List<String> groups = jwt.getClaim("groups");
        if (groups == null) {
            return Collections.emptySet();
        }

        return groups.stream()
                .map(group -> {
                    // Remove leading slash if present
                    String groupName = group.startsWith("/") ? group.substring(1) : group;
                    // Handle nested groups - take the last part or the full path
                    // For "/ADMIN" -> "ADMIN", for "/org/ADMIN" -> "ADMIN"
                    String[] parts = groupName.split("/");
                    String roleName = parts[parts.length - 1];
                    return new SimpleGrantedAuthority("ROLE_" + roleName.toUpperCase());
                })
                .collect(Collectors.toSet());
    }
}
