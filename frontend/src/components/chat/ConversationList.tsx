'use client';

import React, { useState } from 'react';
import { Conversation, UserProfile, UserType } from '@/types/chat';
import { ConversationItem } from './ConversationItem';
import { USERS } from '@/lib/constants';

interface ConversationListProps {
  conversations: Conversation[];
  selectedConversationId: string;
  onSelectConversation: (id: string) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  onSwitchUser: (user: UserType) => void;
  partnerIsOnline: boolean;
  onTogglePartnerOnline: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedConversationId,
  onSelectConversation,
  currentUser,
  onLogout,
  onSwitchUser,
  partnerIsOnline,
  onTogglePartnerOnline,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <aside className="w-full md:w-80 h-full flex flex-col bg-zinc-900 border-r border-zinc-800 shrink-0 select-none">
      {/* Top Header: Current User info & Logout */}
      <div className="p-3.5 border-b border-zinc-800 bg-zinc-900/95 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shadow-inner ${currentUser.accentColor}`}
            >
              {currentUser.avatarInitials}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-zinc-100">{currentUser.name}</span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/50">
                  Jij
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">{currentUser.role}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onLogout}
            title="Uitloggen"
            className="text-xs text-zinc-400 hover:text-rose-300 p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Uitloggen ➔
          </button>
        </div>

        {/* Quick switch between Sil & Twan for demo/testing */}
        <div className="flex items-center justify-between bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 text-xs">
          <span className="text-[10px] font-semibold text-zinc-500 uppercase px-1">
            Wissel:
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => onSwitchUser('sil')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                currentUser.id === 'sil'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Sil
            </button>
            <button
              type="button"
              onClick={() => onSwitchUser('twan')}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                currentUser.id === 'twan'
                  ? 'bg-zinc-800 text-white font-semibold'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Twan
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-3 border-b border-zinc-800/80">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Zoek gesprekken..."
          className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl px-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 outline-none transition-all"
        />
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        <div className="px-2 py-1 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">
          Directe Berichten
        </div>

        {filteredConversations.length === 0 ? (
          <div className="p-4 text-center text-xs text-zinc-500">
            Geen gesprekken gevonden
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const partner = {
              ...USERS[conv.partnerId],
              isOnline: partnerIsOnline,
            };

            return (
              <ConversationItem
                key={conv.id}
                conversation={conv}
                partner={partner}
                isSelected={conv.id === selectedConversationId}
                onSelect={onSelectConversation}
              />
            );
          })
        )}
      </div>

      {/* Footer Controls & System Status */}
      <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 text-[11px] text-zinc-400 space-y-2">
        <div className="flex items-center justify-between">
          <span>Status partner:</span>
          <button
            type="button"
            onClick={onTogglePartnerOnline}
            className="flex items-center gap-1.5 hover:text-zinc-200 cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                partnerIsOnline ? 'bg-emerald-400' : 'bg-zinc-600'
              }`}
            />
            <span>{partnerIsOnline ? 'Online' : 'Offline'}</span>
          </button>
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-zinc-800/50">
          <span>Host: Raspberry Pi 3</span>
          <span className="text-emerald-400">● 100% Privé</span>
        </div>
      </div>
    </aside>
  );
};
