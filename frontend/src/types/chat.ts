export type UserType = 'sil' | 'twan';

export interface UserProfile {
  id: UserType;
  name: string;
  role: string;
  avatarInitials: string;
  accentColor: string;
  isOnline: boolean;
  lastSeen?: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  tempId?: string;
  conversationId: string;
  sender: UserType;
  text: string;
  createdAt: string;
  status: MessageStatus;
}

export interface Conversation {
  id: string;
  partnerId: UserType;
  title: string;
  subtitle: string;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'mock';

export type AuthMode = 'login' | 'register';
