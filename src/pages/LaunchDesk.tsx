import React, { useMemo, useState } from 'react';
import { Send, Sparkles } from 'lucide-react';

type EventItem = {
  type: string;
  payload: any;
};

const starter = {
  productBrief: 'Launch a partner campaign calendar that lets property teams schedule onboarding calls, campaign launches, perk windows, and events from one workspace.',
  audience: 'Downtown Perks internal operators, property managers, and partner marketing teams',
  launchDate: '2026-08-15',
  constraints: 'Must keep OpenAI calls server-side, avoid duplicate calendar events, and support mobile review.',
  assets: 'Partner Calendar page, booking link registry, Google Calendar environment variables, launch screenshots, help copy.',
};

function parseSseChunk(chunk: string) {
  return chunk
    .split('\n\n')
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const type = block.split('\n').find((line) => line.startsWith('event: '))?.slice(7) || 'message';
      const data = block.split('\n').find((line) => line.startsWith('data: '))?.slice(6) || '{}';
      try {
        return { type, payload: JSON.parse(data) };
      } catch {
        return { type, payload: { raw: data } };
      }
    });
}

export default function LaunchDesk() {
  const [form, setForm] = useState(starter);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [text, setText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState('');

  const toolEvents = useMemo(() => events.filter((event) => event.type === 'tool_progress'), [events]);

  function updateField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function runAgent(event: React.FormEvent) {
    event.preventDefault();
    setEvents([]);
    setText('');
    setError('');
    setIsStreaming(true);
    try {
      const response = await fetch('/api/launch-desk/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!response.ok || !response.body) throw new Error('Launch Desk stream could not start.');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const blocks = buffer.split('\n\n');
        buffer = blocks.pop() || '';
        for (const item of parseSseChunk(blocks.join('\n\n'))) {
          setEvents((current) => [...current, item]);
          if (item.type === 'text_delta') setText((current) => current + (item.payload.delta || ''));
          if (item.type === 'error') setError(item.payload.error || 'Launch Desk failed.');
        }
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Launch Desk failed.');
    } finally {
      setIsStreaming(false);
    }
  }

  return (
    <main className="min-h-screen bg-white text-[#0B1F33]">
      <div className="w-full px-4 py-5 sm:px-5 lg:px-6 lg:py-6">
        <header className="mb-5 border-b border-[rgba(11,31,51,0.08)] pb-4">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-[#C8A96A]">Agent workspace</p>
          <h1 className="mt-2 text-[30px] font-semibold leading-none tracking-normal sm:text-4xl">Launch Desk</h1>
          <p className="mt-3 max-w-3xl text-[13px] leading-5 text-[rgba(11,31,51,0.66)]">
            Turn a rough launch idea into a prioritized release plan, risk register, owner checklist, channel copy, and follow-up questions.
          </p>
        </header>

        <div className="grid gap-5 xl:grid-cols-[420px_1fr]">
          <form onSubmit={runAgent} className="grid gap-3 border border-[rgba(11,31,51,0.08)] p-4">
            {[
              ['productBrief', 'Product brief', 6],
              ['audience', 'Audience', 3],
              ['launchDate', 'Launch date', 1],
              ['constraints', 'Constraints', 4],
              ['assets', 'Available assets', 4],
            ].map(([field, label, rows]) => (
              <label key={field as string} className="grid gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#C8A96A]">{label as string}</span>
                <textarea
                  value={form[field as keyof typeof form]}
                  onChange={(input) => updateField(field as keyof typeof form, input.target.value)}
                  rows={rows as number}
                  className="w-full resize-y border border-[rgba(11,31,51,0.1)] p-3 text-[12px] leading-5 outline-none focus:border-[#C8A96A]"
                />
              </label>
            ))}
            <button disabled={isStreaming} className="inline-flex min-h-10 items-center justify-center gap-2 bg-[#0B1F33] px-4 text-[12px] font-semibold text-white disabled:opacity-60">
              <Send className="h-3.5 w-3.5" /> {isStreaming ? 'Building plan...' : 'Generate launch plan'}
            </button>
          </form>

          <section className="grid gap-4">
            <article className="border border-[rgba(11,31,51,0.08)] p-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#C8A96A]" />
                <h2 className="text-[15px] font-semibold">Progress</h2>
              </div>
              <div className="mt-3 grid gap-2">
                {toolEvents.length ? toolEvents.map((event, index) => (
                  <div key={`${event.payload.tool}-${index}`} className="flex justify-between gap-3 border-b border-[rgba(11,31,51,0.06)] pb-2 text-[12px]">
                    <span className="font-semibold">{String(event.payload.tool || 'tool').replace(/_/g, ' ')}</span>
                    <span className="capitalize text-[rgba(11,31,51,0.58)]">{event.payload.status}</span>
                  </div>
                )) : (
                  <p className="text-[12px] text-[rgba(11,31,51,0.58)]">Tool progress appears here as the agent works.</p>
                )}
              </div>
            </article>

            <article className="min-h-[460px] border border-[rgba(11,31,51,0.08)] p-4">
              <h2 className="text-[15px] font-semibold">Launch plan</h2>
              {error ? <p className="mt-3 border border-red-200 p-3 text-[12px] font-semibold text-red-700">{error}</p> : null}
              <div className="mt-3 whitespace-pre-wrap text-[13px] leading-6 text-[rgba(11,31,51,0.78)]">
                {text || (isStreaming ? 'Waiting for model output...' : 'Your generated release plan will appear here.')}
              </div>
            </article>
          </section>
        </div>
      </div>
    </main>
  );
}
