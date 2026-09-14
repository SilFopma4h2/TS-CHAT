import { ChatMessage } from '@/types/chat';

/**
 * REST API client interface voor TS-CHAT
 * Wordt gekoppeld aan de backend in latere MVP fasen.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

export const apiService = {
  /**
   * Health check van de backend server
   */
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await fetch(`${API_BASE_URL}/health`);
      if (!res.ok) throw new Error(`Health check failed: ${res.status}`);
      return await res.json();
    } catch {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  },

  /**
   * Ophalen van historische berichten
   */
  async getMessages(limit: number = 50, before?: string): Promise<ChatMessage[]> {
    try {
      const params = new URLSearchParams({ limit: limit.toString() });
      if (before) params.append('before', before);

      const res = await fetch(`${API_BASE_URL}/messages?${params.toString()}`);
      if (!res.ok) throw new Error(`Fetch messages failed: ${res.status}`);
      return await res.json();
    } catch {
      return [];
    }
  },

  /**
   * Fallback voor verzenden via REST
   */
  async sendMessage(sender: string, text: string): Promise<ChatMessage | null> {
    try {
      const res = await fetch(`${API_BASE_URL}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender, text }),
      });
      if (!res.ok) throw new Error(`Send message failed: ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },
};
