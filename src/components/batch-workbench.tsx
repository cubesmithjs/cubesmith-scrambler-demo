'use client';

import {
  generateScramble,
  generateScrambles,
  InvalidScrambleCountError,
  MAX_BATCH_COUNT,
  MAX_SCRAMBLE_COUNT,
  prepareEvent,
  type ScrambleResult,
  type WcaEventId,
} from '@cubesmith/scrambler';
import { useRef, useState } from 'react';

import { coldCost, estimatedBatchMs, getEvent } from '@/lib/events';

import { CopyButton } from './copy-button';
import { EventPicker } from './event-picker';

/**
 * Resolves after the browser has actually painted.
 *
 * 🔴 This is the whole reason the progress bar on this page moves, and it is
 * the one thing the package's own docs single out: `onProgress` being
 * **awaited** is what makes yielding *possible*, not what makes it *happen*. An
 * `await` on an already-resolved promise is a microtask, and microtasks run to
 * exhaustion before the browser gets a chance to paint. Only a real macrotask —
 * `requestAnimationFrame`, `setTimeout` — hands the frame back.
 *
 * Two nested frames, not one: the first fires before the upcoming paint, the
 * second after it has happened.
 */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/** Thrown from `onProgress` to stop a run. The package propagates it; nothing else catches it. */
class Cancelled extends Error {
  constructor() {
    super('cancelled');
    this.name = 'Cancelled';
  }
}

interface Progress {
  readonly done: number;
  readonly total: number;
  readonly yielding: boolean;
}

interface BatchRun {
  readonly event: WcaEventId;
  readonly seed: string | null;
  readonly results: readonly ScrambleResult[];
  readonly elapsedMs: number;
  readonly cancelled: boolean;
  readonly cubesPerAttempt: number | null;
}

interface LoopRun {
  readonly count: number;
  readonly distinct: number;
  readonly moves: readonly string[];
}

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}

/** Cheap, table-free, and one of the two events with no cold start at all — a safe default. */
const DEFAULT_EVENT: WcaEventId = 'clock';
const DEFAULT_COUNT = 12;
/** Enough draws that a repeat is unlikely, few enough that the trap demo is instant. */
const LOOP_DEMO_COUNT = 4;

