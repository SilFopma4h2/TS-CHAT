import { ApiErrorResponse } from './types';

export class ApiClientError extends Error {
  readonly statusCode: number;
  readonly data?: ApiErrorResponse;
  readonly isNetworkError: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    data?: ApiErrorResponse,
    isNetworkError: boolean = false
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.data = data;
    this.isNetworkError = isNetworkError;
  }
}

export interface ApiClientConfig {
  baseUrl?: string;
  tokenStorageKey?: string;
}

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private tokenStorageKey: string;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = (
      config.baseUrl ||
      process.env.NEXT_PUBLIC_API_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
    this.tokenStorageKey = config.tokenStorageKey || 'ts_chat_token';

    // Haal eventueel opgeslagen token op uit browser storage
    if (typeof window !== 'undefined') {
      try {
        this.token = localStorage.getItem(this.tokenStorageKey);
      } catch {
        // Storage access kan in private mode blokkeren
      }
    }
  }

  setToken(token: string | null): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      try {
        if (token) {
          localStorage.setItem(this.tokenStorageKey, token);
        } else {
          localStorage.removeItem(this.tokenStorageKey);
        }
      } catch {
        // Safe swallow
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.replace(/\/$/, '');
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${this.baseUrl}${cleanEndpoint}`;

    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
      headers.set('Content-Type', 'application/json');
    }

    if (this.token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${this.token}`);
    }

    let response: Response;

    try {
      response = await fetch(url, {
        ...options,
        headers,
      });
    } catch {
      throw new ApiClientError(
        `Netwerkfout bij verbinden met API server (${url})`,
        0,
        undefined,
        true
      );
    }

    // Probeer response body te parsen als JSON
    let parsedData: unknown = null;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        parsedData = await response.json();
      } catch {
        parsedData = null;
      }
    } else {
      try {
        parsedData = await response.text();
      } catch {
        parsedData = null;
      }
    }

    if (!response.ok) {
      let errorMessage = `API request failed with status ${response.status}`;

      if (parsedData && typeof parsedData === 'object' && 'error' in parsedData) {
        const errObj = parsedData as ApiErrorResponse;
        if (typeof errObj.error === 'string') {
          errorMessage = errObj.error;
        }
      } else if (typeof parsedData === 'string' && parsedData.trim()) {
        errorMessage = parsedData;
      }

      throw new ApiClientError(
        errorMessage,
        response.status,
        parsedData as ApiErrorResponse | undefined
      );
    }

    return parsedData as T;
  }

  get<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
