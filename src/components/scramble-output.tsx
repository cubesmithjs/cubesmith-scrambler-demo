import type { Run } from '@/lib/api';
import { getEvent } from '@/lib/events';

import { CopyButton } from './copy-button';

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms >= 10) return `${Math.round(ms)} ms`;
  return `${ms.toFixed(2)} ms`;
}

/**
 * `quality` is reported by the package per event, and it is not a ranking.
 * WCA Regulation 4b3e *requires* random-moves for 5x5x5, 6x6x6, 7x7x7 and
 * Megaminx, so for those events random-moves is the conforming method and a
 * random-state scramble would be the wrong one.
 */
const QUALITY_NOTE = {
  'random-state': 'A uniformly random legal state, solved near-optimally and inverted.',
  'random-moves':
    'A fixed-length sequence of random moves. This is what WCA Regulation 4b3e requires for 5x5x5, 6x6x6, 7x7x7 and Megaminx — not a weaker fallback. For these events a random-state scramble would be the non-conforming one.',
} as const;

export function ScrambleOutput({ run }: { readonly run: Run }) {
  const event = getEvent(run.event);

  if (run.error) {
    const unimplemented = run.error.kind === 'unimplemented';

    return (
      <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-amber-200">{event.name}</h2>
          <span className="rounded-full border border-amber-500/50 px-2.5 py-0.5 font-mono text-xs text-amber-300">
            {unimplemented ? 'UnimplementedEventError' : 'error'}
          </span>
        </div>

        <p className="mt-3 font-mono text-sm break-words text-amber-100/90">{run.error.message}</p>

        {unimplemented ? (
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            This is the expected result, not a bug in the demo. The package throws a typed error for
            events it cannot generate rather than returning a placeholder scramble, and the page
            caught it on the {run.mode}. Every other event in the picker works.
          </p>
        ) : null}
      </section>
    );
  }

  if (!run.result) return null;

  return (
    <section className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-100">{event.name}</h2>
        <span
          className={[
            'rounded-full border px-2.5 py-0.5 font-mono text-xs',
            run.result.quality === 'random-state'
              ? 'border-emerald-500/50 text-emerald-300'
              : 'border-sky-500/50 text-sky-300',
          ].join(' ')}
        >
          {run.result.quality}
        </span>
      </div>

      <p
        className="mt-4 font-mono text-lg leading-relaxed tracking-wide break-words whitespace-pre-wrap text-neutral-50 sm:text-xl"
        data-testid="scramble"
      >
        {run.result.moves}
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-neutral-800 pt-4">
        <dl className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-neutral-400">
          <div className="flex gap-1.5">
            <dt className="text-neutral-500">ran on</dt>
            <dd className="text-neutral-200">{run.mode}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="text-neutral-500">generate</dt>
            <dd className="text-neutral-200">{formatMs(run.elapsedMs)}</dd>
          </div>
          {run.roundTripMs !== null ? (
            <div className="flex gap-1.5">
              <dt className="text-neutral-500">round trip</dt>
              <dd className="text-neutral-200">{formatMs(run.roundTripMs)}</dd>
            </div>
          ) : null}
          <div className="flex gap-1.5">
            <dt className="text-neutral-500">table</dt>
            <dd className="text-neutral-200">
              {event.table === null ? 'none needed' : run.cold ? 'built just now' : 'already warm'}
            </dd>
          </div>
          {run.seed ? (
            <div className="flex gap-1.5">
              <dt className="text-neutral-500">seed</dt>
              <dd className="font-mono text-neutral-200">{run.seed}</dd>
            </div>
          ) : null}
        </dl>

        <CopyButton value={run.result.moves} label="Copy scramble" />
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-500">
        {QUALITY_NOTE[run.result.quality]}
      </p>
    </section>
  );
}
