import { WebStorageStateStore } from "oidc-client-ts";
import type { AuthProviderProps } from "react-oidc-context";

// iOS/Safari note:
// - Avoid localStorage for auth tokens.
// - Third-party cookie based silent renew often breaks on iOS.
// This config uses sessionStorage for OIDC state/user
// and relies on refresh tokens (if your IdP supports SPA refresh tokens).
export const oidcConfig: AuthProviderProps = {
  authority: import.meta.env.VITE_OIDC_AUTHORITY,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID,
  redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI,
  post_logout_redirect_uri: import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI,
  response_type: "code",
  scope: import.meta.env.VITE_OIDC_SCOPE,

  // Store OIDC state/user in sessionStorage (NOT localStorage)
  userStore: new WebStorageStateStore({ store: window.sessionStorage }),
  stateStore: new WebStorageStateStore({ store: window.sessionStorage }),

  // iOS/Safari: if your IdP supports refresh tokens for SPAs, this is best.
  // If it doesn't, automaticSilentRenew may fail in Safari/iOS due to cookie restrictions.
  automaticSilentRenew: true,

  // Disable iframe-based session monitoring (often depends on cookies and can be flaky on iOS)
  monitorSession: false,

  // Reduce noisy "login_required" loops in some Safari scenarios
  revokeTokensOnSignout: true,
};
