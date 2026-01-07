import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '../config/auth.config';

/**
 * API Service with OAuth2 Bearer Token support
 * Automatically attaches access token to all requests
 */

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Token storage (will be set by auth context)
let accessToken: string | null = null;

/**
 * Set the access token for API requests
 */
export const setAccessToken = (token: string | null): void => {
  accessToken = token;
};

/**
 * Get the current access token
 */
export const getAccessToken = (): string | null => {
  return accessToken;
};

// Request interceptor - add Authorization header
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      console.error('Unauthorized - token may be expired');
      // Could trigger token refresh or redirect to login here
    }
    if (error.response?.status === 403) {
      console.error('Forbidden - insufficient permissions');
    }
    return Promise.reject(error);
  }
);

// API Response types
export interface HelloResponse {
  message: string;
  user: string;
  timestamp: string;
  roles: string[];
}

export interface UserInfoResponse {
  principal: string;
  authorities: string[];
  userInfo: {
    sub: string;
    preferred_username: string;
    email: string;
    email_verified: boolean;
    name: string;
    given_name: string;
    family_name: string;
    groups: string[];
  };
  tokenInfo: {
    issuer: string;
    audience: string[];
    issuedAt: string;
    expiresAt: string;
  };
}

export interface HealthResponse {
  status: string;
  timestamp: string;
  service: string;
}

export interface AdminActionResponse {
  status: string;
  message: string;
  performedBy: string;
  timestamp: string;
  receivedPayload?: Record<string, unknown>;
}

/**
 * API Methods
 */
export const api = {
  // Public endpoints (no auth required)
  getHealth: async (): Promise<HealthResponse> => {
    const response = await apiClient.get('/api/public/health');
    return response.data;
  },

  getInfo: async () => {
    const response = await apiClient.get('/api/public/info');
    return response.data;
  },

  // Protected endpoints (require ADMIN role)
  getHello: async (): Promise<HelloResponse> => {
    const response = await apiClient.get('/api/hello');
    return response.data;
  },

  getHelloMe: async (): Promise<HelloResponse> => {
    const response = await apiClient.get('/api/hello/me');
    return response.data;
  },

  getUserInfo: async (): Promise<UserInfoResponse> => {
    const response = await apiClient.get('/api/hello/userinfo');
    return response.data;
  },

  performAdminAction: async (payload?: Record<string, unknown>): Promise<AdminActionResponse> => {
    const response = await apiClient.post('/api/hello/action', payload || {});
    return response.data;
  },
};

export default apiClient;
