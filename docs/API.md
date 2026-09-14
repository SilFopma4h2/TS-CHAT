# DuoChat (TS-CHAT) API Specificatie

Base URL: `http://<host>:<port>` (standaard `http://localhost:3000` in development)  
WebSocket URL: `ws://<host>:<port>/ws`

---

## Overzicht

| Module | Methode | Endpoint | Beschrijving | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Health** | `GET` | `/health` | Uptime check van backend & database | Geïmplementeerd (Deel 1) |
| **Auth** | `POST` | `/api/auth/login` | Inloggen met gebruikersnaam & optioneel wachtwoord | Frontend gereed (Contract Deel 2) |
| **Auth** | `POST` | `/api/auth/register` | Nieuwe gebruiker registreren | Frontend gereed (Contract Deel 2) |
| **Auth** | `GET` | `/api/auth/me` | Ingelogde gebruikersgegevens ophalen | Frontend gereed (Contract Deel 2) |
| **Auth** | `POST` | `/api/auth/logout` | Sessie beëindigen | Frontend gereed (Contract Deel 2) |
| **Chats** | `GET` | `/api/chats` | Overzicht van actieve gesprekken | Frontend gereed (Contract Deel 2) |
| **Chats** | `POST` | `/api/chats` | Direct gesprek starten of ophalen met partner | Frontend gereed (Contract Deel 2) |
| **Chats** | `GET` | `/api/chats/:id` | Details van één specifiek gesprek | Frontend gereed (Contract Deel 2) |
| **Messages**| `GET` | `/api/chats/:chatId/messages` | Historische berichten ophalen | Frontend gereed (Contract Deel 2) |
| **Messages**| `POST` | `/api/chats/:chatId/messages` | Bericht verzenden via REST (fallback) | Frontend gereed (Contract Deel 2) |
| **Realtime**| `WS` | `/ws` | Bidirectionele realtime messaging & presence | Frontend types gereed (Transport Deel 1) |

---

## 1. Health

### `GET /health`
Controleert of de backend service en eventuele databaseverbinding actief zijn.

#### Request
Geen parameters of body.

#### Response
Status: `200 OK`  
Content-Type: `application/json`
```json
{
  "status": "ok"
}
```

---

## 2. Authenticatie

### `POST /api/auth/login`
Inloggen van een bestaande gebruiker (Sil of Twan).

#### Request Body
```json
{
  "username": "sil",
  "password": "optional_or_pincode"
}
```

#### Response (`200 OK`)
```json
{
  "user": {
    "id": "sil",
    "username": "sil",
    "name": "Sil",
    "role": "Frontend & Infra"
  },
  "token": "jwt_or_session_token_string"
}
```

---

### `POST /api/auth/register`
Registreren van een gebruiker.

#### Request Body
```json
{
  "username": "twan",
  "password": "optional_or_pincode",
  "role": "Backend & Realtime"
}
```

#### Response (`201 Created` of `200 OK`)
```json
{
  "user": {
    "id": "twan",
    "username": "twan",
    "name": "Twan",
    "role": "Backend & Realtime"
  },
  "token": "jwt_or_session_token_string"
}
```

---

### `GET /api/auth/me`
Huidige sessie en profiel opvragen.

#### Request Headers
`Authorization: Bearer <token>`

#### Response (`200 OK`)
```json
{
  "id": "sil",
  "username": "sil",
  "name": "Sil",
  "role": "Frontend & Infra",
  "isOnline": true
}
```

---

## 3. Gesprekken (Chats)

### `GET /api/chats`
Lijst met alle gesprekken van de ingelogde gebruiker.

#### Request Headers
`Authorization: Bearer <token>`

#### Response (`200 OK`)
```json
[
  {
    "id": "conv-sil-twan",
    "name": "Twan",
    "participants": [
      { "id": "sil", "username": "sil", "name": "Sil" },
      { "id": "twan", "username": "twan", "name": "Twan" }
    ],
    "lastMessage": {
      "id": "msg-123",
      "chatId": "conv-sil-twan",
      "senderId": "twan",
      "text": "WebSocket is gereed!",
      "createdAt": "2026-09-14T18:00:00.000Z",
      "status": "delivered"
    },
    "unreadCount": 0,
    "updatedAt": "2026-09-14T18:00:00.000Z"
  }
]
```

---

### `POST /api/chats`
Direct gesprek starten of ophalen met een specifieke partner. Als het gesprek tussen deze twee gebruikers al bestaat, wordt het bestaande gesprek geretourneerd.

#### Request Headers
`Authorization: Bearer <token>`

#### Request Body
```json
{
  "partnerId": "twan"
}
```

