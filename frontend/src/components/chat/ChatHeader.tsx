'use client';

import React from 'react';
import { ConnectionStatus as StatusType, UserProfile, UserType } from '@/types/chat';
import { UserSelector } from '@/components/auth/UserSelector';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

interface ChatHeaderProps {
  partner: UserProfile;
  currentUser: UserType;
  isPartnerTyping: boolean;
  connectionStatus: StatusType;
  onSelectUser: (user: UserType) => void;
  onResetMessages: () => void;
  onClearMessages: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  partner,
  currentUser,
  isPartnerTyping,
  connectionStatus,
  onSelectUser,
  onResetMessages,
  onClearMessages,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-900/95 backdrop-blur-md px-4 py-3 shadow-xs">
      {/* Top row: Branding, Connection status & User selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 mb-2.5 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-emerald-950/40">
            TS
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-white leading-none">
              TS-CHAT
            </h1>
            <span className="text-[10px] font-medium text-zinc-400">
              Sil & Twan • Raspberry Pi 3
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ConnectionStatus status={connectionStatus} />
          <UserSelector currentUser={currentUser} onSelectUser={onSelectUser} />
        </div>
      </div>

      {/* Bottom row: Active Chat Partner info & controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-inner ${partner.accentColor}`}
            >
              {partner.avatarInitials}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-zinc-900" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-zinc-100">{partner.name}</h2>
              <span className="text-[11px] text-zinc-400 font-normal">
                ({partner.role})
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {isPartnerTyping ? (
                <span className="text-emerald-400 font-medium animate-pulse">
                  Aan het typen...
                </span>
              ) : (
                <span className="text-emerald-400/90 font-medium">● Actief</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs">
          <button
            type="button"
            onClick={onResetMessages}
            title="Herstel voorbeeldberichten"
            className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            ↺ Herstel
          </button>
          <button
            type="button"
            onClick={onClearMessages}
            title="Wis gesprekshistoriek"
            className="px-2.5 py-1 rounded-lg text-zinc-400 hover:text-rose-300 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            🗑 Wis
          </button>
        </div>
      </div>
    </header>
  );
};
