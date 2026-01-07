import { useAuth } from 'react-oidc-context';
import { useEffect, useCallback, useState } from 'react';
import { setAccessToken, api, HelloResponse, UserInfoResponse } from '../services/api.service';

/**
 * Custom hook for making authenticated API calls
 * Automatically manages access token synchronization
 */
export function useApi() {
  const auth = useAuth();
  const [isTokenSet, setIsTokenSet] = useState(false);

  // Sync access token with API service whenever it changes
  useEffect(() => {
    if (auth.user?.access_token) {
      setAccessToken(auth.user.access_token);
      setIsTokenSet(true);
    } else {
      setAccessToken(null);
      setIsTokenSet(false);
    }
  }, [auth.user?.access_token]);

  // Hello endpoint
  const getHello = useCallback(async (): Promise<HelloResponse | null> => {
    if (!isTokenSet) {
      console.warn('No access token available');
      return null;
    }
    try {
      return await api.getHello();
    } catch (error) {
      console.error('Failed to call hello endpoint:', error);
      throw error;
    }
  }, [isTokenSet]);

  // Hello/me endpoint
  const getHelloMe = useCallback(async (): Promise<HelloResponse | null> => {
    if (!isTokenSet) {
      console.warn('No access token available');
      return null;
    }
    try {
      return await api.getHelloMe();
    } catch (error) {
      console.error('Failed to call hello/me endpoint:', error);
      throw error;
    }
  }, [isTokenSet]);

  // User info endpoint
  const getUserInfo = useCallback(async (): Promise<UserInfoResponse | null> => {
    if (!isTokenSet) {
      console.warn('No access token available');
      return null;
    }
    try {
      return await api.getUserInfo();
    } catch (error) {
      console.error('Failed to get user info:', error);
      throw error;
    }
  }, [isTokenSet]);

  // Admin action
  const performAdminAction = useCallback(async (payload?: Record<string, unknown>) => {
    if (!isTokenSet) {
      console.warn('No access token available');
      return null;
    }
    try {
      return await api.performAdminAction(payload);
    } catch (error) {
      console.error('Failed to perform admin action:', error);
      throw error;
    }
  }, [isTokenSet]);

  // Public health check (doesn't require auth)
  const getHealth = useCallback(async () => {
    try {
      return await api.getHealth();
    } catch (error) {
      console.error('Health check failed:', error);
      throw error;
    }
  }, []);

  return {
    isAuthenticated: auth.isAuthenticated,
    isLoading: auth.isLoading,
    isTokenSet,
    user: auth.user,
    getHello,
    getHelloMe,
    getUserInfo,
    performAdminAction,
    getHealth,
    // Auth methods
    login: () => auth.signinRedirect(),
    logout: () => auth.signoutRedirect(),
  };
}

/**
 * Hook to extract user groups from JWT token
 */
export function useUserGroups(): string[] {
  const auth = useAuth();
  
  if (!auth.user?.profile) {
    return [];
  }

  // Groups can be in different places depending on Keycloak configuration
  const profile = auth.user.profile as Record<string, unknown>;
  const groups = profile.groups as string[] | undefined;
  
  return groups || [];
}

/**
 * Hook to check if user has admin role/group
 */
export function useIsAdmin(): boolean {
  const groups = useUserGroups();
  
  // Check for ADMIN group (with or without leading slash)
  return groups.some(group => 
    group === 'ADMIN' || 
    group === '/ADMIN' || 
    group.endsWith('/ADMIN')
  );
}
