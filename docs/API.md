# DuoChat API

Base URL: `http://<host>:<port>`

**Deel 1:** health-check endpoint.
**Deel 2:** PostgreSQL schema (users, chats, chat_members, messages).
**Deel 3:** authentication (register, login, protected endpoints).
**Deel 4:** one-to-one chats (create, list).
**Deel 5:** (reserved)
**Deel 6:** WebSocket realtime messaging at `/ws`.
**Deel 7:** WebSocket presence (online/offline).

---

## Authentication

All protected endpoints expect a `Bearer` token in the `Authorization` header:

```
Authorization: Bearer <jwt-token>
```

The token is a JWT signed with HS256 containing `{ sub: <userId>, username: <username> }`.

On authentication failure the response is always:

```json
{ "error": "Authentication required" }
```

Status `401`.

---

## REST Endpoints

### Register

`POST /auth/register`

Create a new user account.

#### Request

Content-Type: `application/json`

```json
{
  "username": "twan",
  "password": "secure-password"
}
```

Validation rules:
- `username`: required, 1–32 characters, unique
- `password`: required, minimum 8 characters

#### Responses

**201 Created** — Account created, token included.

```json
{
  "id": 1,
  "username": "twan",
  "createdAt": "2026-01-01T00:00:00.000Z",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**400 Bad Request** — Validation error.

```json
{ "error": "Username is required" }
```

**409 Conflict** — Username already taken.

```json
{ "error": "Username is already taken" }
```

---

### Login

`POST /auth/login`

Authenticate with existing credentials.

#### Request

```json
{
  "username": "twan",
  "password": "secure-password"
}
```

#### Responses

**200 OK** — Login successful, returns JWT.

```json
{ "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." }
```

**401 Unauthorized** — Invalid credentials (generic message).

```json
{ "error": "Invalid credentials" }
```

---

### Get Current User

`GET /users/me`

Returns the authenticated user's profile. Requires authentication.

#### Responses

**200 OK**

```json
{
  "id": 1,
  "username": "twan",
  "createdAt": "2026-01-01T00:00:00.000Z"
}
```

**401 Unauthorized** — Missing or invalid token.

**404 Not Found** — Authenticated user deleted.

---

### Create One-to-One Chat

`POST /chats`

Creates a 1:1 chat between the authenticated user and another user. Requires authentication.

#### Request

```json
{
  "userId": 2
}
```

Validation rules:
- `userId`: required, positive integer, must exist, cannot be yourself
- Duplicate chats are prevented (409)

#### Responses

**201 Created**

```json
{
  "id": 5,
  "createdAt": "2026-01-01T00:00:00.000Z",
  "members": [
    { "id": 1, "username": "alice" },
    { "id": 2, "username": "bob" }
  ]
}
```

**400 Bad Request** — Invalid `userId` or chat with yourself.

**404 Not Found** — Target user does not exist.

**409 Conflict** — Chat already exists between these two users.

**401 Unauthorized** — Missing or invalid token.

---

### List User's Chats

`GET /chats`

Returns all chats where the authenticated user is a member. Requires authentication.

#### Responses

**200 OK**

```json
[
  {
    "id": 5,
    "createdAt": "2026-01-01T00:00:00.000Z",
    "members": [
      { "id": 1, "username": "alice" },
      { "id": 2, "username": "bob" }
    ]
  },
  {
    "id": 3,
    "createdAt": "2026-01-02T00:00:00.000Z",
    "members": [
      { "id": 1, "username": "alice" },
      { "id": 3, "username": "carol" }
    ]
  }
]
```

Empty array if user has no chats.

**401 Unauthorized** — Missing or invalid token.

---

## WebSocket API

Endpoint: `ws://<host>:<port>/ws`

All WebSocket communication uses JSON messages with this structure:

```json
{
  "type": "<event-type>",
  "payload": { ... }
}
```

### Connection Flow

1. Connect to `/ws`
2. Send `auth` message with JWT token
3. Receive `auth.ok` on success, or `error` on failure
4. After authentication, send/receive other events

---

### Client → Server Events

#### Authenticate

```json
{
  "type": "auth",
  "payload": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Response on success:**

```json
{
  "type": "auth.ok",
  "payload": {
    "userId": 1,
    "username": "twan"
  }
}
```

**Response on failure:**

```json
{
  "type": "error",
  "payload": {
    "code": "UNAUTHORIZED",
    "message": "Invalid token"
  }
}
```

---

#### Send Message

```json
{
  "type": "message.send",
  "payload": {
    "chatId": 5,
    "content": "Hallo!"
  }
}
```

Validation rules:
- `chatId`: required, positive integer, must be a chat the user is member of
- `content`: required, non-empty string

**Response on success:** `message.created` is broadcast to all chat members (including sender).

**Response on failure:**

```json
{
  "type": "error",
  "payload": {
    "code": "UNAUTHORIZED | INVALID_PAYLOAD | FORBIDDEN | INTERNAL_ERROR",
    "message": "..."
  }
}
```

Error codes:
- `UNAUTHORIZED` — Not authenticated
- `INVALID_PAYLOAD` — Missing/invalid `chatId` or `content`
- `FORBIDDEN` — User is not a member of the chat
- `INTERNAL_ERROR` — Server error (message not persisted)

---

### Server → Client Events

#### Message Created

Broadcast to all members of a chat when a message is successfully persisted.

```json
{
  "type": "message.created",
  "payload": {
    "id": 42,
    "chatId": 5,
    "senderId": 1,
    "content": "Hallo!",
    "createdAt": "2026-01-01T12:00:00.000Z"
  }
}
```

Fields:
- `id`: message ID (BIGINT)
- `chatId`: chat ID
- `senderId`: user ID of sender
- `content`: message text
- `createdAt`: ISO 8601 timestamp

---

#### Error

Sent when a client event fails validation or authorization.

```json
{
  "type": "error",
  "payload": {
    "code": "UNAUTHORIZED",
    "message": "Not authenticated"
  }
}
```

---

### Presence Events

Presence events are automatically broadcast when users come online or go offline. They are sent to all members of chats that the user participates in.

#### User Online

Broadcast when a user authenticates their first WebSocket connection.

```json
{
  "type": "user.online",
  "payload": {
    "userId": 1
  }
}
```

#### User Offline

Broadcast when a user's last WebSocket connection closes.

```json
{
  "type": "user.offline",
  "payload": {
    "userId": 1
  }
}
```

#### Presence Behavior

- A user is considered **online** when they have at least one authenticated WebSocket connection.
- A user is considered **offline** when they have zero authenticated WebSocket connections.
- Presence events are only sent to users who share at least one chat with the user whose status changed.
- Users who are not authenticated via WebSocket do not receive presence events.
- Presence state is not persisted in the database (ephemeral, in-memory only).

---

## Health

`GET /health`

Returns `200 OK` when the backend is reachable.

```json
{ "status": "ok" }
```

---

## Appendix

HTTP errors always follow this shape:

```json
{ "error": "Human-readable message" }
```
