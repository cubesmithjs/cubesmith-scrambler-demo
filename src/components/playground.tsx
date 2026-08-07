'use client';

import {
  generateScramble,
  InvalidScrambleCountError,
  MAX_SCRAMBLE_COUNT,
  UnimplementedEventError,
  type WcaEventId,
} from '@cubesmith/scrambler';
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

/**
 * True in the static GitHub Pages build, which has no server to call. Inlined
 * at build time by `next.config.ts`, so the server branch below is dropped
 * from that bundle entirely rather than being hidden at runtime.
 */
const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

function toRunError(error: unknown): RunError {
  if (error instanceof UnimplementedEventError) {
    return { kind: 'unimplemented', message: error.message };
  }
  if (error instanceof InvalidScrambleCountError) {
    return { kind: 'invalid-count', message: error.message };
  }
  return { kind: 'other', message: error instanceof Error ? error.message : String(error) };
}

interface Pending {
  readonly mode: RunMode;
  readonly cold: boolean;
  readonly event: WcaEventId;
}

/**
 * The only event that takes a `count`. Deliberately derived from the package's
 * own behaviour rather than hardcoded as a list: if a second multi-scramble
 * event is ever added, this is the one line to revisit, and it is named so the
 * next reader can find it.
 */
const MULTI_SCRAMBLE_EVENT: WcaEventId = '333mbf';

/**
 * Where the deliberate `InvalidScrambleCountError` demonstration sends its
 * count. Any event that is not multi-scramble would do; 3x3x3 is the one every
 * visitor recognises.
 */
const COUNT_REFUSING_EVENT: WcaEventId = '333';

/** A low default: each cube is a full random-state solve, so the cost is real and visible. */
const DEFAULT_COUNT = 3;

