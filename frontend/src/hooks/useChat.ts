'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, Conversation, UserType } from '@/types/chat';
import { INITIAL_CONVERSATIONS, INITIAL_MOCK_MESSAGES, USERS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { getMockReply } from '@/services/mockChatService';

export function useChat() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<UserType>('sil');
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-sil-twan');
  const [messagesByConversation, setMessagesByConversation] =
    useState<Record<string, ChatMessage[]>>(INITIAL_MOCK_MESSAGES);

  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const [partnerIsOnline, setPartnerIsOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(true);

  const partnerId: UserType = currentUser === 'sil' ? 'twan' : 'sil';
  const partner = {
    ...USERS[partnerId],
    isOnline: partnerIsOnline,
  };
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

  const activeMessages = messagesByConversation[activeConversationId] || [];

  // Update conversation lastMessage & timestamp when messages change
  const updateConversationMeta = useCallback((convId: string, lastMsg: ChatMessage) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === convId
          ? {
              ...c,
              lastMessage: lastMsg,
              updatedAt: lastMsg.createdAt,
            }
          : c
      )
    );
  }, []);

  const login = useCallback((selectedUser: UserType) => {
    setCurrentUser(selectedUser);
    setIsAuthenticated(true);
    setIsPartnerTyping(false);
  }, []);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    clearPendingTimeouts();
    setIsPartnerTyping(false);
  }, [clearPendingTimeouts]);

  const switchUser = useCallback((newUser: UserType) => {
    setCurrentUser(newUser);
    setIsPartnerTyping(false);
  }, []);

  const selectConversation = useCallback((convId: string) => {
    setActiveConversationId(convId);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
    );
  }, []);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !activeConversationId) return;

      const newMessage: ChatMessage = {
        id: generateId('msg'),
        conversationId: activeConversationId,
        sender: currentUser,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        status: 'sent',
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), newMessage],
      }));

      updateConversationMeta(activeConversationId, newMessage);

      // Simuleer status update naar 'delivered' na 500ms
      const statusTimeout = setTimeout(() => {
        setMessagesByConversation((prev) => {
          const list = prev[activeConversationId] || [];
          return {
            ...prev,
            [activeConversationId]: list.map((msg) =>
              msg.id === newMessage.id ? { ...msg, status: 'delivered' } : msg
            ),
          };
        });
      }, 500);
      timeoutsRef.current.push(statusTimeout);

      // Simuleer partner reactie
      if (autoReplyEnabled && partnerIsOnline) {
        const typingTimeout = setTimeout(() => {
          setIsPartnerTyping(true);

          const replyTimeout = setTimeout(() => {
            setIsPartnerTyping(false);
            const reply: ChatMessage = {
              ...getMockReply(partnerId),
              conversationId: activeConversationId,
            };

            setMessagesByConversation((prev) => {
              const list = prev[activeConversationId] || [];
              return {
                ...prev,
                [activeConversationId]: [
                  ...list.map((m) =>
                    m.id === newMessage.id ? { ...m, status: 'read' as const } : m
                  ),
                  reply,
                ],
              };
            });

            updateConversationMeta(activeConversationId, reply);
          }, 1800);

          timeoutsRef.current.push(replyTimeout);
        }, 800);

        timeoutsRef.current.push(typingTimeout);
      }
    },
    [activeConversationId, currentUser, partnerId, autoReplyEnabled, partnerIsOnline, updateConversationMeta]
  );

  const triggerPartnerReply = useCallback(() => {
    if (!activeConversationId) return;

    setIsPartnerTyping(true);
    const timeout = setTimeout(() => {
      setIsPartnerTyping(false);
      const reply: ChatMessage = {
        ...getMockReply(partnerId),
        conversationId: activeConversationId,
      };

      setMessagesByConversation((prev) => ({
        ...prev,
        [activeConversationId]: [...(prev[activeConversationId] || []), reply],
      }));

      updateConversationMeta(activeConversationId, reply);
    }, 1500);
    timeoutsRef.current.push(timeout);
  }, [activeConversationId, partnerId, updateConversationMeta]);

  const toggleLoading = useCallback(() => {
    setIsLoading((prev) => !prev);
  }, []);

  const toggleError = useCallback(() => {
    setError((prev) =>
      prev ? null : 'Kan geen verbinding maken met de TS-CHAT backend (Mock Error).'
    );
  }, []);

  const retryLoading = useCallback(() => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  }, []);

  const togglePartnerOnline = useCallback(() => {
    setPartnerIsOnline((prev) => !prev);
  }, []);

  const clearMessages = useCallback(() => {
    if (!activeConversationId) return;
    setMessagesByConversation((prev) => ({
      ...prev,
      [activeConversationId]: [],
    }));
  }, [activeConversationId]);

  const resetMockMessages = useCallback(() => {
    setMessagesByConversation(INITIAL_MOCK_MESSAGES);
    setConversations(INITIAL_CONVERSATIONS);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    isAuthenticated,
    currentUser,
    user,
    partner,
    partnerIsOnline,
    conversations,
    activeConversationId,
    activeMessages,
    isPartnerTyping,
    isLoading,
    error,
    autoReplyEnabled,
    setAutoReplyEnabled,
    login,
    logout,
    switchUser,
    selectConversation,
    sendMessage,
    triggerPartnerReply,
    toggleLoading,
    toggleError,
    retryLoading,
    togglePartnerOnline,
    clearMessages,
    resetMockMessages,
  };
}
