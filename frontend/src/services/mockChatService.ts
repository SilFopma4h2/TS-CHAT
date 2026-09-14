import { ChatMessage, UserType } from '@/types/chat';
import { generateId } from '@/lib/utils';

/**
 * Mock Chat Simulator
 * Simuleert partner-antwoorden voor lokaal testen en prototyping
 */

const MOCK_REPLIES: Record<UserType, string[]> = {
  sil: [
    'Ik heb de deploymentconfiguratie gecheckt op de Raspberry Pi 3!',
    'Laten we de Nginx reverse proxy testen.',
    'Ziet er strak uit op mobiel formaat.',
    'Docker container gebruikt slechts ~12MB RAM, perfect!',
  ],
  twan: [
    'Database migraties zijn uitgevoerd!',
    'WebSocket handshake protocol is geoptimaliseerd.',
    'Ik test nu de heartbeat ping/pong.',
    'Berichtenhistoriek wordt nu netjes gepagineerd opgeslagen.',
  ],
};

export function getMockReply(sender: UserType, conversationId: string = 'conv-sil-twan'): ChatMessage {
  const replies = MOCK_REPLIES[sender];
  const text = replies[Math.floor(Math.random() * replies.length)];

  return {
    id: generateId('mock'),
    conversationId,
    sender,
    text,
    createdAt: new Date().toISOString(),
    status: 'read',
  };
}
