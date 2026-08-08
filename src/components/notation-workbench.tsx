'use client';

import {
  generateScramble,
  invertAlgorithm,
  serializeAlgorithm,
  validateAlgorithm,
  type AlgorithmSyntaxError,
} from '@cubesmith/scrambler';
import { useMemo, useState } from 'react';

import { describeSyntaxError, underlineSpan, type MessageLocale } from '@/examples/syntax-messages';
import {
  FOREIGN_NOTATION_SAMPLES,
  INVALID_SAMPLES,
  VALID_SAMPLES,
  type NotationSample,
} from '@/lib/notation-samples';

import { AlgorithmTree } from './algorithm-tree';
import { CopyButton } from './copy-button';

/**
 * The event this page generates from, and why it is not `333`.
 *
 * 5x5x5 is random-moves per WCA Regulation 4b3e, so it builds no pruning table
 * and answers in under a millisecond from the very first call — on the main
 * thread, in this tab, with nothing to warm up. A `333` button here would freeze
 * the page for about eight seconds to make a point this page is not about.
 *
 * It also happens to be the event whose output exercises the widest notation:
 * `3Rw'` and friends, which `parseMove` cannot read and `parseAlgorithm` can.
 */
const SCRAMBLE_EVENT = '555' as const;

const LOCALE_LABEL: Record<MessageLocale, string> = { en: 'English', fr: 'Français' };

/** One row of the failure catalogue: the input, and what the package said about it. */
interface Inspection {
  readonly sample: NotationSample;
  readonly error: AlgorithmSyntaxError | null;
}

function inspect(sample: NotationSample): Inspection {
  const result = validateAlgorithm(sample.input);
  return { sample, error: result.valid ? null : result.error };
}

/** The fields an error populates, as `key: value` pairs, skipping the ones its code does not carry. */
function payloadOf(error: AlgorithmSyntaxError): readonly (readonly [string, string])[] {
  const entries: (readonly [string, string])[] = [];
  if (error.char !== undefined) entries.push(['char', `"${error.char}"`]);
  if (error.family !== undefined) entries.push(['family', error.family]);
  if (error.outer !== undefined) entries.push(['outer', String(error.outer)]);
  if (error.inner !== undefined) entries.push(['inner', String(error.inner)]);
  if (error.count !== undefined) entries.push(['count', String(error.count)]);
  return entries;
}

