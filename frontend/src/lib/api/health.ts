import { apiClient } from './client';
import { HealthResponse } from './types';

/**
 * Backend Health Check Endpoint (conform Twan's backend Deel 1)
 */
export const healthApi = {
  /**
   * Health status controleren (GET /health)
   */
  async checkHealth(): Promise<HealthResponse> {
    return apiClient.get<HealthResponse>('/health');
  },
};
