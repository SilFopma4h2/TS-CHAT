# TS-CHAT

Een compacte, private realtime chatapplicatie voor twee gebruikers (Sil & Twan), geoptimaliseerd voor hosting op een Raspberry Pi 3.

## Rollenverdeling

- **Sil**: Frontend (`frontend/`), Infrastructuur (`infra/`), Deployment & Raspberry Pi 3 beheer.
- **Twan**: Backend (`backend/`), Database (`database/`), Realtime WebSocket server.
- **Gedeeld**: `docs/`, `README.md`, `docs/API.md`.

## Architectuur & Documentatie

- [MVP Plan & Architectuur](docs/MVP-PLAN.md)

## Snelstart Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in je browser.
