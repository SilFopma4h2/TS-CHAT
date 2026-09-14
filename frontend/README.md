# TS-CHAT Frontend

Next.js + TypeScript + Tailwind CSS frontend voor TS-CHAT (Sil & Twan realtime chatapplicatie).

## Scripts

Vanaf de repository root of binnen de `frontend/` map:

- **Ontwikkeling (Dev server):**
  ```bash
  cd frontend
  npm run dev
  ```
  De app is bereikbaar op [http://localhost:3000](http://localhost:3000).

- **Productie build:**
  ```bash
  npm run build
  ```

- **Typecheck:**
  ```bash
  npm run typecheck
  ```

- **Linting:**
  ```bash
  npm run lint
  ```

## Mappenstructuur

- `src/app/`: Next.js App Router (Layout, Page, Global CSS)
- `src/components/`:
  - `auth/`: UserSelector (switch tussen Sil en Twan)
  - `chat/`: ChatHeader, MessageList, MessageItem, MessageInput, TypingIndicator
  - `layout/`: ChatLayout (responsive 100dvh mobile & desktop container)
  - `ui/`: Badge, Button, ConnectionStatus
- `src/hooks/`: `useChat` voor chat state en mock interacties
- `src/services/`: REST API skeleton, WebSocket skeleton, MockChatService
- `src/types/`: TypeScript interfaces voor chatberichten, gebruikers en WS events
- `src/lib/`: Constanten (gebruikersprofielen, voorbeeldberichten) en utility functies
