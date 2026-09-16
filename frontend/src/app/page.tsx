'use client';
import { UserType } from '@/types/chat';
import { USERS } from '@/lib/constants';

import React, { useState } from 'react';
import { useChat } from '@/hooks/useChat';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { ChatLayout } from '@/components/layout/ChatLayout';
import { ConversationList } from '@/components/chat/ConversationList';
import { ChatHeader } from '@/components/chat/ChatHeader';
import { MessageList } from '@/components/chat/MessageList';
import { MessageComposer } from '@/components/chat/MessageComposer';

export default function Home() {
  const {
    isAuthenticated,
    currentUser,
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
  } = useChat();

  // Voor mobiele weergave: 'list' (overzicht) of 'chat' (geopend chatvenster)
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('chat');

  // 1. Scherm 1: Login / Register Scherm
  if (!isAuthenticated) {
    return <AuthScreen onLogin={(u: UserType) => login({ username: u })} />;
  }

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setMobileView('chat');
  };

  return (
    <ChatLayout>
      {/* 2. Scherm 2: Chat Overzicht (Sidebar op desktop, vol scherm op mobiel in 'list' modus) */}
      <div
        className={`w-full md:w-80 h-full ${
          mobileView === 'list' ? 'flex' : 'hidden md:flex'
        }`}
      >
        <ConversationList
          conversations={conversations}
          selectedConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          currentUser={USERS[currentUser]}
          onLogout={logout}
          onSwitchUser={switchUser}
          partnerIsOnline={partnerIsOnline}
          onTogglePartnerOnline={togglePartnerOnline}
        />
      </div>

      {/* 3, 4 & 5. Scherm 3, 4, 5: Chatvenster, Berichtenlijst & Message Composer */}
      <section
        className={`flex-1 flex flex-col h-full bg-zinc-950/80 min-w-0 ${
          mobileView === 'chat' ? 'flex' : 'hidden md:flex'
        }`}
      >
        {/* Chatvenster Header */}
        <ChatHeader
          partner={partner}
          isPartnerTyping={isPartnerTyping}
          onBack={() => setMobileView('list')}
          isLoading={isLoading}
          onToggleLoading={toggleLoading}
          hasError={Boolean(error)}
          onToggleError={toggleError}
          onResetMessages={resetMockMessages}
          onClearMessages={clearMessages}
        />

        {/* Berichtenlijst (inclusief leeg, loading & error state) */}
        <MessageList
          messages={activeMessages}
          currentUser={currentUser}
          partner={partner}
          isPartnerTyping={isPartnerTyping}
          isLoading={isLoading}
          error={error}
          onRetry={retryLoading}
        />

        {/* Message Composer (Berichtinvoer) */}
        <MessageComposer
          onSendMessage={sendMessage}
          onTriggerPartnerReply={triggerPartnerReply}
          autoReplyEnabled={autoReplyEnabled}
          onToggleAutoReply={() => setAutoReplyEnabled(!autoReplyEnabled)}
          partnerName={partner.name}
          disabled={isLoading || Boolean(error)}
        />
      </section>
    </ChatLayout>
  );
}
