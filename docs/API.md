# DuoChat API

Base URL: `http://<host>:<port>`

**Deel 1:** health-check endpoint.
**Deel 2:** PostgreSQL schema (users, chats, chat_members, messages).
**Deel 3 (this PR):** authentication (register, login, protected endpoints).
**Deel 4+:** chat rooms, messages — WebSocket transport at `/ws`.

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

## Endpoints

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

**400 Bad Request** — Validation error (missing/invalid username or password).

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

Content-Type: `application/json`

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

**401 Unauthorized** — Invalid credentials (always generic message).

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

```json
{ "error": "Authentication required" }
```

**404 Not Found** — Authenticated user deleted (should not occur normally).

```json
{ "error": "User not found" }
```

---

## Health

`GET /health`

Returns `200 OK` when the backend is reachable. Use for uptime checks and load balancer probes.

### Response

Status `200` — `application/json`

```json
{
  "status": "ok"
}
```

---

## Appendix

HTTP errors returned by the backend always follow this shape:

```json
{
  "error": "Human-readable message"
}
```