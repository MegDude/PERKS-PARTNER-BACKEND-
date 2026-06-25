# AI Platform Integration

## API

- `POST /api/ai/ask-map`
- `POST /api/ai/recommendations`
- `POST /api/ai/report-summary`
- `POST /api/ai/survey-summary`

## Context Model

AI endpoints use structured local platform context:

- mode
- visible entities
- active entity where provided
- available perks
- events
- reports
- survey responses
- analytics summary

## Credential Rule

The local endpoints do not require external AI credentials. If OpenAI/Gemini credentials are added, generation can be upgraded while keeping the same API contract.

