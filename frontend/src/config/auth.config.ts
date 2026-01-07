import { UserManagerSettings, WebStorageStateStore } from 'oidc-client-ts';

/**
 * Keycloak OIDC Configuration
 * 
 * Update these values to match your Keycloak instance:
 * - KEYCLOAK_URL: Base URL of your Keycloak server
 * - REALM: Your Keycloak realm name
 * - CLIENT_ID: Your Keycloak client ID (public client)
 */

// Environment configuration (can be overridden via env variables in production)
const KEYCLOAK_URL = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8180';
const REALM = import.meta.env.VITE_KEYCLOAK_REALM || 'demo';
const CLIENT_ID = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'react-client';

// Construct the issuer URL
const ISSUER = `${KEYCLOAK_URL}/realms/${REALM}`;

// Application URL (for redirect URIs)
const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

/**
 * OIDC Configuration for react-oidc-context
 * Compatible with iOS clients via PKCE flow
 */
export const oidcConfig: UserManagerSettings = {
  // Keycloak OpenID Connect endpoints
  authority: ISSUER,
  client_id: CLIENT_ID,
  
  // Redirect URIs
  redirect_uri: `${APP_URL}/callback`,
  post_logout_redirect_uri: APP_URL,
  silent_redirect_uri: `${APP_URL}/silent-renew.html`,
  
  // Response configuration
  response_type: 'code', // Authorization Code flow with PKCE
  scope: 'openid profile email groups', // Request groups scope for group membership
  
  // Token handling
  automaticSilentRenew: true,
  loadUserInfo: true,
  
  // Storage (for iOS compatibility, use localStorage)
  userStore: new WebStorageStateStore({ store: window.localStorage }),
  stateStore: new WebStorageStateStore({ store: window.localStorage }),
  
  // Additional settings for mobile compatibility
  filterProtocolClaims: true,
  revokeTokensOnSignout: true,
  
  // Metadata (optional - will be auto-discovered from authority)
  // metadata: {
  //   issuer: ISSUER,
  //   authorization_endpoint: `${ISSUER}/protocol/openid-connect/auth`,
  //   token_endpoint: `${ISSUER}/protocol/openid-connect/token`,
  //   userinfo_endpoint: `${ISSUER}/protocol/openid-connect/userinfo`,
  //   end_session_endpoint: `${ISSUER}/protocol/openid-connect/logout`,
  //   jwks_uri: `${ISSUER}/protocol/openid-connect/certs`,
  // },
};

// API Configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Export individual config values for use elsewhere
export { KEYCLOAK_URL, REALM, CLIENT_ID, ISSUER, APP_URL };
