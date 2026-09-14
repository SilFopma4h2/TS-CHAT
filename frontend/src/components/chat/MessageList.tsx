'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessage, UserProfile, UserType } from '@/types/chat';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { LoadingSkeleton } from '@/components/ui/LoadingSkeleton';
import { ErrorState } from '@/components/ui/ErrorState';
import { EmptyChatState } from '@/components/ui/EmptyChatState';
import { USERS } from '@/lib/constants';
import { formatMessageDate } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: UserType;
  partner: UserProfile;
  isPartnerTyping: boolean;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  partner,
  isPartnerTyping,
  isLoading = false,
  error = null,
  onRetry,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isLoading && !error) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isPartnerTyping, isLoading, error]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto py-4 space-y-1 scroll-smooth bg-zinc-950/60 flex flex-col"
    >
      {/* 1. Loading State */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : error ? (
        /* 2. Error State */
        <ErrorState message={error} onRetry={onRetry} />
      ) : messages.length === 0 ? (
        /* 3. Empty Chat State */
        <EmptyChatState partner={partner} />
      ) : (
        /* 4. Normal Message List */
        <>
          <div className="flex justify-center my-2">
            <span className="bg-zinc-900/90 text-zinc-400 text-[11px] font-medium px-3 py-1 rounded-full border border-zinc-800 shadow-xs">
              {formatMessageDate(messages[0].createdAt)}
            </span>
          </div>

          {messages.map((message) => {
            const isSelf = message.sender === currentUser;
            const senderProfile = USERS[message.sender];

            return (
              <MessageItem
                key={message.id}
                message={message}
                isSelf={isSelf}
                senderProfile={senderProfile}
              />
            );
          })}

          {isPartnerTyping && <TypingIndicator partner={partner} />}

          <div ref={bottomRef} className="h-1" />
        </>
      )}
    </div>
  );
};
