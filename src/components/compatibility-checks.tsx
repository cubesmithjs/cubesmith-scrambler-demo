'use client';

import { generateScramble, validateScramble } from '@cubesmith/scrambler';
import { drawScramble, scrambleImageToSvg } from '@cubesmith/scrambler/draw';
import { useMemo, useState } from 'react';

import { LEGACY_CLOCK_SCRAMBLE, MODERN_CLOCK_SCRAMBLE } from '@/lib/draw-samples';

import { ScrambleDrawing } from './scramble-drawing';

/**
 * Every spelling of a Square-1 move pair this package accepts. Only the first is
 * what it *emits* as of 0.13.0 — the rest are the compatibility half, and they
 * are here because "the parser was not narrowed" is a claim, and a claim about a
 * parser can be run.
 */
const SQUARE1_SPELLINGS: readonly { readonly text: string; readonly note: string }[] = [
  { text: '(-3,-4)', note: 'what 0.13.0 emits — TNoodle’s spelling verbatim' },
  { text: '(-3, -4)', note: 'what this package emitted before 0.13.0' },
  { text: '( -3 , -4 )', note: 'spaces nobody writes on purpose' },
  { text: '(1,0) / (-3, -4)', note: 'both spellings in one string' },
];

function tokenCount(scramble: string): number {
  return scramble.trim().split(/\s+/).length;
}

/**
 * The measured bands from the package's own changelog, for the event 0.14.0
 * spent its release on. `live` is filled in by the button below, on your machine.
 */
const MOVE_COUNT_ROWS: readonly {
  readonly label: string;
  readonly range: string;
  readonly mean: string;
  readonly emphasis?: boolean;
}[] = [
  { label: '0.13.0 and earlier', range: '94–205', mean: '137.5' },
  { label: '0.14.0', range: '56–114', mean: '73.8 (median 69)', emphasis: true },
  { label: 'TNoodle-WCA-1.2.3', range: '42–46', mean: '—' },
];

