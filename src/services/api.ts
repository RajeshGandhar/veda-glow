// ═══════════════════════════════════════════════════════════════════════════
// 🔧 API SERVICE - Centralized, Future-Proof API Client
// ═══════════════════════════════════════════════════════════════════════════
// 
// Features:
// ✅ Automatic path sanitization (prevents /api/api duplication)
// ✅ Centralized error handling
// ✅ Type-safe responses
// ✅ Automatic credentials (cookies) for admin auth
// ✅ Production-ready with proper error messages
//
// Usage:
//   import { apiClient } from './services/api';
//   const data = await apiClient.get('/admin/orders');
//   const result = await apiClient.post('/admin/login', { email, password });
// ═══════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────
// Configuration
// ─────────────────────────────────────────────────────────────────────────

const VITE_API_URL = import.meta.env.VITE_API_URL;

if (!VITE_API_URL) {
  throw new Error(
    "❌ VITE_API_URL environment variable is required.\n" +
      "Add it to your .env file:\n" +
      "  Development: VITE_API_URL=http://localhost:5000/api\n" +
      "  Production: VITE_API_URL=https://your-domain.com/api"
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Path Sanitization - Prevents /api/api duplication
// ─────────────────────────────────────────────────────────────────────────

/**
 * Sanitizes API paths to prevent duplication bugs
 * 
 * Examples:
 *   sanitizePath('/api/admin/login') → '/admin/login'
 *   sanitizePath('admin/login') → '/admin/login'
 *   sanitizePath('//admin//login') → '/admin/login'
 * 
 * This ensures that even if a developer accidentally adds /api,
 * the final URL will never be /api/api/...
 */
function sanitizePath(path: string): string {
  // Remove leading/trailing whitespace
  let cleaned = path.trim();
  
  // Remove /api prefix if present (prevents duplication)
  cleaned = cleaned.replace(/^\/api\/?/, '/');
  
  // Ensure path starts with /
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned;
  }
  
  // Remove duplicate slashes
  cleaned = cleaned.replace(/\/+/g, '/');
  
  return cleaned;
}

/**
 * Builds the full API URL with automatic sanitization
 * 
 * @param path - API endpoint path (e.g., '/admin/orders' or 'admin/orders')
 * @returns Full URL (e.g., 'https://domain.com/api/admin/orders')
 */
function buildUrl(path: string): string {
  const sanitized = sanitizePath(path);
  const baseUrl = VITE_API_URL.replace(/\/$/, ''); // Remove trailing slash from base
  return `${baseUrl}${sanitized}`;
}

// ─────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown;
}

export interface RequestOptions extends RequestInit {
  skipAuth?: boolean; // Skip credentials for public endpoints
}

// ─────────────────────────────────────────────────────────────────────────
// Response Handler
// ─────────────────────────────────────────────────────────────────────────

/**
 * Handles API responses with proper error handling
 * 
 * @param response - Fetch Response object
 * @returns Parsed JSON data
 * @throws Error with user-friendly message
 */
async function handleResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  
  // Parse response body
  let data: unknown;
  try {
    data = contentType?.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`);
  }

  // Handle error responses
  if (!response.ok) {
    const error = data as ApiError;
    const message = error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return data as T;
}

// ─────────────────────────────────────────────────────────────────────────
// API Client - Main Interface
// ─────────────────────────────────────────────────────────────────────────

/**
 * Centralized API client with automatic path sanitization
 * 
 * All requests automatically:
 * - Sanitize paths (prevent /api/api)
 * - Include credentials (cookies) for auth
 * - Handle errors consistently
 * - Parse JSON responses
 */
export const apiClient = {
  /**
   * GET request
   * @param path - API endpoint (e.g., '/admin/orders')
   * @param options - Additional fetch options
   */
  async get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: "GET",
      credentials: options?.skipAuth ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * POST request
   * @param path - API endpoint (e.g., '/admin/login')
   * @param body - Request body (will be JSON stringified)
   * @param options - Additional fetch options
   */
  async post<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: "POST",
      credentials: options?.skipAuth ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * PATCH request
   * @param path - API endpoint (e.g., '/admin/orders/123/status')
   * @param body - Request body (will be JSON stringified)
   * @param options - Additional fetch options
   */
  async patch<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: "PATCH",
      credentials: options?.skipAuth ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * DELETE request
   * @param path - API endpoint (e.g., '/admin/coupons/123')
   * @param options - Additional fetch options
   */
  async delete<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: "DELETE",
      credentials: options?.skipAuth ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      ...options,
    });
    return handleResponse<T>(response);
  },

  /**
   * PUT request
   * @param path - API endpoint
   * @param body - Request body (will be JSON stringified)
   * @param options - Additional fetch options
   */
  async put<T = unknown>(
    path: string,
    body?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    const url = buildUrl(path);
    const response = await fetch(url, {
      method: "PUT",
      credentials: options?.skipAuth ? "omit" : "include",
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });
    return handleResponse<T>(response);
  },
};

// ─────────────────────────────────────────────────────────────────────────
// Export sanitization utilities for testing
// ─────────────────────────────────────────────────────────────────────────

export const __testing__ = {
  sanitizePath,
  buildUrl,
};