export function BatchWorkbench() {
  const [event, setEvent] = useState<WcaEventId>(DEFAULT_EVENT);
  const [count, setCount] = useState(String(DEFAULT_COUNT));
  const [seed, setSeed] = useState('round-1');
  const [cubes, setCubes] = useState('2');
  const [yieldToPaint, setYieldToPaint] = useState(true);

  const [progress, setProgress] = useState<Progress | null>(null);
  const [run, setRun] = useState<BatchRun | null>(null);
  const [loopRun, setLoopRun] = useState<LoopRun | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState<ReadonlyMap<WcaEventId, number>>(() => new Map());
  const [preparing, setPreparing] = useState(false);

  /** Read inside `onProgress`, so it must be a ref: the callback closes over the first render. */
  const cancelRef = useRef(false);

  const selected = getEvent(event);
  const busy = progress !== null || preparing;
  const multi = event === '333mbf';

  const countValue = /^\d+$/.test(count.trim()) ? Number(count.trim()) : null;
  const countUsable = countValue !== null && countValue >= 1 && countValue <= MAX_BATCH_COUNT;
  const cubesValue = /^\d+$/.test(cubes.trim()) ? Number(cubes.trim()) : null;
  const cubesUsable =
    !multi || (cubesValue !== null && cubesValue >= 1 && cubesValue <= MAX_SCRAMBLE_COUNT);

  async function runBatch() {
    if (!countUsable || !cubesUsable) return;
    const total = countValue;
    const seedValue = seed.trim() ? seed.trim() : null;
    const cubesPerAttempt = multi && cubesValue !== null ? cubesValue : null;

    cancelRef.current = false;
    setError(null);
    setRun(null);
    setLoopRun(null);
    setProgress({ done: 0, total, yielding: yieldToPaint });
    await nextPaint();

    const startedAt = performance.now();
    try {
      const results = await generateScrambles(event, total, {
        ...(seedValue ? { seed: seedValue } : {}),
        ...(cubesPerAttempt !== null ? { cubesPerAttempt } : {}),
        onProgress: async (done, batchTotal) => {
          if (cancelRef.current) throw new Cancelled();
          setProgress({ done, total: batchTotal, yielding: yieldToPaint });
          // The line that decides whether this bar animates or sits at zero.
          if (yieldToPaint) await nextPaint();
        },
      });

      setRun({
        event,
        seed: seedValue,
        results,
        elapsedMs: performance.now() - startedAt,
        cancelled: false,
        cubesPerAttempt,
      });
    } catch (thrown) {
      if (thrown instanceof Cancelled) {
        setRun({
          event,
          seed: seedValue,
          results: [],
          elapsedMs: performance.now() - startedAt,
          cancelled: true,
          cubesPerAttempt,
        });
      } else if (thrown instanceof InvalidScrambleCountError) {
        setError(`InvalidScrambleCountError — ${thrown.message}`);
      } else {
        setError(thrown instanceof Error ? thrown.message : String(thrown));
      }
    } finally {
      setProgress(null);
    }
  }

  /**
   * The idiom `generateScrambles` replaced, run for real so the result is
   * visible rather than asserted. With a seed set, every iteration rebuilds the
   * same `RandomSource` from the same seed and draws the same scramble.
   */
  async function runNaiveLoop() {
    cancelRef.current = false;
    setError(null);
    setRun(null);
    setProgress({ done: 0, total: LOOP_DEMO_COUNT, yielding: true });
    await nextPaint();

    const seedValue = seed.trim() ? seed.trim() : null;
    const moves: string[] = [];
    try {
      for (let index = 0; index < LOOP_DEMO_COUNT; index += 1) {
        // Checked here rather than inside a callback, because that is the shape
        // of the old idiom: with no `onProgress` to throw from, cancelling a
        // caller-side loop is the caller's own `if`.
        if (cancelRef.current) break;
        const result = await generateScramble(event, seedValue ? { seed: seedValue } : {});
        moves.push(result.moves);
        setProgress({ done: index + 1, total: LOOP_DEMO_COUNT, yielding: true });
        await nextPaint();
      }
      if (moves.length > 0) {
        setLoopRun({ count: moves.length, distinct: new Set(moves).size, moves });
      }
    } catch (thrown) {
      setError(thrown instanceof Error ? thrown.message : String(thrown));
    } finally {
      setProgress(null);
    }
  }

  async function prepare() {
    setPreparing(true);
    setError(null);
    await nextPaint();
    const startedAt = performance.now();
    try {
      await prepareEvent(event);
      const elapsed = performance.now() - startedAt;
      setPrepared((previous) => new Map(previous).set(event, elapsed));
    } finally {
      setPreparing(false);
    }
  }

  const prepareMs = prepared.get(event);
  const percent = progress && progress.total > 0 ? (progress.done / progress.total) * 100 : 0;

  /**
   * Warn before a batch that would hold the main thread for a long time.
   *
   * `MAX_BATCH_COUNT` is 500 and the picker offers 4x4x4, so the controls on
   * this page can be set to something like ten minutes of frozen tab. Refusing
   * to run it would be the wrong fix — the cost is the thing this demo exists to
   * show — but springing it on someone is not showing it, it is ambushing them.
   */
  const estimatedMs =
    countUsable && countValue !== null
      ? estimatedBatchMs(selected, countValue) * (multi && cubesValue !== null ? cubesValue : 1)
      : 0;
  const heavy = estimatedMs >= 20_000;

  return (
    <div className="flex flex-col gap-6">
      <EventPicker value={event} onChange={setEvent} disabled={busy} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="sm:w-40">
          <label htmlFor="batch-count" className="block text-sm font-medium text-neutral-400">
            {multi ? 'Attempts' : 'Scrambles'}{' '}
            <span className="text-neutral-600">(1&ndash;{MAX_BATCH_COUNT})</span>
          </label>
          <input
            id="batch-count"
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_BATCH_COUNT}
            value={count}
            onChange={(changeEvent) => setCount(changeEvent.target.value)}
            disabled={busy}
            aria-invalid={!countUsable}
            className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
          />
        </div>

        {multi ? (
          <div className="sm:w-44">
            <label htmlFor="batch-cubes" className="block text-sm font-medium text-neutral-400">
              Cubes per attempt <span className="text-neutral-600">(1&ndash;{MAX_SCRAMBLE_COUNT})</span>
            </label>
            <input
              id="batch-cubes"
              type="number"
              inputMode="numeric"
              min={1}
              max={MAX_SCRAMBLE_COUNT}
              value={cubes}
              onChange={(changeEvent) => setCubes(changeEvent.target.value)}
              disabled={busy}
              aria-invalid={!cubesUsable}
              className="mt-1.5 w-full rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none disabled:opacity-40"
            />
          </div>
        ) : null}

        <div className="flex-1">
          <label htmlFor="batch-seed" className="block text-sm font-medium text-neutral-400">
            Seed <span className="text-neutral-600">(optional)</span>
          </label>
          <input
            id="batch-seed"
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
          onClick={runBatch}
          disabled={busy || !countUsable || !cubesUsable}
          className="rounded-lg bg-emerald-500 px-6 py-2.5 font-semibold text-neutral-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {progress ? 'Drawing…' : 'Draw the batch'}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <label className="flex items-center gap-2 text-sm text-neutral-400">
          <input
            type="checkbox"
            checked={yieldToPaint}
            onChange={(changeEvent) => setYieldToPaint(changeEvent.target.checked)}
            disabled={busy}
            className="h-4 w-4 accent-emerald-500"
          />
          Yield to the browser inside <code className="font-mono text-neutral-300">onProgress</code>
        </label>

        <button
          type="button"
          onClick={prepare}
          disabled={busy || selected.table === null}
          className="rounded-lg border border-neutral-800 px-4 py-1.5 text-sm transition hover:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {preparing
            ? 'Preparing…'
            : selected.table === null
              ? `${selected.name} has nothing to prepare`
              : `prepareEvent('${event}')`}
        </button>

        {prepareMs !== undefined ? (
          <span className="text-sm text-neutral-500">
            prepared in <span className="text-neutral-300">{formatMs(prepareMs)}</span>
          </span>
        ) : null}
      </div>

      {heavy && !progress ? (
        <p className="-mt-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-200/90">
          Heads up before you press it: {countValue} {selected.name}{' '}
          {multi ? `attempts of ${cubesValue} cubes each ` : 'scrambles '}
          is on the order of <strong>{Math.round(estimatedMs / 1000)} seconds</strong> of
          computation on this machine, and every one of those seconds is a blocked main thread —
          plus {coldCost(selected) ?? 'no'} cold start if the table is not warm yet. It will
          finish, and with the yield on the bar will move throughout; it is simply a long time to
          watch a browser tab do one thing. This is the arithmetic that makes a real scramble set a
          server job.
        </p>
      ) : null}

      {!yieldToPaint ? (
        <p className="-mt-2 rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-amber-200/90">
          With the yield switched off, <code className="font-mono">onProgress</code> still fires
          after every scramble and this component still calls{' '}
          <code className="font-mono">setProgress</code> every time — and the bar below will sit at
          zero until the whole batch is finished, then jump to full. Nothing is broken. Awaiting a
          promise that is already resolved schedules a <em>microtask</em>, and the browser paints
          between macrotasks, never between microtasks. That is the trap this switch exists to
          show, and the reason a naive progress bar over an async loop looks frozen.
        </p>
      ) : null}

      {progress ? (
        <div role="status" aria-live="polite" className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between text-sm">
            <span className="text-neutral-300">
              {progress.done} of {progress.total}
            </span>
            <button
              type="button"
              onClick={() => {
                cancelRef.current = true;
              }}
              className="text-amber-400 underline underline-offset-2 transition hover:text-amber-300"
            >
              Cancel
            </button>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-neutral-800">
            <div
              className="h-full rounded-full bg-emerald-500 transition-[width] duration-150"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-sm text-neutral-500">
            Cancelling throws from <code className="font-mono text-neutral-400">onProgress</code>.
            That is the package&rsquo;s entire cancel path — no{' '}
            <code className="font-mono text-neutral-400">AbortSignal</code>, and therefore no DOM
            type in its public types.
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-4 py-3 font-mono text-sm break-words text-amber-100/90">
          {error}
        </p>
      ) : null}

      {run ? <BatchOutput run={run} /> : null}
      {loopRun ? <LoopOutput run={loopRun} seeded={seed.trim().length > 0} /> : null}

      <section className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-5">
        <h3 className="font-semibold text-neutral-200">
          The bug this API closes, run for real
        </h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          Before 0.13.0 the only way to get {LOOP_DEMO_COUNT} scrambles was to call{' '}
          <code className="font-mono text-neutral-300">generateScramble</code> in a loop. That call
          builds its random source from the seed on <em>every</em> invocation, so with a seed set
          the loop returns the same scramble {LOOP_DEMO_COUNT} times — silently, and identically on
          every machine, which is exactly what makes it hard to notice in a test.
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={runNaiveLoop}
            disabled={busy}
            className="rounded-lg border border-neutral-800 px-4 py-1.5 text-sm transition hover:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Run the old loop {seed.trim() ? 'with this seed' : '(add a seed first)'}
          </button>
          <span className="text-sm text-neutral-600">
            {seed.trim()
              ? `${LOOP_DEMO_COUNT} calls to generateScramble('${event}', { seed })`
              : 'Unseeded, the loop is fine — the trap needs a seed.'}
          </span>
        </div>
      </section>
    </div>
  );
}

