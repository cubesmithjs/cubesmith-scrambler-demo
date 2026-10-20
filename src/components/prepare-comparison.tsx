'use client';

import type { WcaEventId } from '@cubesmith/scrambler';
import { useRef, useState } from 'react';

import { coldCost, getEvent } from '@/lib/events';
import type { SeededBatchReply, SeededBatchRequest } from '@/workers/seeded-batch';

/** Small, so the comparison is about the strings, not about waiting. */
const COMPARISON_COUNT = 3;
const FALLBACK_SEED = 'round-1';

type Side = Extract<SeededBatchReply, { ok: true }>;

interface Comparison {
  readonly event: WcaEventId;
  readonly seed: string;
  readonly cold: Side;
  readonly prepared: Side;
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}

/** One request to one brand-new Worker, which is terminated as soon as it answers. */
function runInFreshWorker(request: SeededBatchRequest): Promise<Side> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('../workers/seeded-batch.ts', import.meta.url), {
      type: 'module',
    });
    worker.onmessage = ({ data }: MessageEvent<SeededBatchReply>) => {
      worker.terminate();
      if (data.ok) resolve(data);
      else reject(new Error(data.message));
    };
    worker.onerror = (event) => {
      worker.terminate();
      reject(new Error(event.message || 'the Worker failed to start'));
    };
    worker.postMessage(request);
  });
}

/**
 * "Preparing does not change the output", run rather than asserted.
 *
 * 🔴 Why `prepareEvent` is not "generate one scramble and throw it away": a
 * discarded draw consumes entropy, which would shift every scramble after it
 * and turn a performance helper into a correctness hazard. The package tests
 * that a seeded batch is byte-identical with and without a preceding
 * `prepareEvent`; this panel runs the same two batches, each in a fresh Worker so
 * that **both start cold** — one prepared first, one not — and compares the
 * strings on screen.
 */
export function PrepareComparison({
  event,
  seed,
  disabled,
}: {
  readonly event: WcaEventId;
  readonly seed: string;
  readonly disabled: boolean;
}) {
  const [running, setRunning] = useState(false);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [error, setError] = useState<string | null>(null);
  const runId = useRef(0);

  const selected = getEvent(event);
  const seedValue = seed || FALLBACK_SEED;

  async function compare() {
    const id = (runId.current += 1);
    setRunning(true);
    setError(null);
    setComparison(null);
    try {
      const base = { event, seed: seedValue, count: COMPARISON_COUNT };
      const [cold, prepared] = await Promise.all([
        runInFreshWorker({ ...base, prepare: false }),
        runInFreshWorker({ ...base, prepare: true }),
      ]);
      if (id === runId.current) setComparison({ event, seed: seedValue, cold, prepared });
    } catch (thrown) {
      if (id === runId.current) setError(thrown instanceof Error ? thrown.message : String(thrown));
    } finally {
      if (id === runId.current) setRunning(false);
    }
  }

  const identical =
    comparison !== null &&
    comparison.cold.moves.length === comparison.prepared.moves.length &&
    comparison.cold.moves.every((moves, index) => moves === comparison.prepared.moves[index]);

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-5">
      <h3 className="font-semibold text-neutral-200">Preparing does not change the output</h3>
      <p className="text-sm leading-relaxed text-neutral-400">
        <code className="font-mono text-neutral-300">prepareEvent</code> is <em>not</em>{' '}
        &ldquo;generate a scramble and throw it away&rdquo;. A discarded draw consumes entropy, which
        would shift every later scramble under a seed and turn a performance helper into a
        correctness hazard. So here are the same {COMPARISON_COUNT} seeded {selected.name} scrambles,
        drawn twice: once straight from a cold start, once after{' '}
        <code className="font-mono text-neutral-300">prepareEvent</code>.
      </p>
      <p className="text-sm leading-relaxed text-neutral-500">
        Each side runs in its own brand-new Web Worker, because a Worker loads its own copy of the
        package — the only way to start cold twice in a tab that may already have built the table.
        It also means this one comparison does not freeze the page. Seed{' '}
        <code className="font-mono text-neutral-300">{seedValue}</code>
        {seed ? ', from the field above.' : ' (the field above is empty, so a fixed one).'}
        {coldCost(selected) ? ` Expect ${coldCost(selected)} per side for the table.` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={compare}
          disabled={disabled || running}
          className="rounded-lg border border-neutral-800 px-4 py-1.5 text-sm transition hover:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {running ? 'Running both…' : `Run both, in two fresh Workers`}
        </button>
        {comparison ? (
          <span
            className={[
              'rounded-full border px-2.5 py-0.5 text-sm',
              identical
                ? 'border-emerald-500/40 text-emerald-300'
                : 'border-amber-500/50 text-amber-300',
            ].join(' ')}
            data-testid="prepare-comparison-verdict"
          >
            {identical ? 'byte-identical' : 'they differ — that would be a bug in the package'}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="font-mono text-sm break-words text-amber-200/90">{error}</p>
      ) : null}

      {comparison ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {(
            [
              ['Cold, no prepareEvent', comparison.cold],
              ['prepareEvent first', comparison.prepared],
            ] as const
          ).map(([title, side]) => (
            <div key={title} className="flex flex-col gap-2">
              <p className="text-sm text-neutral-400">
                <span className="font-medium text-neutral-200">{title}</span>
                {' — '}
                {side.prepareMs !== null ? `prepared in ${formatMs(side.prepareMs)}, then ` : ''}
                batch {formatMs(side.batchMs)}
              </p>
              <ol className="flex flex-col gap-1 rounded-lg bg-neutral-950 p-3 font-mono text-xs leading-relaxed text-neutral-300">
                {side.moves.map((moves, index) => (
                  <li key={index} className="break-words">
                    {index + 1}. {moves}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : null}

      {comparison ? (
        <p className="text-sm leading-relaxed text-neutral-500">
          The cost moved and the strings did not: the cold side paid for the table inside its batch,
          the prepared side paid for it in <code className="font-mono">prepareEvent</code> and then
          drew the same scrambles.
        </p>
      ) : null}
    </section>
  );
}