export function Playground() {
  const [event, setEvent] = useState<WcaEventId>('333');
  const [mode, setMode] = useState<RunMode>(STATIC_EXPORT ? 'client' : 'server');
  const [seed, setSeed] = useState('');
  const [count, setCount] = useState(String(DEFAULT_COUNT));
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

  const multi = event === MULTI_SCRAMBLE_EVENT;
  /** `null` while the field is empty or not a whole number — the button stays disabled rather than guessing. */
  const countValue = /^\d+$/.test(count.trim()) ? Number(count.trim()) : null;
  const countUsable = countValue !== null && countValue >= 1 && countValue <= MAX_SCRAMBLE_COUNT;

  /**
   * `overrides` exists for the deliberate-error button, which needs to send a
   * count to an event that refuses one — a combination the controls above can
   * never produce, because the count field only appears for `333mbf`.
   */
  async function generate(overrides?: { readonly event: WcaEventId; readonly count: number }) {
    const targetEvent = overrides?.event ?? event;
    const table = getEvent(targetEvent).table;
    const seedValue = seed.trim() ? seed.trim() : null;

    // Only send a count when the event actually takes one. Sending it always
    // would turn every other event into an InvalidScrambleCountError.
    const countToSend =
      overrides?.count ?? (multi && countUsable ? (countValue as number) : null);

    const options = {
      ...(seedValue ? { seed: seedValue } : {}),
      ...(countToSend !== null ? { count: countToSend } : {}),
    };

    if (mode === 'client') {
      const cold = table !== null && !warmTables.has(table);
      setPending({ mode, cold, event: targetEvent });

      // Hand the browser a frame to paint the pending state before we give it
      // a workload that blocks the main thread. `generateScramble` is async,
      // but the work inside it is synchronous CPU: without this yield the
      // state update and the block land in the same frame, so the tab freezes
      // showing the *previous* scramble and looks broken rather than busy.
      await nextPaint();

      const startedAt = performance.now();
      try {
        const result = await generateScramble(targetEvent, options);
        const elapsedMs = performance.now() - startedAt;
        if (table) setWarmTables((previous) => new Set(previous).add(table));
        setRun({
          mode,
          event: targetEvent,
          count: countToSend,
          elapsedMs,
          roundTripMs: null,
          cold,
          seed: seedValue,
          result,
          error: null,
        });
      } catch (error) {
        setRun({
          mode,
          event: targetEvent,
          count: countToSend,
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

    setPending({ mode, cold: false, event: targetEvent });
    const params = new URLSearchParams({ event: targetEvent });
    if (seedValue) params.set('seed', seedValue);
    if (countToSend !== null) params.set('count', String(countToSend));

    const startedAt = performance.now();
    try {
      const response = await fetch(`/api/scramble?${params.toString()}`);
      const roundTripMs = performance.now() - startedAt;

      // Read the body whatever the status. A rejected call comes back as a 501
      // or a 400 carrying a structured payload, not as a network failure.
      const payload = (await response.json()) as ScrambleResponse;

      setRun(
        payload.ok
          ? {
              mode,
              event: targetEvent,
              count: countToSend,
              elapsedMs: payload.elapsedMs,
              roundTripMs,
              cold: payload.cold,
              seed: seedValue,
              result: payload.result,
              error: null,
            }
          : {
              mode,
              event: targetEvent,
              count: countToSend,
              elapsedMs: 0,
              roundTripMs,
              cold: false,
              seed: seedValue,
              result: null,
              error: {
                kind:
                  payload.kind === 'unimplemented' || payload.kind === 'invalid-count'
                    ? payload.kind
                    : 'other',
                message: payload.message,
              },
            },
      );
    } catch (error) {
      setRun({
        mode,
        event: targetEvent,
        count: countToSend,
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
      {STATIC_EXPORT ? (
        <p className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm leading-relaxed text-neutral-400">
          This is the static GitHub Pages build. Pages serves files and runs no
          code, so there is no Route Handler here and every scramble below is generated in your
          browser. That half still proves the useful thing — the package really does run client-side
          with no Worker. For the server/browser comparison and its timings, run the app anywhere
          with compute; see the README.
        </p>
      ) : (
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
      )}

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

        {/*
          Scoped to the one event that takes a count. A field greyed out for the
          other sixteen would be noise, and a field that silently did nothing
          would be worse.
        */}
        {multi ? (
          <div className="sm:w-40">
            <label htmlFor="count" className="block text-sm font-medium text-neutral-400">
              Cubes <span className="text-neutral-600">(1&ndash;{MAX_SCRAMBLE_COUNT})</span>
            </label>
            <input
              id="count"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_SCRAMBLE_COUNT}
              value={count}
              onChange={(changeEvent) => setCount(changeEvent.target.value)}
              disabled={busy}
              aria-invalid={!countUsable}
              aria-describedby="count-help"
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
            />
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => generate()}
          disabled={busy || (multi && !countUsable)}
          className="rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Generating…' : 'Generate'}
        </button>
      </div>

      {multi ? (
        <div
          id="count-help"
          className="-mt-2 flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm leading-relaxed text-neutral-400"
        >
          <p>
            Multi-Blind is one attempt over many cubes, so this is the only event that takes a{' '}
            <code className="font-mono text-neutral-200">count</code>. Each cube is a full
            random-state solve of roughly 100&nbsp;ms once the 3x3x3 table is warm, so{' '}
            {MAX_SCRAMBLE_COUNT} of them is about ten seconds — and in browser mode that is ten
            seconds of blocked main thread. The cost is shown rather than hidden; that is the point
            of this page.
          </p>
          <p>
            The draws are independent and deliberately not de-duplicated, so a repeat is legitimate
            rather than a bug. <code className="font-mono text-neutral-200">result.moves</code> is
            still <code className="font-mono text-neutral-200">result.scrambles[0]</code>, which is
            how code written before Multi-Blind existed keeps working.
          </p>
          <p>
            Passing <code className="font-mono text-neutral-200">count</code> to any other event is
            an error rather than a silently ignored option — otherwise you could believe you had
            asked for {countUsable ? countValue : DEFAULT_COUNT} scrambles and received one.{' '}
            <button
              type="button"
              onClick={() =>
                generate({
                  event: COUNT_REFUSING_EVENT,
                  count: countUsable ? (countValue as number) : DEFAULT_COUNT,
                })
              }
              disabled={busy}
              className="font-medium text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Send this count to 3x3x3 and see.
            </button>
          </p>
        </div>
      ) : null}

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
