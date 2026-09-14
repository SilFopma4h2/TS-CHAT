import { ChatMessage, Conversation, UserProfile, UserType } from '@/types/chat';

export const USERS: Record<UserType, UserProfile> = {
  sil: {
    id: 'sil',
    name: 'Sil',
    role: 'Frontend & Infra',
    avatarInitials: 'S',
    accentColor: 'bg-emerald-600 text-white',
    isOnline: true,
  },
  twan: {
    id: 'twan',
    name: 'Twan',
    role: 'Backend & Realtime',
    avatarInitials: 'T',
    accentColor: 'bg-indigo-600 text-white',
    isOnline: true,
    lastSeen: 'Zojuist',
  },
};

export const INITIAL_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv-sil-twan',
    partnerId: 'twan',
    title: 'Twan',
    subtitle: 'Backend & Realtime Server',
    unreadCount: 1,
    updatedAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
  },
];

export const INITIAL_MOCK_MESSAGES: Record<string, ChatMessage[]> = {
  'conv-sil-twan': [
    {
      id: 'msg-1',
      conversationId: 'conv-sil-twan',
      sender: 'sil',
      text: 'Hoi Twan, ik ben bezig met de chat UI voor TS-CHAT.',
      createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-2',
      conversationId: 'conv-sil-twan',
      sender: 'twan',
      text: 'Top Sil! De backend structuur en de health checks op poort 3000 zijn al geconfigureerd.',
      createdAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-3',
      conversationId: 'conv-sil-twan',
      sender: 'sil',
      text: 'Mooi. We houden het ontwerp licht en responsive voor desktop en mobiel.',
      createdAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
      status: 'read',
    },
    {
      id: 'msg-4',
      conversationId: 'conv-sil-twan',
      sender: 'twan',
      text: 'Ziet er goed uit. De Raspberry Pi 3 gaat dit prima kunnen draaien.',
      createdAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
      status: 'delivered',
    },
  ],
};
