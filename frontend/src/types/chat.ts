export type UserType = 'sil' | 'twan';

export interface UserProfile {
  id: UserType;
  name: string;
  role: string;
  avatarInitials: string;
  accentColor: string;
}

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export interface ChatMessage {
  id: string;
  tempId?: string;
  sender: UserType;
  text: string;
  createdAt: string;
  status: MessageStatus;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'mock';

export interface ChatState {
  currentUser: UserType;
  partner: UserProfile;
  messages: ChatMessage[];
  isPartnerTyping: boolean;
  connectionStatus: ConnectionStatus;
}