export function CompatibilityChecks() {
  const clock = useMemo(() => {
    const legacy = validateScramble('clock', LEGACY_CLOCK_SCRAMBLE);
    const modern = validateScramble('clock', MODERN_CLOCK_SCRAMBLE);
    const legacyImage = drawScramble('clock', LEGACY_CLOCK_SCRAMBLE);
    const modernImage = drawScramble('clock', MODERN_CLOCK_SCRAMBLE);
    return {
      legacyValid: legacy.valid,
      modernValid: modern.valid,
      legacyImage,
      modernImage,
      // Serializing both and comparing is the strongest available statement of
      // "the same state": if a single dial or pin differed, one character would.
      sameDrawing:
        scrambleImageToSvg(legacyImage) === scrambleImageToSvg(modernImage),
    };
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-neutral-100">
          Clock: fifteen tokens out, nineteen still in
        </h3>

        <div className="flex flex-col gap-3">
          <ScrambleRow
            label="0.13.0 and earlier"
            scramble={LEGACY_CLOCK_SCRAMBLE}
            valid={clock.legacyValid}
          />
          <ScrambleRow
            label="0.14.0"
            scramble={MODERN_CLOCK_SCRAMBLE}
            valid={clock.modernValid}
            emphasis
          />
        </div>

        <p className="text-sm leading-relaxed text-neutral-400">
          The old form appended bare pin names describing the final pins-up state — an older
          convention TNoodle never used, which made the output 15 to 19 tokens and made it differ
          from the official string <em>in kind</em> rather than in length. 0.14.0 stops writing them
          and ends on the second <code className="font-mono text-neutral-300">ALLn±</code>, exactly
          as TNoodle-WCA-1.2.3 does.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { title: 'The old nineteen-token string', image: clock.legacyImage },
            { title: 'The new fifteen-token string', image: clock.modernImage },
          ].map((panel) => (
            <figure
              key={panel.title}
              className="flex flex-col items-center gap-3 rounded-xl border border-neutral-800 bg-neutral-900/50 p-4"
            >
              <ScrambleDrawing
                image={panel.image}
                title={panel.title}
                className="w-full max-w-xs"
              />
              <figcaption className="text-center text-xs text-neutral-500">{panel.title}</figcaption>
            </figure>
          ))}
        </div>

        <p
          className={[
            'rounded-lg border px-4 py-3 text-sm leading-relaxed',
            clock.sameDrawing
              ? 'border-emerald-500/40 bg-emerald-500/5 text-emerald-200/90'
              : 'border-amber-500/40 bg-amber-500/5 text-amber-200/90',
          ].join(' ')}
        >
          {clock.sameDrawing ? (
            <>
              Both strings parsed, and both drew to a byte-identical SVG — checked in your browser
              just now, not asserted here. Dropping the pin declaration changed the text and not the
              puzzle, which is what &ldquo;cosmetic&rdquo; has to mean before it is worth saying.
            </>
          ) : (
            <>
              The two drawings differ, which contradicts what this page claims. Treat the paragraph
              above as wrong rather than the check.
            </>
          )}
        </p>

        <p className="text-sm leading-relaxed text-neutral-400">
          🔴 <strong className="text-neutral-300">Emit narrow, accept wide.</strong> Both boxes
          above validate, and both draw. A scramble already sitting in a database was written the
          old way, and rejecting it in a later version would turn a cosmetic change into data loss.
          The package re-parses 500 legacy strings, re-prints them byte-identically, and checks they
          reach the state they always did.
        </p>

        <p className="text-sm leading-relaxed text-neutral-400">
          There is a third reason the old format had to go, and it is a genuine defect rather than a
          preference: &ldquo;leave all four pins up&rdquo; is named by the <em>empty</em>{' '}
          declaration, which renders as the empty string and disappears. As an array of tokens the
          intent survived; as <strong className="text-neutral-300">text</strong> — the only form a
          competitor or a database ever sees — it did not. One draw in sixteen printed a scramble
          whose declared pin state was not the one drawn.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h3 className="text-lg font-semibold text-neutral-100">
          Square-1: one space, and why it mattered
        </h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          0.13.0 emits <code className="font-mono text-neutral-300">(-3,-4)</code> with no space
          after the comma, which is TNoodle&rsquo;s spelling verbatim. Cosmetic — and cosmetics are
          the entire function of a scramble sheet. A competitor who has read a thousand of them
          notices, and until this change any line-by-line comparison between the two programs
          reported <em>every</em> row as different.
        </p>
        <div className="flex flex-col gap-2">
          {SQUARE1_SPELLINGS.map((spelling, index) => (
            <ScrambleRow
              key={spelling.text}
              label={spelling.note}
              scramble={spelling.text}
              valid={validateScramble('sq1', spelling.text).valid}
              emphasis={index === 0}
            />
          ))}
        </div>
        <p className="text-sm leading-relaxed text-neutral-400">
          All four still parse, with or without the trailing slash. The emitted set and the accepted
          set are deliberately different sizes, and the package pins each spelling in a test as
          intentional rather than incidental.
        </p>
      </section>

      <FourByFourPanel />
    </div>
  );
}

function ScrambleRow({
  label,
  scramble,
  valid,
  emphasis,
}: {
  readonly label: string;
  readonly scramble: string;
  readonly valid: boolean;
  readonly emphasis?: boolean;
}) {
  return (
    <div
      className={[
        'flex flex-col gap-1.5 rounded-lg border px-4 py-3',
        emphasis ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-neutral-800',
      ].join(' ')}
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
        <span className={emphasis ? 'font-medium text-emerald-300' : 'text-neutral-500'}>
          {label}
        </span>
        <span className="text-neutral-600">{tokenCount(scramble)} tokens</span>
        <span
          className={[
            'rounded-full border px-2 py-0.5 font-mono',
            valid ? 'border-emerald-500/50 text-emerald-300' : 'border-amber-500/50 text-amber-300',
          ].join(' ')}
        >
          {valid ? 'validateScramble → valid' : 'validateScramble → rejected'}
        </span>
      </div>
      <p className="font-mono text-sm break-words text-neutral-100">{scramble}</p>
    </div>
  );
}

/**
 * The 4x4x4 length claim, measured here rather than quoted.
 *
 * This one has a real cost — a cold 4x4x4 is seconds of blocked main thread —
 * so it is behind a button that says so, and it is the only thing on this page
 * that does not run on load.
 */
