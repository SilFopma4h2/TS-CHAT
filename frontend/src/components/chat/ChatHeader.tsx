'use client';

import React from 'react';
import { UserProfile } from '@/types/chat';

interface ChatHeaderProps {
  partner: UserProfile;
  isPartnerTyping: boolean;
  onBack?: () => void;
  isLoading: boolean;
  onToggleLoading: () => void;
  hasError: boolean;
  onToggleError: () => void;
  onResetMessages: () => void;
  onClearMessages: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  partner,
  isPartnerTyping,
  onBack,
  isLoading,
  onToggleLoading,
  hasError,
  onToggleError,
  onResetMessages,
  onClearMessages,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-md px-3.5 sm:px-4 py-2.5 sm:py-3 shadow-xs flex items-center justify-between gap-2 shrink-0">
      {/* Left: Back button (mobile) + Partner Avatar & Details */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="md:hidden p-1.5 -ml-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer shrink-0"
            title="Terug naar overzicht"
          >
            ←
          </button>
        )}

        <div className="relative shrink-0">
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm shadow-inner ${partner.accentColor}`}
          >
            {partner.avatarInitials}
          </div>
          <span
            className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border-2 border-zinc-900 ${
              partner.isOnline ? 'bg-emerald-500' : 'bg-zinc-600'
            }`}
            title={partner.isOnline ? 'Online' : 'Offline'}
          />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <h2 className="font-semibold text-sm text-zinc-100 truncate">
              {partner.name}
            </h2>
            <span className="hidden sm:inline text-[11px] text-zinc-400 font-normal truncate">
              • {partner.role}
            </span>
          </div>

          <div className="text-xs">
            {isPartnerTyping ? (
              <span className="text-emerald-400 font-medium animate-pulse">
                Aan het typen...
              </span>
            ) : partner.isOnline ? (
              <span className="text-emerald-400/90 font-medium">Online</span>
            ) : (
              <span className="text-zinc-500 font-medium">Offline (Laatst gezien zojuist)</span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions / Test toggles */}
      <div className="flex items-center gap-1 sm:gap-1.5 text-xs shrink-0">
        {/* State simulators voor UI inspectie */}
        <button
          type="button"
          onClick={onToggleLoading}
          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
            isLoading
              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border-zinc-700/60'
          }`}
          title="Simuleer laadstatus"
        >
          {isLoading ? 'Laden...' : '⏳ Simuleer Laadstatus'}
        </button>

        <button
          type="button"
          onClick={onToggleError}
          className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors cursor-pointer border ${
            hasError
              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
              : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border-zinc-700/60'
          }`}
          title="Simuleer foutstatus"
        >
          {hasError ? 'Fout actief' : '⚠️ Simuleer Fout'}
        </button>

        <button
          type="button"
          onClick={onResetMessages}
          title="Herstel voorbeeldberichten"
          className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          ↺
        </button>

        <button
          type="button"
          onClick={onClearMessages}
          title="Wis gesprekshistoriek"
          className="p-1.5 sm:px-2 sm:py-1 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-zinc-800 transition-colors cursor-pointer"
        >
          🗑
        </button>
      </div>
    </header>
  );
};
