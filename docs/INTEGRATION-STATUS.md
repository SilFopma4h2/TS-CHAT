# Integration Status — TS-CHAT MVP Inspectie

> Status: inspectie van `feature/twan-backend` (2d70da9) vs `feature/sil-frontend` (3ce2065) vs `docs/API.md`. Geen backendcode aangepast.

---

## Current architecture

```
Sil device (frontend)          Twan device (backend dev)
     │                              │
     │  internet                    │
     ▼                              ▼
  frontend/                     backend/
  (Next.js, src/...)            (Express + ws, src/...)
  port: 3000 (next dev)         port: 3000 (config)
  /ws: ws://localhost:3000/ws   /ws: /ws (WebSocketServer)
```

- Frontend branch: `feature/sil-frontend` (+1 lokale commit voor chat state)
- Backend branch: `origin/feature/twan-backend` (2d70da9 — "initialize backend")
- Contract: `docs/API.md` (320 regels, aligned met frontend `lib/api/` en backend via c545010)
- Shared: `docs/MVP-PLAN.md`

---

## Twan backend status (branch `feature/twan-backend`)

| Onderdeel | Status | Opmerking |
|---|---|---|
| Server entry (`src/server.ts`) | ✅ | HTTP + ws op zelfde server; `SIGINT`/`SIGTERM` handling |
| Express app (`src/app.ts`) | ✅ | JSON parser, router, 404 + error handler laatste |
| Config (`src/config/index.ts`) | ✅ | `NODE_ENV`, `PORT` (default 3000), `.env` laden |
| Health (`routes/health.routes.ts`) | ✅ | `GET /health` → `{status:"ok"}` |
| Routes index (`routes/index.ts`) | 🟡 | Alleen `healthRouter`; rest gemarkeerd "Deel 2" |
| Auth controllers/routes | ❌ | Niet aanwezig (contract heeft `/api/auth/login`, `/register`, `/me`) |
| Chats controllers/routes | ❌ | Niet aanwezig (contract `GET/POST /api/chats`, `GET /api/chats/:id`) |
| Messages controllers/routes | ❌ | Niet aanwezig (contract `GET/POST /api/chats/:chatId/messages`) |
| WebSocket server (`websocket/index.ts`) | 🟡 | Transport wired (`/ws`, `ws` lib); geen auth, geen events |
| Database (`db/`) | ❌ | Lege directory; README: "will hold PostgreSQL" |
| Database models | ❌ | Niet aanwezig |
| Tests (`tests/health.test.ts`) | ✅ | Alleen `/health`; `node:test` + assert |
| `package.json` scripts | ✅ | dev/build/start/test/typecheck |
| Dependencies | ✅ | express, ws, dotenv + dev types |

---

## Available REST endpoints (daadwerkelijk geïmplementeerd)

```text
GET /health                 ✅ 200 {status:"ok"}
GET /api/auth/login         ❌ contract alleen; geen route
POST /api/auth/register     ❌ contract alleen; geen route
GET /api/auth/me            ❌ contract alleen; geen route
GET /api/chats              ❌ contract alleen; geen route
POST /api/chats             ❌ contract alleen; geen route
GET /api/chats/:id          ❌ contract alleen; geen route
GET /api/chats/:chatId/messages ❌ contract alleen
POST /api/chats/:chatId/messages ❌ contract alleen
```

**Conclusion:** alleen `/health` werkt. Alle andere REST endpoints uit `docs/API.md` moeten nog door Twan worden gebouwd.

---

## Available WebSocket events (daadwerkelijk geïmplementeerd)

Backend (`websocket/index.ts`):
- Path: `/ws` (default in `WebSocketServer`)
- Transport: `ws` lib op `httpServer`
- Events geïmplementeerd: **geen** (alleen `connection` hook met `error` log; geen `AUTH`, `SEND_MESSAGE`, `TYPING`, `READ_ACK`)

