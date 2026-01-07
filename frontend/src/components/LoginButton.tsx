import { useAuth } from 'react-oidc-context';
import { CSSProperties } from 'react';

const styles: Record<string, CSSProperties> = {
  button: {
    padding: '12px 32px',
    fontSize: '16px',
    fontWeight: '600',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  loginButton: {
    backgroundColor: '#4CAF50',
    color: 'white',
  },
  logoutButton: {
    backgroundColor: '#f44336',
    color: 'white',
  },
  loadingButton: {
    backgroundColor: '#9e9e9e',
    color: 'white',
    cursor: 'not-allowed',
  },
};

export function LoginButton() {
  const auth = useAuth();

  if (auth.isLoading) {
    return (
      <button style={{ ...styles.button, ...styles.loadingButton }} disabled>
        <span>⏳</span> Loading...
      </button>
    );
  }

  if (auth.error) {
    return (
      <div style={{ color: '#f44336', padding: '8px' }}>
        Error: {auth.error.message}
        <button 
          onClick={() => auth.signinRedirect()}
          style={{ ...styles.button, ...styles.loginButton, marginTop: '8px' }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (auth.isAuthenticated) {
    return (
      <button 
        onClick={() => auth.signoutRedirect()}
        style={{ ...styles.button, ...styles.logoutButton }}
      >
        <span>🚪</span> Logout
      </button>
    );
  }

  return (
    <button 
      onClick={() => auth.signinRedirect()}
      style={{ ...styles.button, ...styles.loginButton }}
    >
      <span>🔐</span> Login with Keycloak
    </button>
  );
}