function BatchOutput({ run }: { readonly run: BatchRun }) {
  const event = getEvent(run.event);

  if (run.cancelled) {
    return (
      <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <h3 className="text-lg font-semibold text-amber-200">Cancelled</h3>
        <p className="mt-3 text-sm leading-relaxed text-neutral-400">
          The throw propagated out of <code className="font-mono text-neutral-300">onProgress</code>{' '}
          and out of <code className="font-mono text-neutral-300">generateScrambles</code>, which
          stopped drawing there. No partial array comes back — a caller asked for <em>n</em>{' '}
          scrambles, and half of them is not a smaller success. Stopped after{' '}
          {formatMs(run.elapsedMs)}.
        </p>
      </section>
    );
  }

  const moves = run.results.map((result) => result.moves);
  const distinct = new Set(moves).size;
  const lengths = moves.map((value) => value.split(/\s+/).length);
  const meanLength = lengths.reduce((total, value) => total + value, 0) / (lengths.length || 1);
  const perScramble = run.elapsedMs / (run.results.length || 1);
  const copyable = run.results
    .map((result, index) => `${index + 1}. ${(result.scrambles ?? [result.moves]).join('\n   ')}`)
    .join('\n');

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-neutral-100">
          {run.results.length} {event.name} {run.results.length === 1 ? 'scramble' : 'scrambles'}
        </h3>
        <CopyButton value={copyable} label="Copy the batch" />
      </div>

      <ol className="mt-4 flex flex-col gap-2">
        {run.results.map((result, index) => (
          // Draw order is the contract — `result[i]` is the i-th draw, which is
          // what lets a caller map a batch onto (group, attempt) slots. The
          // index is also the only stable key: duplicates are legitimate.
          <li key={index} className="flex gap-3 text-sm">
            <span className="shrink-0 pt-0.5 font-mono text-neutral-600 tabular-nums">
              {String(index + 1).padStart(String(run.results.length).length, '0')}
            </span>
            <span className="min-w-0 font-mono leading-relaxed break-words text-neutral-100">
              {(result.scrambles ?? [result.moves]).map((scramble, cube) => (
                <span key={cube} className="block">
                  {run.cubesPerAttempt !== null ? (
                    <span className="mr-2 text-neutral-600">cube {cube + 1}</span>
                  ) : null}
                  {scramble}
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>

      <dl className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-neutral-800 pt-4 text-sm text-neutral-400">
        <div className="flex gap-1.5">
          <dt className="text-neutral-500">total</dt>
          <dd className="text-neutral-200">{formatMs(run.elapsedMs)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-neutral-500">each</dt>
          <dd className="text-neutral-200">{formatMs(perScramble)}</dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-neutral-500">distinct</dt>
          <dd className="text-neutral-200">
            {distinct} of {run.results.length}
          </dd>
        </div>
        <div className="flex gap-1.5">
          <dt className="text-neutral-500">mean length</dt>
          <dd className="text-neutral-200">{meanLength.toFixed(1)} tokens</dd>
        </div>
        {run.seed ? (
          <div className="flex gap-1.5">
            <dt className="text-neutral-500">seed</dt>
            <dd className="font-mono text-neutral-200">{run.seed}</dd>
          </div>
        ) : null}
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-neutral-500">
        {run.seed ? (
          <>
            One source for the whole batch, so this is reproducible <em>and</em> its members
            differ — press <em>Draw the batch</em> again with the same seed and you get these exact{' '}
            {run.results.length} scrambles back, in this order.
          </>
        ) : (
          <>
            Unseeded, so these came from a cryptographically random source and will not repeat. Put
            a seed in the field to make the batch reproducible.
          </>
        )}{' '}
        {distinct < run.results.length ? (
          <>
            🔴 {run.results.length - distinct} of them repeat, and that is a legitimate outcome
            rather than a bug: each draw is its own uniform draw, and filtering duplicates out would
            bias the distribution.
          </>
        ) : (
          <>
            Duplicates are not removed — each draw is its own uniform draw, so a repeat here would
            be legitimate rather than a bug. None came up this time.
          </>
        )}
      </p>
    </section>
  );
}

function LoopOutput({ run, seeded }: { readonly run: LoopRun; readonly seeded: boolean }) {
  const trapped = seeded && run.distinct === 1;

  return (
    <section
      className={[
        'rounded-xl border p-5',
        trapped ? 'border-amber-500/40 bg-amber-500/5' : 'border-neutral-800 bg-neutral-900/50',
      ].join(' ')}
    >
      <h3
        className={['text-lg font-semibold', trapped ? 'text-amber-200' : 'text-neutral-100'].join(
          ' ',
        )}
      >
        The old loop: {run.distinct} distinct {run.distinct === 1 ? 'scramble' : 'scrambles'} out of{' '}
        {run.count}
      </h3>

      <ol className="mt-4 flex flex-col gap-1.5">
        {run.moves.map((value, index) => (
          <li key={index} className="font-mono text-sm break-words text-neutral-300">
            <span className="mr-3 text-neutral-600 tabular-nums">{index + 1}</span>
            {value}
          </li>
        ))}
      </ol>

      <p className="mt-4 text-sm leading-relaxed text-neutral-400">
        {trapped ? (
          <>
            All {run.count} identical, as promised. Nothing threw, nothing warned, and every machine
            that ran this loop would agree with every other one — which is precisely why the bug
            survives a test suite. The trap is asserted next to the fix in the package&rsquo;s own{' '}
            <code className="font-mono text-neutral-300">generate-scrambles.test.ts</code>, so the
            two cannot drift apart.
          </>
        ) : (
          <>
            Unseeded, the loop behaves: each call builds a fresh cryptographically random source, so
            the draws differ. The failure needs a seed — put one in the field and run it again.
          </>
        )}
      </p>
    </section>
  );
}
