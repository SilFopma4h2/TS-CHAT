import React from 'react';
import { ConnectionStatus as StatusType } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  status: StatusType;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  status,
  className,
}) => {
  const configs = {
    connected: {
      dot: 'bg-emerald-400 animate-pulse',
      text: 'Verbonden (Live)',
      bg: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    },
    connecting: {
      dot: 'bg-amber-400 animate-ping',
      text: 'Verbinden...',
      bg: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
    },
    disconnected: {
      dot: 'bg-rose-500',
      text: 'Offline',
      bg: 'bg-rose-950/40 text-rose-300 border-rose-800/40',
    },
    mock: {
      dot: 'bg-indigo-400',
      text: 'Mock Modus (Lokaal)',
      bg: 'bg-indigo-950/40 text-indigo-300 border-indigo-800/40',
    },
  };

  const config = configs[status];

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border shadow-xs',
        config.bg,
        className
      )}
    >
      <span className={cn('w-2 h-2 rounded-full', config.dot)} />
      <span>{config.text}</span>
    </div>
  );
};
