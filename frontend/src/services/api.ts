import { apiClient, authApi, chatsApi, messagesApi, healthApi } from '@/lib/api';
import { ChatMessage, UserType } from '@/types/chat';

export interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
}

export const apiService = {
  async getHealth(): Promise<HealthResponse> {
    try {
      const res = await healthApi.checkHealth();
      return { status: res.status === 'ok' ? 'ok' : 'error', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', timestamp: new Date().toISOString() };
    }
  },

  async getMessages(
    chatId: string = 'conv-sil-twan',
    limit: number = 50,
    before?: string
  ): Promise<ChatMessage[]> {
    try {
      const messages = await messagesApi.getMessages(chatId, { limit, before });
      return messages.map((m) => ({
        id: m.id,
        tempId: m.tempId,
        conversationId: m.chatId,
        sender: (m.senderId === 'sil' ? 'sil' : 'twan') as UserType,
        text: m.text,
        createdAt: m.createdAt,
        status: (m.status as 'sending' | 'sent' | 'delivered' | 'read') || 'sent',
      }));
    } catch {
      return [];
    }
  },

  async sendMessage(
    chatId: string = 'conv-sil-twan',
    sender: UserType,
    text: string
  ): Promise<ChatMessage | null> {
    try {
      const res = await messagesApi.sendMessage(chatId, { text, tempId: `temp-${Date.now()}` });
      return {
        id: res.id,
        tempId: res.tempId,
        conversationId: res.chatId,
        sender,
        text: res.text,
        createdAt: res.createdAt,
        status: (res.status as 'sending' | 'sent' | 'delivered' | 'read') || 'sent',
      };
    } catch {
      return null;
    }
  },

  apiClient,
  authApi,
  chatsApi,
  messagesApi,
  healthApi,
};
