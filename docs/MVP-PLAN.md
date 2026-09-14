# TS-CHAT — MVP Plan & Architectuur

Dit document beschrijft de huidige status van de repository, de voorgestelde frontend-architectuur, API/WebSocket-aannames, het deploymentplan voor de Raspberry Pi 3 en de stappen voor de verdere ontwikkeling.

---

## 1. Team & Domeinverdeling

Conform `AGENTS.MD` is het project strikt verdeeld tussen twee ontwikkelaars:

| Ontwikkelaar | Domein | Verantwoordelijkheden |
| :--- | :--- | :--- |
| **Sil** | Frontend & Infra | `frontend/`, `infra/`, deploymentconfiguratie, Raspberry Pi 3 productie |
| **Twan** | Backend & Data | `backend/`, `database/`, realtime server |
| **Gedeeld** | Documentatie & Contracten | `docs/`, `README.md`, `docs/API.md` |

---

## 2. Huidige Situatie (Repository Inspectie)

Bij inspectie van de repository op branch `feature/sil-frontend` is het volgende vastgesteld:

- **Bestaande bestanden:**
  - `.gitignore`: Standaard Python/Django/Flask gitignore sjabloon.
  - `AGENTS.MD`: Afspraken en domeinscheiding tussen Sil en Twan.
  - `webServerApiSettings.json`: Niet-getracked configuratiebestand.
- **Stack & Code:**
  - Er is momenteel nog **geen** actieve codebase (geen `frontend/`, geen `backend/`).
  - Er zijn nog **geen** package managers (npm, pnpm, yarn, pip, cargo, etc.) geconfigureerd.
  - Er zijn nog **geen** Dockerfiles of `docker-compose.yml` configuraties aanwezig.
- **Git status:**
  - `main`: Schoon, bevat de initiële commits en `AGENTS.MD`.
  - `feature/sil-frontend`: Actieve werkbranch voor frontend- en infrastructuurontwerp.

---

## 3. Voorgestelde Frontendstructuur

Gezien het doel (een lichte, snelle, privé realtime chatapplicatie voor twee gebruikers die soepel moet draaien en gehost wordt op een Raspberry Pi 3), wordt een moderne TypeScript-gebaseerde frontend met minimale overhead voorgesteld.

### Aanbevolen Technologie (Huidig)
- **Framework:** Next.js (App Router) met React en TypeScript. Vanwege server-side rendering opties en integratie met Vercel/Node deployments.
- **Styling:** Tailwind CSS (v4) voor moderne, responsieve en schone chat design.
- **Icons:** Lucide-react of lichte SVG icons.

