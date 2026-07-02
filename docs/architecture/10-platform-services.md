# Volume 10: Platform Services

## Purpose

Define provider-abstracted services for communications, meetings, surveys, QR, AI, analytics, billing, storage, and search.

## Provider Interfaces

- EmailProvider
- SMSProvider
- CalendarProvider
- SurveyProvider
- QRCodeProvider
- AIProvider
- StorageProvider
- BillingProvider
- SearchProvider
- MapsProvider

## Rule

Feature modules should call platform services, not vendor SDKs directly.

## Initial Provider Targets

- Email: Resend or SMTP
- SMS: Twilio
- Calendar: Cal.com primary, Google Calendar fallback
- AI: OpenAI
- Storage: Supabase Storage or Vercel Blob
- Billing: Stripe
- Automation: n8n

## Audit Standard

Every send, schedule, generation, export, import, scan, and provider callback should create a durable audit event.

## Civic Board Meeting Service

Purpose: help civic organizations run board, committee, commission, and working-group meetings with clearer records and less manual follow-up.

### Information Architecture

The Board Meetings tool is mounted in the admin platform under Programs:

```text
Admin
  Programs
    Board Meetings
```

### Data Model

Core records:

- `BoardMeeting`: the meeting, board/group, date, location, agenda, notes, minutes, summary, status, and follow-up state.
- `BoardDecision`: decisions made during the meeting, owner, impact, and status.
- `BoardActionItem`: tasks assigned during the meeting, owner, due date, priority, and completion status.

### Workflow

1. Create the meeting.
2. Add agenda, attendees, and rough notes.
3. Generate a clean minutes draft from notes.
4. Review decisions and action items.
5. Assign owners and due dates.
6. Export minutes or summary.
7. Track open action items until the next meeting.

### API Surface

- `GET /api/board-meetings`
- `POST /api/board-meetings`
- `PATCH /api/board-meetings/:id`
- `POST /api/board-meetings/:id/minutes`
- `POST /api/board-meetings/:id/decisions`
- `POST /api/board-meetings/:id/action-items`
- `PATCH /api/board-action-items/:id`

### Rules

- Never invent attendees or private contact details.
- Draft minutes must remain editable before use.
- Every change creates an audit event.
- Exports must include meeting title, date, board/group, attendees, summary, decisions, and action items.
