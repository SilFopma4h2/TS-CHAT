import { ChatMessage, UserType } from '@/types/chat';
import { healthApi, messagesApi } from '@/lib/api';

/**
 * Service adapter die de UI verbindt met de onderliggende REST API client abstraction.
 */

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
      const res = await healthApi.checkHealth();
      return { status: res.status, timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  },

  /**
   * Ophalen van historische berichten voor een gesprek
   */
  async getMessages(
    chatId: string = 'conv-sil-twan',
    limit: number = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    try {
      const messages = await messagesApi.getMessages(chatId, { limit, before });
      return messages.map((m) => ({
        id: m.id,
        conversationId: m.chatId,
        sender: (m.senderId === 'sil' ? 'sil' : 'twan') as UserType,
        text: m.text,
        createdAt: m.createdAt,
        status: m.status || 'read',
      }));
    } catch {
      return [];
    }
  },

  /**
   * Fallback voor verzenden via REST
   */
  async sendMessage(
    chatId: string = 'conv-sil-twan',
    sender: UserType,
    text: string
  ): Promise<ChatMessage | null> {
    try {
      const res = await messagesApi.sendMessage(chatId, { text });
      return {
        id: res.id,
        conversationId: res.chatId,
        sender,
        text: res.text,
        createdAt: res.createdAt,
        status: res.status || 'sent',
      };
    } catch {
      return null;
    }
  },
};
