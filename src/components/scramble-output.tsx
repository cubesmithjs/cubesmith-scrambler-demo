import { MAX_SCRAMBLE_COUNT } from '@cubesmith/scrambler';

import type { Run } from '@/lib/api';
import { getEvent } from '@/lib/events';

import { CopyButton } from './copy-button';

/**
 * The real class name behind each flattened error kind, shown as the badge.
 *
 * Naming the class is the useful part for someone deciding what to `catch`,
 * and it survives the round trip through `/api/scramble` — where the class
 * itself does not.
 */
const ERROR_CLASS = {
  unimplemented: 'UnimplementedEventError',
  'invalid-count': 'InvalidScrambleCountError',
  other: 'error',
} as const;

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  if (ms >= 10) return `${Math.round(ms)} ms`;
  return `${ms.toFixed(2)} ms`;
}

/**
 * How many whitespace-separated tokens the scramble is.
 *
 * "Tokens" rather than "moves" because for five of the seventeen events they
 * are not the same thing: a Clock token is a dial turn, a Square-1 token is a
 * pair of layer twists. Counting them is still the useful number — it is how
 * much a delegate has to physically apply — which is why this appears at all,
 * and 0.14.0 is the reason it is worth showing: 4x4x4 went from a mean of 137
 * tokens to 74, and Clock from up to 19 down to exactly 15.
 */
function tokenCount(scramble: string): number {
  const trimmed = scramble.trim();
  return trimmed === '' ? 0 : trimmed.split(/\s+/).length;
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
    const errorName = ERROR_CLASS[run.error.kind];

    return (
      <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-semibold text-amber-200">{event.name}</h2>
          <span className="rounded-full border border-amber-500/50 px-2.5 py-0.5 font-mono text-xs text-amber-300">
            {errorName}
          </span>
        </div>

        <p className="mt-3 font-mono text-sm break-words text-amber-100/90">{run.error.message}</p>

        {run.error.kind === 'unimplemented' ? (
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            This is the expected result, not a bug in the demo. The package throws a typed error for
            events it cannot generate rather than returning a placeholder scramble, and the page
            caught it on the {run.mode}. Every other event in the picker works.
          </p>
        ) : null}

        {run.error.kind === 'invalid-count' ? (
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">
            Deliberate — you asked for it. {event.name} generates fine; what it will not do is accept{' '}
            <code className="font-mono text-neutral-200">count: {run.count}</code>, because one
            attempt covers one cube. The package raises a typed error rather than ignoring the
            option, so a caller can never believe they asked for {run.count} scrambles and quietly
            received one. The same error covers a count outside 1&ndash;{MAX_SCRAMBLE_COUNT}. Caught
            on the {run.mode}.
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

      {/*
        `scrambles` is present only for a multi-scramble event, and a count of
        one is an ordinary single scramble — so the numbered list appears only
        when there is genuinely more than one cube to number. The other sixteen
        events take the `moves` branch and render exactly as they always have.
      */}
      {run.result.scrambles && run.result.scrambles.length > 1 ? (
        <>
          <ol className="mt-4 flex flex-col gap-3" data-testid="scramble-list">
            {run.result.scrambles.map((scramble, index) => (
              <li
                // Draws are independent and deliberately not de-duplicated, so
                // two cubes can legitimately carry the same scramble. The index
                // is the only stable identity here; the value is not unique.
                key={index}
                className="flex gap-3 border-b border-neutral-800/70 pb-3 last:border-b-0 last:pb-0"
              >
                <span className="shrink-0 pt-0.5 font-mono text-sm text-neutral-500 tabular-nums">
                  {String(index + 1).padStart(String(run.result?.scrambles?.length ?? 0).length, '0')}
                </span>
                <span className="font-mono leading-relaxed tracking-wide break-words whitespace-pre-wrap text-neutral-50">
                  {scramble}
                </span>
              </li>
            ))}
          </ol>

          <p className="mt-3 text-sm text-neutral-500">
            {run.result.scrambles.length} independent scrambles, one per cube. Cube 1 is also{' '}
            <code className="font-mono text-neutral-300">result.moves</code>.
          </p>
        </>
      ) : (
        <p
          className="mt-4 font-mono text-lg leading-relaxed tracking-wide break-words whitespace-pre-wrap text-neutral-50 sm:text-xl"
          data-testid="scramble"
        >
          {run.result.moves}
        </p>
      )}

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
          {/*
            Present for every event, not only the two 0.14.0 shortened, because
            a number that appears only when it flatters the package is not a
            measurement. For a multi-scramble attempt it is the mean per cube.
          */}
          <div className="flex gap-1.5">
            <dt className="text-neutral-500">length</dt>
            <dd className="text-neutral-200">
              {run.result.scrambles && run.result.scrambles.length > 1
                ? `${(
                    run.result.scrambles.reduce((total, value) => total + tokenCount(value), 0) /
                    run.result.scrambles.length
                  ).toFixed(1)} tokens/cube`
                : `${tokenCount(run.result.moves)} tokens`}
            </dd>
          </div>
          {run.seed ? (
            <div className="flex gap-1.5">
              <dt className="text-neutral-500">seed</dt>
              <dd className="font-mono text-neutral-200">{run.seed}</dd>
            </div>
          ) : null}
          {run.count !== null ? (
            <div className="flex gap-1.5">
              <dt className="text-neutral-500">count</dt>
              <dd className="font-mono text-neutral-200">{run.count}</dd>
            </div>
          ) : null}
        </dl>

        {/* Copy every cube for a multi-blind attempt — copying only the first would be a trap. */}
        {run.result.scrambles && run.result.scrambles.length > 1 ? (
          <CopyButton value={run.result.scrambles.join('\n')} label="Copy all scrambles" />
        ) : (
          <CopyButton value={run.result.moves} label="Copy scramble" />
        )}
      </div>

      <p className="mt-4 text-sm leading-relaxed text-neutral-500">
        {QUALITY_NOTE[run.result.quality]}
      </p>
    </section>
  );
}