#### Response (`200 OK` of `201 Created`)
```json
{
  "id": "conv-sil-twan",
  "name": "Twan",
  "participants": [
    { "id": "sil", "username": "sil", "name": "Sil" },
    { "id": "twan", "username": "twan", "name": "Twan" }
  ],
  "unreadCount": 0,
  "updatedAt": "2026-09-14T18:00:00.000Z"
}
```

---

### `GET /api/chats/:id`
Details van één specifiek gesprek ophalen.

#### Request Headers
`Authorization: Bearer <token>`

#### Response (`200 OK`)
```json
{
  "id": "conv-sil-twan",
  "name": "Twan",
  "participants": [
    { "id": "sil", "username": "sil", "name": "Sil" },
    { "id": "twan", "username": "twan", "name": "Twan" }
  ],
  "unreadCount": 0,
  "updatedAt": "2026-09-14T18:00:00.000Z"
}
```

---

## 4. Berichten (Messages)

### `GET /api/chats/:chatId/messages`
Historische berichten ophalen binnen een gesprek.

#### Query Parameters
- `limit` (optioneel, bijv. `50`): Aantal berichten om op te halen.
- `before` (optioneel, ISO timestamp): Paginering om oudere berichten te laden.

#### Response (`200 OK`)
```json
[
  {
    "id": "msg-1",
    "chatId": "conv-sil-twan",
    "senderId": "sil",
    "text": "Hoi Twan!",
    "createdAt": "2026-09-14T17:30:00.000Z",
    "status": "read"
  },
  {
    "id": "msg-2",
    "chatId": "conv-sil-twan",
    "senderId": "twan",
    "text": "Hoi Sil! Alles draait op de Pi.",
    "createdAt": "2026-09-14T17:31:00.000Z",
    "status": "read"
  }
]
```

---

### `POST /api/chats/:chatId/messages`
Bericht verzenden via REST (fallback wanneer WebSocket offline is).

#### Request Body
```json
{
  "text": "Dit is een fallback bericht",
  "tempId": "temp-uuid-456"
}
```

#### Response (`201 Created` of `200 OK`)
```json
{
  "id": "msg-3",
  "chatId": "conv-sil-twan",
  "senderId": "sil",
  "text": "Dit is een fallback bericht",
  "createdAt": "2026-09-14T18:05:00.000Z",
  "status": "sent",
  "tempId": "temp-uuid-456"
}
```

---

## 5. Realtime WebSocket Protocol (`/ws`)

Realtime interacties lopen via JSON frames over `/ws`:

### Client -> Server
```json
// Authenticatie bij handshake
{ "type": "AUTH", "payload": { "token": "jwt_token" } }

// Bericht verzenden
{ "type": "SEND_MESSAGE", "payload": { "tempId": "uuid-1", "chatId": "conv-sil-twan", "text": "Hallo!" } }

// Typ-indicator
{ "type": "TYPING", "payload": { "chatId": "conv-sil-twan", "isTyping": true } }

// Gelezen bevestiging
{ "type": "READ_ACK", "payload": { "chatId": "conv-sil-twan", "messageId": "msg-123" } }
```

### Server -> Client
```json
// Authenticatie bevestigd
{ "type": "AUTH_SUCCESS", "payload": { "userId": "sil" } }

// Inkomend realtime bericht
{ "type": "NEW_MESSAGE", "payload": { "id": "msg-124", "chatId": "conv-sil-twan", "senderId": "twan", "text": "Hoi!", "createdAt": "..." } }

// Status partner bijgewerkt
{ "type": "USER_STATUS", "payload": { "userId": "twan", "online": true, "lastSeen": "..." } }

// Typ-indicator van partner
{ "type": "TYPING_STATUS", "payload": { "chatId": "conv-sil-twan", "userId": "twan", "isTyping": true } }

// Bevestiging verzonden bericht
{ "type": "MESSAGE_ACK", "payload": { "tempId": "uuid-1", "id": "msg-124", "createdAt": "..." } }
```

---

## 6. Foutafhandeling (Error Format)

Alle HTTP errors vanuit de backend volgen altijd dit JSON-formaat:

```json
{
  "error": "Human-readable foutmelding"
}
```

### Gangbare HTTP Status Codes
- `400 Bad Request` — Ongeldige request body of ontbrekende parameters.
- `401 Unauthorized` — Ongeldig of ontbrekend authenticatietoken.
- `403 Forbidden` — Geen toegang tot dit gesprek.
- `404 Not Found` — Endpoint, gebruiker of gesprek niet gevonden.
- `500 Internal Server Error` — Onverwachte fout in de backend.