function FourByFourPanel() {
  const [lengths, setLengths] = useState<readonly number[]>([]);
  const [busy, setBusy] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  async function measure() {
    setBusy(true);
    try {
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const startedAt = performance.now();
      const result = await generateScramble('444');
      setElapsedMs(performance.now() - startedAt);
      setLengths((previous) => [...previous, result.moves.trim().split(/\s+/).length]);
    } finally {
      setBusy(false);
    }
  }

  const mean =
    lengths.length > 0 ? lengths.reduce((total, value) => total + value, 0) / lengths.length : null;

  return (
    <section className="flex flex-col gap-4">
      <h3 className="text-lg font-semibold text-neutral-100">
        4x4x4: 137 moves became 74
      </h3>
      <p className="text-sm leading-relaxed text-neutral-400">
        A scramble a delegate could not practically apply is now one they can. Five changes did it,
        each measured on a fixed set of states: cancellation across the phase joins, choosing the
        reduction <em>route</em> rather than repairing whatever parity the first one lands in,
        shortest-first parity gadgets, searching the edge pairing for total word length instead of
        edges-paired-per-step, and — the largest single win — choosing OLL parity away at phase 1
        instead of fixing it afterwards with a gadget and a whole fresh pairing.
      </p>

      <div className="overflow-x-auto rounded-xl border border-neutral-800">
        <table className="w-full min-w-[26rem] text-left text-sm">
          <thead className="border-b border-neutral-800 text-neutral-400">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Version
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Moves
              </th>
              <th scope="col" className="px-4 py-2.5 font-medium">
                Mean
              </th>
            </tr>
          </thead>
          <tbody>
            {MOVE_COUNT_ROWS.map((row) => (
              <tr key={row.label} className="border-b border-neutral-900 last:border-b-0">
                <td
                  className={[
                    'px-4 py-2.5',
                    row.emphasis ? 'font-medium text-emerald-300' : 'text-neutral-400',
                  ].join(' ')}
                >
                  {row.label}
                </td>
                <td className="px-4 py-2.5 font-mono text-neutral-300">{row.range}</td>
                <td className="px-4 py-2.5 font-mono text-neutral-300">{row.mean}</td>
              </tr>
            ))}
            {mean !== null ? (
              <tr className="bg-emerald-500/5">
                <td className="px-4 py-2.5 font-medium text-emerald-300">
                  yours, {lengths.length} {lengths.length === 1 ? 'draw' : 'draws'}
                </td>
                <td className="px-4 py-2.5 font-mono text-neutral-300">
                  {Math.min(...lengths)}&ndash;{Math.max(...lengths)}
                </td>
                <td className="px-4 py-2.5 font-mono text-neutral-300">{mean.toFixed(1)}</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={measure}
          disabled={busy}
          className="rounded-lg border border-neutral-800 px-4 py-1.5 text-sm transition hover:border-neutral-600 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {busy ? 'Generating…' : lengths.length === 0 ? 'Generate one and count' : 'Draw another'}
        </button>
        <span className="text-sm text-neutral-500">
          {lengths.length === 0
            ? 'Heads up: the first one builds the 4x4x4 tables on the main thread and will freeze this tab for several seconds. No spinner can animate through it.'
            : elapsedMs !== null
              ? `Last draw took ${elapsedMs >= 1000 ? `${(elapsedMs / 1000).toFixed(2)} s` : `${Math.round(elapsedMs)} ms`}. The tables are warm now.`
              : null}
        </span>
      </div>

      <p className="rounded-lg border border-neutral-800 bg-neutral-900/50 px-4 py-3 text-sm leading-relaxed text-neutral-400">
        🔴 <strong className="text-neutral-200">The random distribution is unchanged, and this is
        the sentence to read before any other.</strong>{' '}
        No scramble this package produced before 0.14.0 was invalid. 4x4x4 drew a uniformly random
        state, solved it and printed the inverse then, and does exactly that now — the solver simply
        got better at finding a short <em>solution</em> to the same drawn state. The χ² check over
        the sticker distribution reads 4.89 against df 5 after these changes where it read 5.32
        before, and the untouched 3x3x3 control reads 3.79 to 5.22 across the same runs, which is
        the noise floor. <strong className="text-neutral-200">The old scrambles were long, not
        wrong.</strong>
      </p>

      <p className="text-sm leading-relaxed text-neutral-400">
        It is still longer than the official program&rsquo;s, and the package states that gap as an
        accepted, measured ceiling rather than an open task. Worth noting too that it got{' '}
        <em>faster</em>, which a solver that searches harder usually does not: a parity pass costs a
        whole fresh pairing, and 23 solves in 30 no longer have one.
      </p>
    </section>
  );
}
