import React from 'react';
import { cn } from '@/lib/utils';

export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('space-y-4 p-4 animate-pulse', className)}>
      <div className="flex justify-center">
        <div className="h-5 w-24 bg-zinc-800 rounded-full" />
      </div>

      {/* Received message skeleton */}
      <div className="flex items-end gap-2.5">
        <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
        <div className="space-y-2 max-w-[70%]">
          <div className="h-4 w-20 bg-zinc-800 rounded" />
          <div className="h-14 w-64 bg-zinc-800/80 rounded-2xl rounded-bl-sm" />
        </div>
      </div>

      {/* Sent message skeleton */}
      <div className="flex justify-end">
        <div className="space-y-1.5 max-w-[70%] items-end flex flex-col">
          <div className="h-10 w-52 bg-emerald-950/40 rounded-2xl rounded-br-sm" />
          <div className="h-3 w-12 bg-zinc-800/80 rounded" />
        </div>
      </div>

      {/* Received message skeleton */}
      <div className="flex items-end gap-2.5">
        <div className="w-8 h-8 rounded-full bg-zinc-800 shrink-0" />
        <div className="space-y-2 max-w-[70%]">
          <div className="h-4 w-16 bg-zinc-800 rounded" />
          <div className="h-12 w-48 bg-zinc-800/80 rounded-2xl rounded-bl-sm" />
        </div>
      </div>
    </div>
  );
};