Contract (`docs/API.md` §5) expecteert:
- Client → Server: `AUTH`, `SEND_MESSAGE`, `TYPING`, `READ_ACK`
- Server → Client: `AUTH_SUCCESS`, `NEW_MESSAGE`, `USER_STATUS`, `TYPING_STATUS`, `MESSAGE_ACK`, `ERROR`

**Status:** alleen transport. Geen event-handling, geen auth handshake, geen chat berichten, geen presence.

---

## Authentication

- Contract: JWT/session token via `POST /api/auth/login`; `Authorization: Bearer <token>`; `GET /api/auth/me`
- Backend: **geen auth middleware, geen login route, geen token genereren, geen user store**
- Frontend (`lib/api/auth.ts`, `useChat.ts`): implementeert `login`/`register`/`getMe`, slaat token op in `localStorage` (`ts_chat_token`), gebruikt `Authorization` header — maar backend biedt geen endpoint.
- Frontend `authApi.login()` roept `POST /api/auth/login` aan; zal `404` of `500` krijgen zodra backend live is zonder die route.

---

## Database / backend status

- PostgreSQL: niet ingesteld; geen `db/` bestanden; geen schema; geen migraties
- Users/chats/messages: geen modellen; geen connectiepool
- Backend is **stateless** (behalve WebSocket verbindingen in geheugen)

---

## Frontend ↔ backend mapping

```text
Frontend onderdeel              ↓ Backend endpoint/event        ↓ Status
---------------------------------------------------------------------------------
Login UI (AuthScreen)           ↓ POST /api/auth/login         ↓ ❌ backend ontbreekt
Register UI                     ↓ POST /api/auth/register     ↓ ❌ backend ontbreekt
Auth state / token              ↓ GET /api/auth/me            ↓ ❌ backend ontbreekt
Chatlijst (ConversationList)    ↓ GET /api/chats              ↓ ❌ backend ontbreekt
Actieve chat (ChatLayout)       ↓ GET /api/chats/:id          ↓ ❌ backend ontbreekt
Berichten (MessageList)         ↓ GET /api/chats/:chatId/messages ↓ ❌ backend ontbreekt
Message Composer (MessageComposer) ↓ POST /api/chats/:chatId/messages ↓ ❌ backend ontbreekt
WebSocket client (websocket.ts) ↓ /ws + events               ↓ 🟡 transport alleen
Connection status (ConnectionStatus) ↓ /ws open/close        ↓ 🟡 geen events
Online status (partner)         ↓ USER_STATUS event          ↓ ❌ geen event
Typing indicator                ↓ TYPING / TYPING_STATUS      ↓ ❌ geen event
Mock service (mockChatService)  ↓ — (lokale mock)             ↓ ✅ werkt zonder backend
```

**Frontend is klaar voor koppeling** (API client, types, hooks, UI, WebSocket service skeleton), maar **geen enkel endpoint terugkoppelt** omdat backend ze niet heeft.

---

## Missing backend functionality (wat Twan nog moet bouwen)

### REST (in volgorde afhankelijkheid)
- [ ] Auth controller + routes (`/api/auth/login`, `/register`, `/me`)
- [ ] User model / database table (minimaal `id`, `username`, `name`, `role`, `password`/hash)
- [ ] Auth middleware (`Authorization: Bearer <token>` → valideer JWT/session)
- [ ] Chat controller + routes (`GET/POST /api/chats`, `GET /api/chats/:id`)
- [ ] Message controller + routes (`GET/POST /api/chats/:chatId/messages`)
- [ ] Chat model + message model in PostgreSQL
- [ ] Error responses consistent met `docs/API.md` §6 (`{error: string}` + status codes)

### WebSocket
- [ ] Auth handshake (`AUTH` → `AUTH_SUCCESS` / `ERROR`)
- [ ] `SEND_MESSAGE` → store + `MESSAGE_ACK` + `NEW_MESSAGE` broadcast
- [ ] `TYPING` → `TYPING_STATUS` broadcast
- [ ] `READ_ACK` → markeer gelezen + update `unreadCount`
- [ ] `USER_STATUS` / presence (online/offline, `lastSeen`)
- [ ] Reconnect / disconnect afhandeling (huidig: alleen `onclose` zet `isConnected = false`; geen reconnect)
- [ ] Validation van payload (huidig: geen check op `type`/`payload`)

