import axios, { AxiosError } from 'axios';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { RetryConfig } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Default retry configuration
const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  retryBackoffMultiplier: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
  retryableMethods: ['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE'],
};

/**
 * Enhanced API client with retry logic, error handling, and offline detection
 */
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second default timeout
});

// Retry queue for offline mode
const requestQueue: Array<() => Promise<any>> = [];
let isRetrying = false;

/**
 * Check if request is retryable based on status code and method
 */
const isRetryable = (error: AxiosError, config: RetryConfig): boolean => {
  const statusCode = error.response?.status;
  const method = error.config?.method?.toUpperCase();

  if (!statusCode || !method) return false;

  const statusRetryable = config.retryableStatusCodes.includes(statusCode);
  const methodRetryable = config.retryableMethods.includes(method);

  return statusRetryable && methodRetryable;
};

/**
 * Calculate retry delay with exponential backoff
 */
const calculateRetryDelay = (attempt: number, config: RetryConfig): number => {
  return config.retryDelay * Math.pow(config.retryBackoffMultiplier, attempt - 1);
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Process queued requests when coming back online
 */
const processRequestQueue = async () => {
  if (isRetrying || requestQueue.length === 0) return;

  isRetrying = true;

  while (requestQueue.length > 0) {
    const request = requestQueue.shift();
    if (request) {
      try {
        await request();
      } catch (error) {
        console.error('Failed to process queued request:', error);
      }
    }
  }

  isRetrying = false;
};

// Request interceptor - Add auth token and detect offline status
api.interceptors.request.use(
  (config) => {
    // Add auth token
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Check online status
    if (!navigator.onLine) {
      // Queue the request for later
      return Promise.reject({
        config,
        isOffline: true,
        message: 'No internet connection',
      });
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors with retry logic
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean; _retryCount?: number };

    // Handle offline error
    if ((error as any).isOffline) {
      return new Promise((_, reject) => {
        // Queue the request
        requestQueue.push(() => {
          return api(originalRequest);
        });
        reject({
          ...error,
          isQueued: true,
          message: 'Request queued. Will sync when online.',
        });
      });
    }

    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Don't redirect if we're already on login page
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }

    // Initialize retry count
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Retry logic
    if (
      !originalRequest._retry &&
      isRetryable(error, DEFAULT_RETRY_CONFIG) &&
      (originalRequest._retryCount || 0) < DEFAULT_RETRY_CONFIG.maxRetries
    ) {
      originalRequest._retry = true;
      const newRetryCount = (originalRequest._retryCount || 0) + 1;
      originalRequest._retryCount = newRetryCount;

      const delay = calculateRetryDelay(newRetryCount, DEFAULT_RETRY_CONFIG);

      console.log(`Retrying request (attempt ${originalRequest._retryCount}/${DEFAULT_RETRY_CONFIG.maxRetries}) after ${delay}ms`);

      await sleep(delay);

      return api(originalRequest);
    }

    // Handle rate limiting (429)
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 60000; // Default 60 seconds

      console.log(`Rate limited. Waiting ${waitTime}ms before retry`);

      await sleep(waitTime);

      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

// Listen for online events to process queued requests
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Connection restored. Processing queued requests...');
    processRequestQueue();
  });
}

/**
 * API wrapper with loading and error state management
 */
export const apiRequest = async <T = any>(
  config: AxiosRequestConfig,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
    setLoading?: (loading: boolean) => void;
  }
): Promise<T> => {
  const { onSuccess, onError, setLoading } = options || {};

  try {
    setLoading?.(true);

    const response = await api(config);

    if (onSuccess) {
      onSuccess(response.data);
    }

    return response.data;
  } catch (error) {
    if (onError) {
      onError(error);
    }
    throw error;
  } finally {
    setLoading?.(false);
  }
};

/**
 * Check if currently online
 */
export const isOnline = (): boolean => {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
};

/**
 * Get queued request count
 */
export const getQueuedRequestCount = (): number => {
  return requestQueue.length;
};

export default api;
