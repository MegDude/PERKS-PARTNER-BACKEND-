# Downtown Perks Backend Platform

This app now runs as a complete local Downtown Perks operations platform:

- Express API server with Vite frontend middleware
- Persistent JSON datastore at `data/downtown-perks-db.json`
- Base44-compatible entity API for buildings, residents, flats, partners, perks, announcements, surveys, events, campaigns, messages, and reports
- Compatibility endpoints for `/api/properties`, `/api/perks`, `/api/redemptions`, and `/api/insights/*`
- OpenAI-powered property ingestion through the backend AI provider when `OPENAI_API_KEY` is configured

## Run Locally

```bash
npm install
npm run dev
```

Default URL: `http://localhost:3000`

Use a different port with:

```bash
PORT=3001 npm run dev
```

## Production Run

```bash
npm run build
npm start
```

## Useful API Checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/entities/Building
curl http://localhost:3000/api/insights/overview
```

## Reset Seed Data

```bash
curl -X POST http://localhost:3000/api/functions/seedDemoData \
  -H "Content-Type: application/json" \
  -d "{}"
```