### Database / infrastructuur
- [ ] PostgreSQL setup (schema + verbinding)
- [ ] Environment variabelen voor DB (huidig `.env.example` heeft alleen `PORT`/`NODE_ENV`)
- [ ] Eventueel seed data voor Sil/Twan

---

## External access requirements (Pi3 + ngrok / Cloudflare Tunnel)

### Huidige backend settings (relevant voor externe toegang)
- **Host/bind:** `httpServer.listen(config.port)` — luistert op `0.0.0.0` (Node default als geen host opgegeven); geschikt voor tunnel
- **Port:** `3000` (`PORT` env); eenvoudig te forwarden
- **CORS:** **ontbreekt** — geen `cors` package in `package.json`; geen `app.use(cors(...))` in `app.ts`; nodig voor frontend op andere origin (bijv. Pi3 IP of tunnel URL)
- **WebSocket origin:** `ws` lib accepteert alle origins (geen `origin` check in huidige `WebSocketServer`); voor productie: check `request.headers.origin`
- **WebSocket/WSS:** `ws://localhost:3000/ws`; voor WSS achter tunnel: `wss://<tunnel>/ws`; `ws` lib ondersteunt WSS als HTTPS server dus `wss` automatisch — maar backend moet dan op HTTPS draaien (of tunnel doet TLS termination)
- **HTTP/HTTPS:** huidig HTTP; voor externe toegang via tunnel is HTTP→HTTPS terminatie bij tunnel voldoende; backend hoeft zelf geen cert te hebben
- **Environment:** `NODE_ENV=development`; `isProduction` gebruikt bij `config`
- **Reverse proxy:** geen `X-Forwarded-For` / trust proxy ingesteld; `app.disable('x-powered-by')` wel; indien tunnel proxy is, moet `express` weten dat het achter proxy zit (`app.set('trust proxy', ...)`) — nog niet nodig voor MVP

### Later voor Pi3 + externe toegang
- [ ] `CORS` middleware toevoegen (minimaal `origin` op `*` of specifieke frontend origine; `credentials: true` bij auth)
- [ ] `WebSocketServer` origin-check (optioneel voor MVP; voor productie: verplicht)
- [ ] HTTPS op Pi3 of gebruik Cloudflare Tunnel (WSS terminatie bij tunnel)
- [ ] `ngrok` / `cloudflared` straat op Poort 3000; backend zelf geen wijziging nodig behalve CORS + evt. `HOST=0.0.0.0` expliciet
- [ ] `POST /api/auth/login` etc. moeten bereikbaar zijn via tunnel-URL
- [ ] WebSocket `/ws` moet via `wss://` bereikbaar zijn (tunnel doet TLS)

**Belangrijk:** de backend is **geschikt** voor tunnel (stateless HTTP + ws op zelfde server; geen hardcoded `localhost` bindings). Alleen `CORS` ontbreekt — dat is de grootste drempel voor frontend op andere machine.

---

## Sil frontend next steps (zonder backendcode te wijzigen)

Sil kan nu **veilig bouwen** omdat backend nog niet verandert — maar de koppeling blijft mock tot Twan klaar is:

1. **Verfijn `useChat.ts`** — vervang `mockChatService` door echte `apiClient`/`messagesApi`/`chatsApi` aanroepen, maar met fallback naar mock als `connectionStatus === 'mock'`.
2. **WebSocket integratie** — init `webSocketService.init('ws://localhost:3000/ws')`; connect bij auth; stuur `AUTH` met token; handel `AUTH_SUCCESS`, `NEW_MESSAGE`, `USER_STATUS`, `TYPING_STATUS`, `MESSAGE_ACK`, `ERROR`.
3. **Auth flow vervolledigen** — `authApi.login()` werkt al; voeg `getMe()` toe bij opstart; sync `currentUser` met `user` state; logout wisst token + sluit ws.
4. **Chat UI polijsten** — `ChatLayout`, `ConversationList`, `MessageList`, `MessageComposer` zijn al aanwezig; vervang mock data door `apiClient` calls zodra endpoints live.
5. **Verbeter error handling** — `ApiClientError` + `ErrorState` + `ConnectionStatus` bestaan; uitbreiden voor `404`/`401` bij backend.
6. **Environment** — `NEXT_PUBLIC_API_URL` en `NEXT_PUBLIC_WS_URL` al correct ingesteld; hoeft niet te veranderen voor MVP.
7. **Wachten op Twan** — geen echte chat mogelijk zonder `/api/chats` + `/ws` events + DB.

