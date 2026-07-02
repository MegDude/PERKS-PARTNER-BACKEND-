# Volume 03: Platform Infrastructure

## Purpose

Define hosting, environments, secrets, observability, storage, authentication, and operational reliability.

## Current Hosting

Primary production domain:

- `https://downtown-perks-backend.vercel.app`

Current app runtime:

- Vite frontend
- Express backend
- Vercel deployment

## Environment Strategy

Environment variables must be stored in Vercel or local `.env.local`, never hardcoded.

Required integration families:

- OpenAI
- Google Maps and Places
- Stripe
- Twilio
- Google Calendar
- Email provider
- Supabase, when enabled
- n8n, when enabled

## Secrets Rule

Client code may only receive public browser-safe keys. Server-only keys must remain behind API routes.

## Monitoring

Each provider integration should expose:

- configured
- missing environment variables
- last successful call
- last error
- operational owner

## Backups and Recovery

Production data must support export, restore, and rollback. Destructive resets require explicit operator confirmation.

