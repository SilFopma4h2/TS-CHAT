import React from 'react';
import { Conversation, UserProfile } from '@/types/chat';
import { cn, formatMessageTime } from '@/lib/utils';

interface ConversationItemProps {
  conversation: Conversation;
  partner: UserProfile;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  partner,
  isSelected,
  onSelect,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      className={cn(
        'w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left cursor-pointer border',
        isSelected
          ? 'bg-zinc-800/90 border-zinc-700 shadow-sm'
          : 'bg-zinc-900/40 border-transparent hover:bg-zinc-800/50 hover:border-zinc-800'
      )}
    >
      {/* Avatar with Online/Offline Presence Indicator */}
      <div className="relative shrink-0">
        <div
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shadow-inner',
            partner.accentColor
          )}
        >
          {partner.avatarInitials}
        </div>
        <span
          className={cn(
            'absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-zinc-900',
            partner.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
          )}
          title={partner.isOnline ? 'Online' : 'Offline'}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1 mb-0.5">
          <h3 className="font-semibold text-sm text-zinc-100 truncate">
            {partner.name}
          </h3>
          <span className="text-[11px] text-zinc-400 shrink-0">
            {formatMessageTime(conversation.updatedAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-zinc-400 truncate">
            {conversation.lastMessage ? conversation.lastMessage.text : conversation.subtitle}
          </p>

          {conversation.unreadCount > 0 && (
            <span className="shrink-0 bg-emerald-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-xs">
              {conversation.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
};
