'use client';

import React, { useEffect, useRef } from 'react';
import { ChatMessage, UserProfile, UserType } from '@/types/chat';
import { MessageItem } from './MessageItem';
import { TypingIndicator } from './TypingIndicator';
import { USERS } from '@/lib/constants';
import { formatMessageDate } from '@/lib/utils';

interface MessageListProps {
  messages: ChatMessage[];
  currentUser: UserType;
  partner: UserProfile;
  isPartnerTyping: boolean;
}

export const MessageList: React.FC<MessageListProps> = ({
  messages,
  currentUser,
  partner,
  isPartnerTyping,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto py-4 space-y-1 scroll-smooth bg-zinc-950/60"
    >
      {/* Date badge */}
      <div className="flex justify-center my-2">
        <span className="bg-zinc-900/90 text-zinc-400 text-[11px] font-medium px-3 py-1 rounded-full border border-zinc-800 shadow-xs">
          {messages.length > 0
            ? formatMessageDate(messages[0].createdAt)
            : 'Vandaag'}
        </span>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-center px-4">
          <div className="w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-2">
            💬
          </div>
          <p className="text-sm font-medium text-zinc-400">Nog geen berichten</p>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs">
            Start een privégesprek tussen Sil en Twan door hieronder een bericht te typen.
          </p>
        </div>
      ) : (
        messages.map((message) => {
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
        })
      )}

      {isPartnerTyping && <TypingIndicator partner={partner} />}

      <div ref={bottomRef} className="h-1" />
    </div>
  );
};
