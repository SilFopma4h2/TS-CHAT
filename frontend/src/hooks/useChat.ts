'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, ConnectionStatus, UserType } from '@/types/chat';
import { INITIAL_MOCK_MESSAGES, USERS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { getMockReply } from '@/services/mockChatService';

export function useChat() {
  const [currentUser, setCurrentUser] = useState<UserType>('sil');
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MOCK_MESSAGES);
  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const [connectionStatus] = useState<ConnectionStatus>('mock');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(true);

  const partnerId: UserType = currentUser === 'sil' ? 'twan' : 'sil';
  const partner = USERS[partnerId];
  const user = USERS[currentUser];

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);

  const clearPendingTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout);
    timeoutsRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimeouts();
    };
  }, [clearPendingTimeouts]);

  const switchUser = useCallback((newUser: UserType) => {
    setCurrentUser(newUser);
    setIsPartnerTyping(false);
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;

      const newMessage: ChatMessage = {
        id: generateId('msg'),
        sender: currentUser,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        status: 'sent',
      };

      setMessages((prev) => [...prev, newMessage]);

      // Simuleer status update naar 'delivered' na 500ms
      const statusTimeout = setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
          )
        );
      }, 500);
      timeoutsRef.current.push(statusTimeout);

      // Simuleer partner reactie als auto-reply aan staat
      if (autoReplyEnabled) {
        const typingTimeout = setTimeout(() => {
          setIsPartnerTyping(true);

          const replyTimeout = setTimeout(() => {
            setIsPartnerTyping(false);
            const reply = getMockReply(partnerId);
            setMessages((prev) => [
              ...prev.map((m) => (m.id === newMessage.id ? { ...m, status: 'read' as const } : m)),
              reply,
            ]);
          }, 1800);

          timeoutsRef.current.push(replyTimeout);
        }, 800);

        timeoutsRef.current.push(typingTimeout);
      }
    },
    [currentUser, partnerId, autoReplyEnabled]
  );

  const triggerPartnerReply = useCallback(() => {
    setIsPartnerTyping(true);
    const timeout = setTimeout(() => {
      setIsPartnerTyping(false);
      const reply = getMockReply(partnerId);
      setMessages((prev) => [...prev, reply]);
    }, 1500);
    timeoutsRef.current.push(timeout);
  }, [partnerId]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const resetMockMessages = useCallback(() => {
    setMessages(INITIAL_MOCK_MESSAGES);
  }, []);

  return {
    currentUser,
    user,
    partner,
    messages,
    isPartnerTyping,
    connectionStatus,
    autoReplyEnabled,
    setAutoReplyEnabled,
    switchUser,
    sendMessage,
    triggerPartnerReply,
    clearMessages,
    resetMockMessages,
  };
}
