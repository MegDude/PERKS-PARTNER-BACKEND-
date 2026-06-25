# Automation Engine

## API

- `GET /api/automations`
- `GET /api/automations/runs`
- `POST /api/automations/:id/run`

## Current Automations

- Survey Webhook Intake
- Event Reminder Journey
- Passport Stamp Progress
- AI Survey Analysis
- Event Follow-Up

## Run Shape

Automation runs include:

- name
- provider
- status
- trigger
- action
- last_run
- success_count
- failure_count
- logs

External orchestrators such as n8n remain inactive until credentials/webhooks are configured.

