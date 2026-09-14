import { WebSocketMessage } from '@/types/events';

type MessageHandler = (event: WebSocketMessage) => void;

/**
 * WebSocket service skeleton voor realtime communicatie
 * Wordt volledig aangesloten zodra Twan's realtime server live is.
 */
class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = '';
  private handlers: Set<MessageHandler> = new Set();
  private isConnected: boolean = false;

  init(url: string) {
    this.url = url;
  }

  connect() {
    if (typeof window === 'undefined' || !this.url) return;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        this.isConnected = true;
      };

      this.ws.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data) as WebSocketMessage;
          this.handlers.forEach((handler) => handler(parsed));
        } catch {
          // Ongeldige payload negeren
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
      };

      this.ws.onerror = () => {
        this.isConnected = false;
      };
    } catch {
      this.isConnected = false;
    }
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  send(message: WebSocketMessage) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  subscribe(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => {
      this.handlers.delete(handler);
    };
  }

  getStatus(): boolean {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();
