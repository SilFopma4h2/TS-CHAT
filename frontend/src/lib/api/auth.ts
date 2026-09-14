import { apiClient } from './client';
import { AuthResponse, LoginRequest, RegisterRequest, UserDto } from './types';

/**
 * Authentication API Endpoints
 */
export const authApi = {
  /**
   * Inloggen met gebruikersnaam en optioneel wachtwoord
   */
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/login', credentials);
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  /**
   * Nieuwe gebruiker registreren
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
    if (response.token) {
      apiClient.setToken(response.token);
    }
    return response;
  },

  /**
   * Huidige ingelogde gebruiker ophalen
   */
  async getMe(): Promise<UserDto> {
    return apiClient.get<UserDto>('/api/auth/me');
  },

  /**
   * Uitloggen en token wissen
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Zelfs als server call faalt, token lokaal wissen
    } finally {
      apiClient.setToken(null);
    }
  },
};