**Sil hoeft geen backendfile te editen.** Alleen `frontend/src/` (hooks, services, components) als Twan levert.

---

## Twan remaining tasks (in volgorde)

1. **Auth** — `POST /api/auth/login`, `register`, `me`; JWT; user model; `Authorization` middleware
2. **Chat REST** — `GET/POST /api/chats`, `GET /api/chats/:id`; chat model; participants
3. **Message REST** — `GET/POST /api/chats/:chatId/messages`; message model; `lastMessage`/`updatedAt`
4. **WebSocket events** — `AUTH`, `SEND_MESSAGE`, `TYPING`, `READ_ACK`; server → client events; reconnect
5. **DB** — PostgreSQL; schema; migraties; seed
6. **CORS** — `cors` package + `app.use()` voor frontend op andere origin
7. **Tests** — breid `tests/` uit met auth, chats, messages, ws
8. **Docs alignment** — als contract wijzigt, update `docs/API.md`; anders blijft contract leidend

---

## Recommended merge strategy

**Nu: NIET mergen.** Twan heeft 1 commit (`2d70da9`) op `feature/twan-backend`; Sil heeft 4+ op `feature/sil-frontend`. De branches raken elkaar nauwelijks (geen gedeelde bestanden; backend in `backend/`, frontend in `frontend/` behalve `docs/`).

**Advies:**
- **Geen cherry-pick** — Twan's enkele commit bevat alleen init; geen waarde voor Sil om over te nemen.
- **Geen merge naar `main`** — beide branches zijn MVP-in-progress; `main` is basis (2d70da9 op `main` via `4e402be`).
- **Gebruik `docs/API.md` als contract** — al aligned (c545010); geen merge nodig.
- **Integratieprocedure:**
  1. Twan werkt op `feature/twan-backend`, pusht commits voor auth/chat/messages/ws/db.
  2. Sil werkt op `feature/sil-frontend`, pusht commits voor front-end koppeling zodra Twan levert.
  3. Als beide stabiel: merge `feature/twan-backend` → `main`; dan `feature/sil-frontend` → `main` (of direct `feature/sil-frontend` → `main` als backend al op `main` is).
  4. **Geen conflicten verwacht** omdat mappen gescheiden (`backend/` vs `frontend/`) en `docs/` al synchronized.

---

## External access (Pi3 + tunnel) — checklist voor later

- [ ] `cors` toegevoegd aan backend
- [ ] `PORT=3000` (of 3001) ingesteld op Pi3
- [ ] `ngrok http 3000` of `cloudflared tunnel --url=http://localhost:3000`
- [ ] Frontend `.env` / build krijgt `NEXT_PUBLIC_API_URL=https://<tunnel>` + `NEXT_PUBLIC_WS_URL=wss://<tunnel>/ws`
- [ ] WebSocket `path: '/ws'` blijft; tunnel forwarded naar `localhost:3000`
- [ ] HTTPS/WSS terminatie bij tunnel (backend blijft HTTP — ok)
- [ ] Database op Pi3 (PostgreSQL) of extern (bijv. Supabase) — nog niet nodig voor MVP

---

*Document aangemaakt tijdens MVP-inspectie. Geen backendcode gewijzigd. Geen nieuwe endpoints of WebSocket-events verzonnen. Alleen feitelijk wat in `backend/src/`, `docs/API.md`, en `frontend/src/` staat.*
