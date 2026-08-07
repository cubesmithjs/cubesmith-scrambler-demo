'use client';

import { generateScramble, UnimplementedEventError, type WcaEventId } from '@cubesmith/scrambler';
import { useState } from 'react';

import type { Run, RunError, RunMode, ScrambleResponse } from '@/lib/api';
import { getEvent } from '@/lib/events';

import { EventPicker } from './event-picker';
import { ScrambleOutput } from './scramble-output';

/**
 * Resolves once the browser has actually painted a frame.
 *
 * Two nested `requestAnimationFrame` calls, not one: the first fires *before*
 * the upcoming paint, the second only after it has happened.
 */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

function toRunError(error: unknown): RunError {
  if (error instanceof UnimplementedEventError) {
    return { kind: 'unimplemented', message: error.message };
  }
  return { kind: 'other', message: error instanceof Error ? error.message : String(error) };
}

interface Pending {
  readonly mode: RunMode;
  readonly cold: boolean;
  readonly event: WcaEventId;
}

export function Playground() {
  const [event, setEvent] = useState<WcaEventId>('333');
  const [mode, setMode] = useState<RunMode>('server');
  const [seed, setSeed] = useState('');
  const [run, setRun] = useState<Run | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  /**
   * Pruning tables already built *in this tab*. Server-side warmth is a
   * separate thing entirely, reported by the route on each response.
   */
  const [warmTables, setWarmTables] = useState<ReadonlySet<string>>(() => new Set());

  const selected = getEvent(event);
  const busy = pending !== null;
  const clientColdAhead = mode === 'client' && selected.table !== null && !warmTables.has(selected.table);

  async function generate() {
    const table = selected.table;
    const seedValue = seed.trim() ? seed.trim() : null;
    const options = seedValue ? { seed: seedValue } : {};

    if (mode === 'client') {
      const cold = table !== null && !warmTables.has(table);
      setPending({ mode, cold, event });

      // Hand the browser a frame to paint the pending state before we give it
      // a workload that blocks the main thread. `generateScramble` is async,
      // but the work inside it is synchronous CPU: without this yield the
      // state update and the block land in the same frame, so the tab freezes
      // showing the *previous* scramble and looks broken rather than busy.
      await nextPaint();

      const startedAt = performance.now();
      try {
        const result = await generateScramble(event, options);
        const elapsedMs = performance.now() - startedAt;
        if (table) setWarmTables((previous) => new Set(previous).add(table));
        setRun({ mode, event, elapsedMs, roundTripMs: null, cold, seed: seedValue, result, error: null });
      } catch (error) {
        setRun({
          mode,
          event,
          elapsedMs: performance.now() - startedAt,
          roundTripMs: null,
          cold,
          seed: seedValue,
          result: null,
          error: toRunError(error),
        });
      } finally {
        setPending(null);
      }
      return;
    }

    setPending({ mode, cold: false, event });
    const params = new URLSearchParams({ event });
    if (seedValue) params.set('seed', seedValue);

    const startedAt = performance.now();
    try {
      const response = await fetch(`/api/scramble?${params.toString()}`);
      const roundTripMs = performance.now() - startedAt;

      // Read the body whatever the status. An unimplemented event comes back
      // as a 501 carrying a structured payload, not as a network failure.
      const payload = (await response.json()) as ScrambleResponse;

      setRun(
        payload.ok
          ? {
              mode,
              event,
              elapsedMs: payload.elapsedMs,
              roundTripMs,
              cold: payload.cold,
              seed: seedValue,
              result: payload.result,
              error: null,
            }
          : {
              mode,
              event,
              elapsedMs: 0,
              roundTripMs,
              cold: false,
              seed: seedValue,
              result: null,
              error: {
                kind: payload.kind === 'unimplemented' ? 'unimplemented' : 'other',
                message: payload.message,
              },
            },
      );
    } catch (error) {
      setRun({
        mode,
        event,
        elapsedMs: 0,
        roundTripMs: performance.now() - startedAt,
        cold: false,
        seed: seedValue,
        result: null,
        error: toRunError(error),
      });
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <fieldset className="flex flex-col gap-3" disabled={busy}>
        <legend className="sr-only">Where to generate the scramble</legend>
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-neutral-400">Run on</span>
          <div className="inline-flex rounded-lg border border-neutral-800 p-1">
            {(['server', 'client'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMode(option)}
                aria-pressed={mode === option}
                className={[
                  'rounded-md px-4 py-1.5 text-sm font-medium transition',
                  mode === option
                    ? 'bg-emerald-500/15 text-emerald-300'
                    : 'text-neutral-400 hover:text-neutral-200',
                ].join(' ')}
              >
                {option === 'server' ? 'Server' : 'Browser'}
              </button>
            ))}
          </div>
          <p className="text-sm text-neutral-500">
            {mode === 'server'
              ? 'A Route Handler generates it. Tables stay warm in the server process, so only the first request pays the cold start.'
              : 'The same call, in a Client Component. No Worker, no bundler workaround — and no thread to hide the work on.'}
          </p>
        </div>
      </fieldset>

      <EventPicker value={event} onChange={setEvent} disabled={busy} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="seed" className="block text-sm font-medium text-neutral-400">
            Seed <span className="text-neutral-600">(optional)</span>
          </label>
          <input
            id="seed"
            type="text"
            value={seed}
            onChange={(changeEvent) => setSeed(changeEvent.target.value)}
            disabled={busy}
            placeholder="round-1"
            className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
          />
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Generating…' : 'Generate'}
        </button>
      </div>

      <p className="-mt-2 text-sm text-neutral-500">
        Give it a seed and generation is reproducible: the same seed and the same event produce
        identical moves, every time, on any machine, in either mode. Press Generate twice with a
        seed set and compare. Leave it empty for a cryptographically random scramble.
      </p>

      {clientColdAhead && !busy ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-200/90">
          Heads up: the {selected.name} pruning table has not been built in this tab yet. In browser
          mode that build runs on the main thread and will freeze this page for about{' '}
          {selected.firstCall} — no spinner will animate, scrolling will stop, and the tab may go
          grey. Every later call for this event is then {selected.afterwards}.
        </p>
      ) : null}

      {pending ? (
        <p
          role="status"
          aria-live="polite"
          className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm leading-relaxed text-neutral-300"
        >
          {pending.mode === 'server'
            ? 'Asking the server…'
            : pending.cold
              ? `Building the ${getEvent(pending.event).name} table on this thread. The page is frozen until it finishes — that is what "no Web Worker" costs, and pretending otherwise with an animated spinner would be a lie.`
              : `Generating ${getEvent(pending.event).name} on this thread.`}
        </p>
      ) : null}

      {run ? <ScrambleOutput run={run} /> : null}
    </div>
  );
}
