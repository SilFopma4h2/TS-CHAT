import React from 'react';
import { ChatMessage, UserProfile } from '@/types/chat';
import { cn, formatMessageTime } from '@/lib/utils';

interface MessageItemProps {
  message: ChatMessage;
  isSelf: boolean;
  senderProfile: UserProfile;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isSelf,
  senderProfile,
}) => {
  const renderStatus = () => {
    if (!isSelf) return null;

    switch (message.status) {
      case 'sending':
        return <span className="text-zinc-400 text-[10px] ml-1">⏱</span>;
      case 'sent':
        return <span className="text-zinc-400 text-[11px] ml-1">✓</span>;
      case 'delivered':
        return <span className="text-zinc-400 text-[11px] ml-1">✓✓</span>;
      case 'read':
        return <span className="text-emerald-400 text-[11px] ml-1 font-bold">✓✓</span>;
      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        'flex items-end gap-2 my-1.5 px-3 sm:px-4 group',
        isSelf ? 'justify-end' : 'justify-start'
      )}
    >
      {/* Avatar van de partner (alleen voor ontvangen berichten) */}
      {!isSelf && (
        <div
          className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mb-1 shadow-sm',
            senderProfile.accentColor
          )}
          title={`${senderProfile.name} (${senderProfile.role})`}
        >
          {senderProfile.avatarInitials}
        </div>
      )}

      {/* Bericht Bubble */}
      <div
        className={cn(
          'relative max-w-[82%] sm:max-w-[70%] rounded-2xl px-3.5 py-2.5 shadow-sm text-sm break-words transition-all',
          isSelf
            ? 'bg-emerald-600 text-white rounded-br-xs'
            : 'bg-zinc-800 text-zinc-100 border border-zinc-700/80 rounded-bl-xs'
        )}
      >
        {!isSelf && (
          <div className="text-[11px] font-semibold text-zinc-400 mb-0.5">
            {senderProfile.name}
          </div>
        )}

        <div className="whitespace-pre-wrap leading-relaxed text-[13.5px]">
          {message.text}
        </div>

        <div
          className={cn(
            'flex items-center justify-end gap-1 mt-1 text-[10px] select-none',
            isSelf ? 'text-emerald-200/80' : 'text-zinc-400'
          )}
        >
          <span>{formatMessageTime(message.createdAt)}</span>
          {renderStatus()}
        </div>
      </div>
    </div>
  );
};
