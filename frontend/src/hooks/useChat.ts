'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { ChatMessage, Conversation, UserType } from '@/types/chat';
import { INITIAL_CONVERSATIONS, INITIAL_MOCK_MESSAGES, USERS } from '@/lib/constants';
import { generateId } from '@/lib/utils';
import { authApi, chatsApi, messagesApi } from '@/lib/api';
import { apiClient } from '@/lib/api/client';
import { webSocketService } from '@/services/websocket';
import { WebSocketMessage } from '@/types/events';
import { getMockReply } from '@/services/mockChatService';

export function useChat() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserType>('sil');
  const [user, setUser] = useState({ id: "sil", username: "sil", name: "Sil", role: "Frontend & Infra", isOnline: true });
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS);
  const [activeConversationId, setActiveConversationId] = useState<string>('conv-sil-twan');
  const [messagesByConversation, setMessagesByConversation] =
    useState<Record<string, ChatMessage[]>>(INITIAL_MOCK_MESSAGES);

  const [isPartnerTyping, setIsPartnerTyping] = useState<boolean>(false);
  const [partnerIsOnline, setPartnerIsOnline] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected' | 'mock'>('mock');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState<boolean>(true);

  const partnerId: UserType = currentUser === 'sil' ? 'twan' : 'sil';
  const partner = {
    ...USERS[partnerId],
    isOnline: partnerIsOnline,
  };

  const timeoutsRef = useRef<NodeJS.Timeout[]>([]);
  const activeConversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

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

  const login = useCallback(async (credentials: { username: string; password?: string }) => {
    setIsLoading(true); setError(null);
    try {
      const res = await authApi.login(credentials);
      setIsAuthenticated(true);
      setCurrentUser(res.user.username as UserType);
      setUser({ id: res.user.id, username: res.user.username || res.user.id, name: res.user.name || res.user.username, role: res.user.role || '', isOnline: res.user.isOnline ?? true });
      webSocketService.init('ws://localhost:3000/ws');
      webSocketService.connect();
      try { const chats = await chatsApi.getChats(); setConversations(chats.map(c => ({ id: c.id, partnerId: (c.participants.find(p => p.id !== res.user.id)?.id as UserType) || partnerId, title: c.name || '', subtitle: '', unreadCount: c.unreadCount || 0, updatedAt: c.updatedAt })) as Conversation[]); } catch { /* backend missing */ }
      setConnectionStatus('connected');
    } catch (e: any) {
      setError(e?.message || 'Inloggen mislukt');
      setConnectionStatus('disconnected');
    } finally { setIsLoading(false); }
  }, [partnerId]);

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
    setConversations((prev) => prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c)));
    messagesApi.getMessages(convId).catch(() => { /* backend missing — keep mock */ });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
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
        const convId = activeConversationIdRef.current;
        setMessagesByConversation((prev) => {
          const list = prev[convId] || [];
          return {
            ...prev,
            [convId]: list.map((msg) =>
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
            const convId = activeConversationIdRef.current;
            const reply: ChatMessage = {
              ...getMockReply(partnerId),
              conversationId: convId,
            };

            setMessagesByConversation((prev) => {
              const list = prev[convId] || [];
              return {
                ...prev,
                [convId]: [
                  ...list.map((m) =>
                    m.id === newMessage.id ? { ...m, status: 'read' as const } : m
                  ),
                  reply,
                ],
              };
            });

            updateConversationMeta(convId, reply);
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
