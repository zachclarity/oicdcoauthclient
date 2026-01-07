import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import App from './App';
import { oidcConfig } from './config/auth.config';

/**
 * Main entry point for the React application.
 * Wraps the app with OIDC authentication provider.
 */

// Handle OAuth callback - check if returning from Keycloak
const onSigninCallback = (): void => {
  // Remove the code and state from the URL after successful login
  window.history.replaceState(
    {},
    document.title,
    window.location.pathname
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig} onSigninCallback={onSigninCallback}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
