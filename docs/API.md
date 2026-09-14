# DuoChat API

Base URL: `http://<host>:<port>`

**Deel 1 (this PR):** health-check endpoint.
**Deel 2+:** chat rooms, users, messages — WebSocket transport at `/ws`.

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