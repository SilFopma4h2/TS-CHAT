'use client';

import React from 'react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <main className="min-h-dvh w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-0 sm:p-4 md:p-6 selection:bg-emerald-500/30">
      {/* Shell Container */}
      <div className="w-full max-w-3xl h-dvh sm:h-[92vh] sm:max-h-[850px] flex flex-col bg-zinc-900 border-0 sm:border border-zinc-800 sm:rounded-2xl shadow-2xl overflow-hidden">
        {children}
      </div>
    </main>
  );
};
