import { apiClient } from './client';
import { ChatDto } from './types';

/**
 * Chats & Gesprekken API Endpoints
 */
export const chatsApi = {
  /**
   * Alle actieve gesprekken van de ingelogde gebruiker ophalen
   */
  async getChats(): Promise<ChatDto[]> {
    return apiClient.get<ChatDto[]>('/api/chats');
  },

  /**
   * Details van een specifiek gesprek ophalen
   */
  async getChatById(chatId: string): Promise<ChatDto> {
    return apiClient.get<ChatDto>(`/api/chats/${encodeURIComponent(chatId)}`);
  },

  /**
   * Direct gesprek starten/ophalen met een specifieke partner
   */
  async createDirectChat(partnerId: string): Promise<ChatDto> {
    return apiClient.post<ChatDto>('/api/chats', { partnerId });
  },
};
