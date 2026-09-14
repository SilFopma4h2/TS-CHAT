import React from 'react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Kan berichten niet laden of er is geen verbinding met de server.',
  onRetry,
  className,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center my-auto',
        className
      )}
    >
      <div className="w-12 h-12 rounded-2xl bg-rose-950/50 border border-rose-900/60 flex items-center justify-center text-rose-400 text-xl mb-3 shadow-inner">
        ⚠️
      </div>
      <h3 className="text-sm font-semibold text-zinc-200">Fout bij laden</h3>
      <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <Button
          type="button"
          onClick={onRetry}
          variant="secondary"
          size="sm"
          className="mt-4 text-xs font-medium"
        >
          <span>↻ Probeer opnieuw</span>
        </Button>
      )}
    </div>
  );
};
