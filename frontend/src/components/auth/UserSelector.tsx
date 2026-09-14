import React from 'react';
import { UserType } from '@/types/chat';
import { USERS } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface UserSelectorProps {
  currentUser: UserType;
  onSelectUser: (user: UserType) => void;
  className?: string;
}

export const UserSelector: React.FC<UserSelectorProps> = ({
  currentUser,
  onSelectUser,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl shadow-inner',
        className
      )}
    >
      <span className="text-[11px] font-semibold text-zinc-500 uppercase px-2 tracking-wider">
        Ingelogd als:
      </span>

      {(['sil', 'twan'] as const).map((userId) => {
        const profile = USERS[userId];
        const isSelected = currentUser === userId;

        return (
          <button
            key={userId}
            type="button"
            onClick={() => onSelectUser(userId)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 cursor-pointer',
              isSelected
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700 font-semibold'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            )}
          >
            <span
              className={cn(
                'w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold',
                profile.accentColor
              )}
            >
              {profile.avatarInitials}
            </span>
            <span>{profile.name}</span>
          </button>
        );
      })}
    </div>
  );
};
