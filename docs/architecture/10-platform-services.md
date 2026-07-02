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

