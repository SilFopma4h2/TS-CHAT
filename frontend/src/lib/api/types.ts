/**
 * TypeScript definities voor de TS-CHAT REST API Client
 * Afgestemd op docs/API.md en Twan's backend contract
 */

export interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

export interface HealthResponse {
  status: 'ok';
}

export interface UserDto {
  id: string;
  username: string;
  name?: string;
  role?: string;
  isOnline?: boolean;
  lastSeen?: string;
  createdAt?: string;
}

export interface LoginRequest {
  username: string;
  password?: string;
}

export interface RegisterRequest {
  username: string;
  password?: string;
  role?: string;
}

export interface AuthResponse {
  user: UserDto;
  token?: string;
}

export interface ChatDto {
  id: string;
  name?: string;
  participants: UserDto[];
  lastMessage?: MessageDto;
  unreadCount?: number;
  updatedAt: string;
}

export interface MessageDto {
  id: string;
  chatId: string;
  senderId: string;
  text: string;
  createdAt: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read';
  tempId?: string;
}

export interface GetMessagesQuery {
  limit?: number;
  before?: string;
}

export interface SendMessageRequest {
  text: string;
  tempId?: string;
}
