'use client';

import React from 'react';

interface ChatLayoutProps {
  children: React.ReactNode;
}

export const ChatLayout: React.FC<ChatLayoutProps> = ({ children }) => {
  return (
    <main className="min-h-dvh w-full bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-0 sm:p-3 md:p-6 selection:bg-emerald-500/30">
      {/* Shell Container: Full height on mobile (100dvh), framed card on desktop */}
      <div className="w-full max-w-5xl h-dvh sm:h-[92vh] sm:max-h-[900px] flex bg-zinc-900 border-0 sm:border border-zinc-800 sm:rounded-2xl shadow-2xl overflow-hidden">
        {children}
      </div>
    </main>
  );
};
