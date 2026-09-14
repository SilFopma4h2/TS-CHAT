import React from 'react';
import { UserProfile } from '@/types/chat';

interface TypingIndicatorProps {
  partner: UserProfile;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ partner }) => {
  return (
    <div className="flex items-end gap-2 px-4 py-2 animate-fadeIn">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${partner.accentColor}`}
      >
        {partner.avatarInitials}
      </div>

      <div className="bg-zinc-800/90 border border-zinc-700/80 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.3s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce [animation-delay:-0.15s]" />
          <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 animate-bounce" />
          <span className="text-xs text-zinc-400 font-medium ml-1.5">
            {partner.name} is aan het typen...
          </span>
        </div>
      </div>
    </div>
  );
};
