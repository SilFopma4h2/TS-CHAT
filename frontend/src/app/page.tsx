'use client';

import React from 'react';
import { useChat } from '@/hooks/useChat';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageInput } from '@/components/chat/MessageInput';

export default function Home() {
  const {
    currentUser,
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
  } = useChat();

  return (
    <ChatLayout>
      <ChatHeader
        partner={partner}
        currentUser={currentUser}
        isPartnerTyping={isPartnerTyping}
        connectionStatus={connectionStatus}
        onSelectUser={switchUser}
        onResetMessages={resetMockMessages}
        onClearMessages={clearMessages}
      />

      <MessageList
        messages={messages}
        currentUser={currentUser}
        partner={partner}
        isPartnerTyping={isPartnerTyping}
      />

      <MessageInput
        onSendMessage={sendMessage}
        onTriggerPartnerReply={triggerPartnerReply}
        autoReplyEnabled={autoReplyEnabled}
        onToggleAutoReply={() => setAutoReplyEnabled(!autoReplyEnabled)}
        partnerName={partner.name}
      />
    </ChatLayout>
  );
}