### Directory Indeling (`frontend/`)
```text
frontend/
├── public/
│   ├── favicon.ico
│   └── manifest.json         # PWA ondersteuning voor mobiel
├── src/
│   ├── assets/               # Afbeeldingen, audio-notificaties
│   ├── components/
│   │   ├── auth/             # Gebruikersselectie (Sil / Twan)
│   │   ├── chat/
│   │   │   ├── ChatHeader.tsx       # Status partner (online/offline/typing)
│   │   │   ├── MessageList.tsx      # Scrollbare berichtenlijst + autoscroll
│   │   │   ├── MessageItem.tsx      # Individuele bubble (verzonden/ontvangen)
│   │   │   ├── MessageInput.tsx     # Tekstvak, verzendknop, typing detector
│   │   │   └── ConnectionBadge.tsx  # Verbindingsstatus indicator
│   │   └── ui/               # Knoppen, inputs, modals
│   ├── hooks/
│   │   ├── useChat.ts        # Chat state & history management
│   │   ├── useWebSocket.ts   # WebSocket lifecycle, reconnect & heartbeat
│   │   └── useAuth.ts        # Huidige actieve gebruiker (Sil / Twan)
│   ├── services/
│   │   ├── api.ts            # REST fallback (historiek ophalen)
│   │   └── websocket.ts      # WebSocket verbinding & event dispatcher
│   ├── types/
│   │   ├── chat.ts           # Message, ChatState, User types
│   │   └── events.ts         # WebSocket payload types (inbound/outbound)
│   ├── utils/
│   │   ├── date.ts           # Tijd- en datumformattering
│   │   └── storage.ts        # Lokale opslag helpers
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 4. Benodigde Frontendonderdelen & Features

1. **Gebruikersselectie / Eenvoudige Authenticatie:**
   - Keuze/wissel tussen Sil en Twan met sessiebehoud (`localStorage` / auth-token).
2. **Realtime Chat Interface:**
   - Gespreksweergave met visuele scheiding tussen eigen berichten en berichten van de partner.
   - Statusindicatoren per bericht: *Verzenden*, *Verzonden*, *Bezorgd*, *Gelezen*.
   - Automatisch omlaag scrollen bij nieuwe berichten, met behoud van scrollpositie bij terugscrollen in de historiek.
3. **Live Statussen:**
   - Realtime "typing..." indicatie met debounce timer.
   - Verbindingsstatus (Verbonden, Verbinden..., Offline).
   - "Laatst gezien" of "Online" status van de partner.
4. **Resilience & Offline Handling:**
   - Automatische WebSocket reconnect met exponential backoff.
   - Queueing van uitgaande berichten bij kortstondig verbindingsverlies met `tempId`.
5. **Mobiele Bruikbaarheid:**
   - Responsive design (100dvh voor mobiele browsers).
   - Notificatiegeluid / web notifications bij nieuwe inkomende berichten wanneer tabblad inactief is.

---

## 5. API & WebSocket Aannames (Afstemming met Twan)

Het definitieve contract wordt gezamenlijk vastgelegd in `docs/API.md`. Hieronder staan de uitgangspunten voor de frontend.

### A. REST Endpoints (HTTP) — Conform `docs/API.md`
- `GET /health` — Status van backend en database (Deel 1, geïmplementeerd door Twan).
- `POST /api/auth/login` — Inloggen (Contract Deel 2).
- `POST /api/auth/register` — Nieuwe gebruiker registreren (Contract Deel 2).
- `GET /api/auth/me` — Ingelogde gebruiker (Contract Deel 2).
- `GET /api/chats` — Overzicht actieve gesprekken (Contract Deel 2).
- `POST /api/chats` — Direct gesprek starten of ophalen met partner (Contract Deel 2).
- `GET /api/chats/:id` — Details specifiek gesprek (Contract Deel 2).
- `GET /api/chats/:chatId/messages?limit=50&before=<timestamp>` — Historische berichten (Contract Deel 2).
- `POST /api/chats/:chatId/messages` — REST fallback voor verzenden (Contract Deel 2).

### B. WebSocket Protocol (`/ws` of `/socket.io`)
Alle realtime communicatie verloopt via JSON-berichten over WebSocket:

#### Client -> Server (Verzonden door frontend)
```json
// Authenticatie bij verbinding tot stand brengen
{ "type": "AUTH", "payload": { "user": "Sil", "token": "..." } }

// Bericht verzenden
{ "type": "SEND_MESSAGE", "payload": { "tempId": "uuid-123", "text": "Hallo Twan!" } }

// Typ-indicator
{ "type": "TYPING", "payload": { "isTyping": true } }

// Ontvangstbevestiging / Gelezen
{ "type": "READ_ACK", "payload": { "messageId": "msg-456" } }
```

#### Server -> Client (Ontvangen door frontend)
```json
// Verificatie gelukt
{ "type": "AUTH_SUCCESS", "payload": { "user": "Sil" } }

// Nieuw inkomend bericht
{ "type": "NEW_MESSAGE", "payload": { "id": "msg-789", "sender": "Twan", "text": "Hoi Sil!", "createdAt": "2026-09-14T17:00:00Z" } }

// Status partner bijgewerkt
{ "type": "USER_STATUS", "payload": { "user": "Twan", "online": true, "lastSeen": "2026-09-14T17:00:00Z" } }

// Partner is aan het typen
{ "type": "TYPING_STATUS", "payload": { "user": "Twan", "isTyping": true } }

// Bevestiging verzonden bericht (tempId koppelen aan definitief id)
{ "type": "MESSAGE_ACK", "payload": { "tempId": "uuid-123", "id": "msg-789", "createdAt": "..." } }

