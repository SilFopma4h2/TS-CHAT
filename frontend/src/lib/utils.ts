/**
 * Helper om dynamische Tailwind classes netjes samen te voegen
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

/**
 * Formatteert een ISO datum naar HH:mm tijdweergave (bijv. 14:05)
 */
export function formatMessageTime(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    return date.toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/**
 * Formatteert een ISO datum naar datumheader (bijv. Vandaag, Gisteren, of 14 sep)
 */
export function formatMessageDate(isoDateString: string): string {
  try {
    const date = new Date(isoDateString);
    const now = new Date();

    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return 'Vandaag';

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isYesterday) return 'Gisteren';

    return date.toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
    });
  } catch {
    return '';
  }
}

/**
 * Genereert een uniek client-side ID
 */
export function generateId(prefix: string = 'msg'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
