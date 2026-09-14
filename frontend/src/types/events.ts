import { UserType } from './chat';

/**
 * WebSocket Protocol Types voor toekomstige integratie (zie docs/MVP-PLAN.md)
 */

export type WebSocketEventType =
  | 'AUTH'
  | 'AUTH_SUCCESS'
  | 'SEND_MESSAGE'
  | 'NEW_MESSAGE'
  | 'MESSAGE_ACK'
  | 'TYPING'
  | 'TYPING_STATUS'
  | 'READ_ACK'
  | 'USER_STATUS'
  | 'ERROR';

export interface AuthEventPayload {
  user: UserType;
  token?: string;
}

export interface SendMessagePayload {
  tempId: string;
  text: string;
}

export interface NewMessagePayload {
  id: string;
  sender: UserType;
  text: string;
  createdAt: string;
}

export interface MessageAckPayload {
  tempId: string;
  id: string;
  createdAt: string;
}

export interface TypingPayload {
  isTyping: boolean;
}

export interface TypingStatusPayload {
  user: UserType;
  isTyping: boolean;
}

export interface UserStatusPayload {
  user: UserType;
  online: boolean;
  lastSeen?: string;
}

export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  payload: T;
}