export function NotationWorkbench() {
  const [input, setInput] = useState("R U R' U' // sexy move");
  const [locale, setLocale] = useState<MessageLocale>('en');
  const [generating, setGenerating] = useState(false);

  /**
   * Re-validated on every keystroke, which is the whole reason
   * `validateAlgorithm` exists: `parseAlgorithm` would throw once per character
   * typed, and using exceptions as the normal path is what this replaces.
   *
   * Deliberately not wrapped in a `try`. `validateAlgorithm` re-throws anything
   * that is not a syntax error, and that boundary is the useful part — a bug in
   * the package should reach a console and an error boundary, not be rendered to
   * a user as their own typo.
   */
  const validation = useMemo(() => validateAlgorithm(input), [input]);

  const derived = useMemo(() => {
    if (!validation.valid) return null;
    const algorithm = validation.algorithm;
    return {
      algorithm,
      serialized: serializeAlgorithm(algorithm),
      inverse: serializeAlgorithm(invertAlgorithm(algorithm)),
    };
  }, [validation]);

  const failures = useMemo(() => INVALID_SAMPLES.map(inspect), []);
  const foreign = useMemo(() => FOREIGN_NOTATION_SAMPLES.map(inspect), []);
  /** Read off the rows rather than asserted: how many distinct codes this table actually reaches. */
  const distinctCodes = new Set(failures.map((row) => row.error?.reason)).size;

  async function loadScramble() {
    setGenerating(true);
    try {
      const result = await generateScramble(SCRAMBLE_EVENT);
      setInput(result.moves);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="algorithm" className="text-sm font-medium text-neutral-300">
            Algorithm
          </label>

          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">Language of the error message</legend>
            <span className="text-xs text-neutral-500">Message language</span>
            {(['en', 'fr'] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setLocale(option)}
                aria-pressed={locale === option}
                className={[
                  'rounded-md border px-2.5 py-1 text-xs font-medium transition',
                  locale === option
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-600',
                ].join(' ')}
              >
                {LOCALE_LABEL[option]}
              </button>
            ))}
          </fieldset>
        </div>

        <input
          id="algorithm"
          type="text"
          value={input}
          onChange={(changeEvent) => setInput(changeEvent.target.value)}
          spellCheck={false}
          autoComplete="off"
          aria-invalid={!validation.valid}
          aria-describedby="validation-result"
          className={[
            'w-full rounded-lg border bg-neutral-900 px-3 py-2.5 font-mono text-base text-neutral-100 focus:outline-none',
            validation.valid
              ? 'border-neutral-800 focus:border-emerald-500'
              : 'border-amber-500/60 focus:border-amber-400',
          ].join(' ')}
        />

        <div className="flex flex-wrap items-center gap-3 text-sm">
          <button
            type="button"
            onClick={loadScramble}
            disabled={generating}
            className="rounded-lg border border-neutral-700 px-3 py-1.5 font-medium text-neutral-300 transition hover:border-neutral-500 hover:text-white disabled:opacity-50"
          >
            {generating ? 'Generating…' : 'Load a 5x5x5 scramble'}
          </button>
          <button
            type="button"
            onClick={() => setInput('')}
            className="rounded-lg border border-neutral-800 px-3 py-1.5 font-medium text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
          >
            Clear
          </button>
          <p className="text-neutral-500">
            5x5x5 rather than 3x3x3 on purpose: it is random-moves, so it builds no table and cannot
            freeze this tab — and its <code className="font-mono text-neutral-300">3Rw&apos;</code>{' '}
            output is notation <code className="font-mono text-neutral-300">parseMove</code> cannot
            read.
          </p>
        </div>
      </div>

      <section id="validation-result" aria-live="polite" className="flex flex-col gap-4">
        {validation.valid && derived ? (
          <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-lg font-semibold text-neutral-100">Valid notation</h2>
              <span className="rounded-full border border-emerald-500/50 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
                {derived.algorithm.nodes.length} node
                {derived.algorithm.nodes.length === 1 ? '' : 's'}
              </span>
            </div>

            <dl className="mt-4 flex flex-col gap-3">
              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  serializeAlgorithm
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-neutral-50">{derived.serialized || '(empty)'}</span>
                  {/*
                    Fires for every difference, not only a spelling one: a
                    dropped comment and collapsed whitespace land here too. The
                    wording says "differs" rather than "normalised" for exactly
                    that reason — three spellings resolve at parse time, and
                    comments are not one of them.
                  */}
                  {derived.serialized && derived.serialized !== input.trim() ? (
                    <span className="text-xs text-amber-300/80">
                      differs from what you typed — comments are dropped, whitespace collapses, and
                      three spellings resolve at parse time
                    </span>
                  ) : null}
                </dd>
              </div>

              <div>
                <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                  invertAlgorithm
                </dt>
                <dd className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="font-mono text-neutral-50">{derived.inverse || '(empty)'}</span>
                  {derived.inverse ? <CopyButton value={derived.inverse} label="Copy inverse" /> : null}
                </dd>
              </div>
            </dl>

            <div className="mt-5 border-t border-neutral-800 pt-4">
              <h3 className="text-xs tracking-wide text-neutral-500 uppercase">
                parseAlgorithm — the tree
              </h3>
              <div className="mt-3">
                <AlgorithmTree algorithm={derived.algorithm} />
              </div>
            </div>
          </div>
        ) : !validation.valid ? (
          <ErrorPanel error={validation.error} input={input} locale={locale} />
        ) : null}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Everything the grammar accepts
        </h2>
        <p className="text-sm leading-relaxed text-neutral-400">
          One row per construct. None of these needs a pruning table, so every one of them is
          instant, in a browser, on the first call — which is why this page works on the static
          build with no server behind it.
        </p>
        <SampleList samples={VALID_SAMPLES} onPick={setInput} active={input} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Every way it can fail
        </h2>
        <p className="text-sm leading-relaxed text-neutral-400">
          {distinctCodes} distinct <code className="font-mono text-neutral-200">reason</code> codes,
          out of the twenty the package documents. The twentieth,{' '}
          <code className="font-mono text-neutral-200">unexpected-token</code>, is the deliberate
          residual — nothing the parser currently produces reaches it, so there is no row to write
          for it. Every code, span and payload in this table is read from the package as the page
          renders; the only thing kept in this repo is the input and a sentence about it.
        </p>

        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-neutral-800 text-xs tracking-wide text-neutral-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Input
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  reason
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  offset / length
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  carries
                </th>
              </tr>
            </thead>
            <tbody>
              {failures.map(({ sample, error }) => (
                <tr key={sample.input} className="border-b border-neutral-800/60 last:border-b-0">
                  <td className="px-4 py-2.5 align-top">
                    <button
                      type="button"
                      onClick={() => setInput(sample.input)}
                      className="font-mono text-neutral-100 underline decoration-neutral-700 underline-offset-4 transition hover:decoration-emerald-400"
                    >
                      {sample.input}
                    </button>
                    <p className="mt-1 text-xs leading-relaxed text-neutral-500">{sample.note}</p>
                  </td>
                  <td className="px-4 py-2.5 align-top font-mono text-xs text-amber-300">
                    {error ? error.reason : '— parsed cleanly'}
                  </td>
                  <td className="px-4 py-2.5 align-top font-mono text-xs whitespace-nowrap text-neutral-400">
                    {error ? `${error.offset} / ${error.length}` : '—'}
                  </td>
                  <td className="px-4 py-2.5 align-top font-mono text-xs text-neutral-400">
                    {error && payloadOf(error).length > 0
                      ? payloadOf(error)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(', ')
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Notation this grammar refuses
        </h2>
        <p className="text-sm leading-relaxed text-neutral-400">
          The package generates scrambles for Megaminx, Clock, Pyraminx, Skewb and Square-1, and
          cannot parse any of them. That is a decision, not a gap: a Pyraminx{' '}
          <code className="font-mono text-neutral-200">2</code> means counterclockwise rather than a
          half turn, so one shared amount field would be actively wrong. Parse a scramble only when
          you know it came from a cube event.
        </p>
        <SampleList samples={FOREIGN_NOTATION_SAMPLES} onPick={setInput} active={input} />
        <p className="text-xs text-neutral-500">
          Each of those throws{' '}
          <code className="font-mono text-neutral-400">
            {foreign[0]?.error ? foreign[0].error.name : 'AlgorithmSyntaxError'}
          </code>{' '}
          — click one and read the message.
        </p>
      </section>
    </div>
  );
}

function SampleList({
  samples,
  onPick,
  active,
}: {
  readonly samples: readonly NotationSample[];
  readonly onPick: (input: string) => void;
  readonly active: string;
}) {
  return (
    <ul className="flex flex-col gap-1.5">
      {samples.map((sample) => (
        <li key={sample.input} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => onPick(sample.input)}
            aria-pressed={sample.input === active}
            className={[
              'rounded-md border px-2.5 py-1 font-mono text-sm transition',
              sample.input === active
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-200'
                : 'border-neutral-800 text-neutral-200 hover:border-neutral-600',
            ].join(' ')}
          >
            {sample.input}
          </button>
          <span className="text-sm text-neutral-500">{sample.note}</span>
        </li>
      ))}
    </ul>
  );
}

function ErrorPanel({
  error,
  input,
  locale,
}: {
  readonly error: AlgorithmSyntaxError;
  readonly input: string;
  readonly locale: MessageLocale;
}) {
  const span = underlineSpan(error);
  const payload = payloadOf(error);

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-amber-200">Not valid notation</h2>
        <span className="rounded-full border border-amber-500/50 px-2.5 py-0.5 font-mono text-xs text-amber-300">
          {error.reason}
        </span>
      </div>

      {/*
        A compiler's rendering, because it is the one that survives every case:
        the input echoed, and a caret line under the offending span. `length` is
        what makes the multi-character form possible at all — 0.10.0 gave you a
        single offset and no way to know how much of the token was wrong.
      */}
      <pre className="mt-4 overflow-x-auto text-sm leading-snug">
        <code className="font-mono text-neutral-100">{input || ' '}</code>
        {'\n'}
        <code aria-hidden="true" className="font-mono text-amber-400">
          {' '.repeat(span.start)}
          {'^'.repeat(span.width)}
        </code>
      </pre>

      <p className="mt-4 leading-relaxed text-amber-100">{describeSyntaxError(error, locale)}</p>

      <p className="mt-2 text-xs text-neutral-500">
        {span.missing
          ? `length is 0 — the text is missing at character ${span.start} rather than wrong, so that is a caret and not an underline.`
          : `Characters ${span.start} to ${span.start + span.width - 1}.`}
      </p>

      <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-amber-500/20 pt-4 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="font-mono text-xs text-neutral-500">reason</dt>
        <dd className="font-mono text-xs text-neutral-300">{error.reason}</dd>

        <dt className="font-mono text-xs text-neutral-500">offset / length</dt>
        <dd className="font-mono text-xs text-neutral-300">
          {error.offset} / {error.length}
        </dd>

        {payload.map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="font-mono text-xs text-neutral-500">{key}</dt>
            <dd className="font-mono text-xs text-neutral-300">{value}</dd>
          </div>
        ))}

        <dt className="font-mono text-xs text-neutral-500">message</dt>
        <dd className="font-mono text-xs break-words text-neutral-400">{error.message}</dd>
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-neutral-400">
        The sentence above the table is written in{' '}
        <code className="font-mono text-neutral-200">src/examples/syntax-messages.ts</code>, in this
        repo, from <code className="font-mono text-neutral-200">reason</code> and the fields beside
        it. The package ships no message strings beyond{' '}
        <code className="font-mono text-neutral-200">.message</code> — the English one in the table,
        which is the right thing to log and the wrong thing to show a user — and it never will.
        Switching the language above changes nothing about what the package returned.
      </p>
    </div>
  );
}
