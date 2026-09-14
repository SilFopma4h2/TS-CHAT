import React from 'react';
import { UserProfile } from '@/types/chat';

interface EmptyChatStateProps {
  partner: UserProfile;
}

export const EmptyChatState: React.FC<EmptyChatStateProps> = ({ partner }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center my-auto">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold shadow-lg mb-3 ${partner.accentColor}`}
      >
        {partner.avatarInitials}
      </div>
      <h3 className="text-sm font-semibold text-zinc-200">
        Start een gesprek met {partner.name}
      </h3>
      <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
        Er zijn nog geen berichten in dit privégesprek. Typ hieronder om het gesprek te openen.
      </p>
      <div className="mt-4 flex items-center gap-2 text-[11px] text-zinc-500 bg-zinc-900/80 px-3 py-1.5 rounded-lg border border-zinc-800">
        <span>🔒 Privé P2P verbinding</span>
        <span>•</span>
        <span>⚡ Raspberry Pi 3 Host</span>
      </div>
    </div>
  );
};