// Foutmelding vanuit server
{ "type": "ERROR", "payload": { "message": "Ongeldige payload of serverfout" } }
```

---

## 6. Docker & Deploymentplan (Raspberry Pi 3)

### Hardwarebeperkingen & Eisen
- **Platform:** Raspberry Pi 3 (Quad-core ARM Cortex-A53, 1GB RAM).
- **Uitgangspunt:** Minimale memory footprint en geen zware build-stappen direct op de Pi tijdens runtime.

### Architectuur op de Pi
```text
                  Internet / Lokaal Netwerk
                             │
                             ▼
                    ┌──────────────────┐
                    │   Nginx Proxy    │ (Poort 80/443)
                    └────────┬─────────┘
                             │
            ┌────────────────┴────────────────┐
            ▼                                 ▼
   ┌───────────────────┐             ┌──────────────────┐
   │ Frontend (Static) │             │ Backend (Node/TS)│
   │ Nginx Alpine      │             │ Realtime API/WS  │
   │ (< 15MB RAM)      │             │ (< 100MB RAM)    │
   └───────────────────┘             └────────┬─────────┘
                                              │
                                              ▼
                                     ┌──────────────────┐
                                     │ PostgreSQL       │
                                     │ (data volume)    │
                                     └──────────────────┘
```

### Containerisatie van de Frontend
- **Multi-stage Dockerfile (`frontend/Dockerfile`):**
  1. *Build Stage:* Node.js image om TypeScript/Vite te compileren naar statische HTML/JS/CSS assets.
  2. *Production Stage:* Ultralichte `nginx:alpine` image die alleen de statische bestanden serveert.
- **Infrastructuur (`infra/docker-compose.yml`):**
  - Bevat services voor frontend, backend en eventuele proxy/tunnel.
  - Gebruikt named volumes voor persistente data.

---

## 7. Voorgestelde Implementatievolgorde

1. **MVP 1 (Huidig):**
   - Repository inspectie, afbakenen verantwoordelijkheden en opstellen van het architectuurplan (`docs/MVP-PLAN.md`).
2. **MVP 2 (Frontend Scaffold & UI Prototype) — Voltooid:**
   - `frontend/` structuur met Next.js 16.3.5 + React 19 + TypeScript op `feature/sil-frontend`.
   - Componenten gebouwd: ChatHeader, MessageList, MessageItem, MessageInput, UserSelect, AuthScreen.
   - Mock data (`useChat` hook, `mockChatService`) en lokale state getest in de browser.
3. **MVP 3 (API Contract & WebSocket Service):**
   - Opstellen van `docs/API.md` in overleg met Twan.
   - Implementatie van `frontend/src/services/websocket.ts` en `useWebSocket` hook met mock/echo functionaliteit.
4. **MVP 4 (Integratie met Backend & Database):**
   - Koppeling van de frontend met Twan's backend.
   - End-to-end testen van realtime messaging, historiek en statussen.
5. **MVP 5 (Docker & Build Packaging):**
   - Creëren van `frontend/Dockerfile` (multi-stage) en Nginx configuratie.
   - Lokale docker-compose test.
6. **MVP 6 (Raspberry Pi 3 Deployment):**
   - Opzetten van `infra/` configuratie, reverse proxy en auto-restart policies voor de Raspberry Pi 3.
   - Eindverificatie in productie.

---

## 8. Mogelijke Risico's & Maatregelen

| Risico | Impact | Mitigatie |
| :--- | :--- | :--- |
| **Beperkt geheugen Raspberry Pi 3 (1GB RAM)** | OOM-crashes bij zware builds | Frontend vooraf compileren (multi-stage) of lokaal/CI builden; lichte Nginx Alpine runtime gebruiken. |
| **Instabiele mobiele netwerkverbindingen** | Gemiste berichten / verbroken WebSockets | Berichten identificeren met unieke client `tempId`'s; automatische reconnect met exponential backoff en resync van gemiste berichten via REST. |
| **Afwijking tussen frontend & backend verwachtingen** | Integratiefouten | Strikt vasthouden aan `docs/API.md` contracten voordat integratiecode wordt geschreven. |
| **Conflicten in gedeelde bestanden** | Merge conflicts | Duidelijke scheiding (`frontend/` vs `backend/`); overleg bij aanpassingen aan `docs/` en `README.md`. |
