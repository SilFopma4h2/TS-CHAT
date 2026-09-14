'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/Button';

interface MessageComposerProps {
  onSendMessage: (text: string) => void;
  onTriggerPartnerReply?: () => void;
  autoReplyEnabled?: boolean;
  onToggleAutoReply?: () => void;
  partnerName: string;
  disabled?: boolean;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  onSendMessage,
  onTriggerPartnerReply,
  autoReplyEnabled,
  onToggleAutoReply,
  partnerName,
  disabled = false,
}) => {
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;

    onSendMessage(text);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-900/95 p-3 sm:p-4 backdrop-blur-md shrink-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder={
              disabled
                ? 'Berichteninvoer tijdelijk uitgeschakeld...'
                : `Typ een bericht naar ${partnerName}...`
            }
            className="w-full bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 rounded-xl px-4 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all shadow-inner"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          disabled={!text.trim() || disabled}
          className="shrink-0 font-medium"
        >
          <span>Verstuur</span>
          <span className="text-xs">➤</span>
        </Button>
      </form>

      {/* Simulator helper toolbar voor MVP preview */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-800/60 text-[11px] text-zinc-400">
        <div className="flex items-center gap-2">
          {onToggleAutoReply && (
            <button
              type="button"
              onClick={onToggleAutoReply}
              className="hover:text-zinc-200 transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  autoReplyEnabled ? 'bg-emerald-400' : 'bg-zinc-600'
                }`}
              />
              <span>Auto-reply simulator: {autoReplyEnabled ? 'Aan' : 'Uit'}</span>
            </button>
          )}
        </div>

        {onTriggerPartnerReply && (
          <button
            type="button"
            onClick={onTriggerPartnerReply}
            className="hover:text-emerald-400 transition-colors cursor-pointer font-medium"
          >
            ⚡ Simuleer reactie van {partnerName}
          </button>
        )}
      </div>
    </div>
  );
};
