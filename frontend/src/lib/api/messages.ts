import { apiClient } from './client';
import { GetMessagesQuery, MessageDto, SendMessageRequest } from './types';

/**
 * Berichten API Endpoints
 */
export const messagesApi = {
  /**
   * Historische berichten ophalen voor een specifiek gesprek
   */
  async getMessages(chatId: string, query?: GetMessagesQuery): Promise<MessageDto[]> {
    const params = new URLSearchParams();
    if (query?.limit) {
      params.append('limit', query.limit.toString());
    }
    if (query?.before) {
      params.append('before', query.before);
    }

    const queryString = params.toString();
    const endpoint = `/api/chats/${encodeURIComponent(chatId)}/messages${
      queryString ? `?${queryString}` : ''
    }`;

    return apiClient.get<MessageDto[]>(endpoint);
  },

  /**
   * Bericht versturen via REST (bijv. fallback wanneer WebSocket offline is)
   */
  async sendMessage(chatId: string, data: SendMessageRequest): Promise<MessageDto> {
    return apiClient.post<MessageDto>(
      `/api/chats/${encodeURIComponent(chatId)}/messages`,
      data
    );
  },
};
