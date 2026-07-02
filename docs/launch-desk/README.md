# Launch Desk

Launch Desk is a server-side OpenAI launch-planning agent workspace mounted at `/launch-desk`.

It turns a rough launch idea into:

- a prioritized release plan
- a risk register
- an owner checklist
- channel-specific launch copy suggestions
- follow-up questions when important launch details are missing

## Architecture

- Frontend UI: `src/pages/LaunchDesk.tsx`
- API route: `POST /api/launch-desk/stream` in `server.ts`
- Agent service and tools: `src/services/launchDesk/launchDeskAgent.ts`

OpenAI calls happen only on the server. The browser receives server-sent events from the platform API.

## OpenAI Setup

Set the server-side key in local `.env.local` and Vercel production:

```env
OPENAI_API_KEY=
LAUNCH_DESK_MODEL=gpt-4.1-mini
```

`LAUNCH_DESK_MODEL` is optional. If unset, Launch Desk uses `OPENAI_MODEL`, then falls back to `gpt-4.1-mini`.

## Local Run

```bash
npm run dev
```

Open:

```txt
http://localhost:3000/launch-desk
```

If Vite is running separately in front of the Express server, make sure API requests reach the Express backend.

## Streaming Contract

The endpoint emits SSE events:

```txt
event: tool_progress
data: {"type":"tool_progress","tool":"extract_tasks","status":"completed"}

event: text_delta
data: {"delta":"..."}

event: done
data: {"ok":true}
```

## Built-In Tools

- `extract_tasks`: extracts and normalizes launch tasks from the brief.
- `check_launch_readiness`: scores missing details against a simple rubric.
- `generate_owner_checklist`: creates owner-specific launch tasks.
- `draft_channel_copy`: drafts email, Slack, and release-note starting points.

## Validation Checklist

- Frontend renders `/launch-desk`.
- Form submits to `/api/launch-desk/stream`.
- Stream includes at least one `tool_progress` event.
- Stream includes at least one `text_delta` event from OpenAI.
- Missing `OPENAI_API_KEY` returns a clear error event.
- UI shows loading, error, empty, tool-progress, and final output states.
- No OpenAI key is exposed to the client bundle.

## Extending

Add new deterministic tools in `src/services/launchDesk/launchDeskAgent.ts`, include their output in the OpenAI prompt payload, and render their progress events in the UI.

For a future full Agents SDK migration, preserve the same streaming event contract so the frontend does not need to change.
