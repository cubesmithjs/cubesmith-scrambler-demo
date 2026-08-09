'use client';

import {
  generateScramble,
  invertAlgorithm,
  serializeAlgorithm,
  validateAlgorithm,
  validateScramble,
  type ScrambleValidation,
} from '@cubesmith/scrambler';
import { useMemo, useState } from 'react';

import { describeScrambleError, scramblePayloadOf } from '@/examples/scramble-messages';
import { describeSyntaxError, underlineSpan, type MessageLocale } from '@/examples/syntax-messages';
import {
  catalogueFor,
  foreignNotationFor,
  FOREIGN_NOTATION_SAMPLES,
  INVALID_SAMPLES,
  VALID_SAMPLES,
  type NotationSample,
} from '@/lib/notation-samples';
import { loadWarningFor, NOTATION_OPTIONS, type NotationOption } from '@/lib/notations';

import { AlgorithmTree } from './algorithm-tree';
import { CopyButton } from './copy-button';

const LOCALE_LABEL: Record<MessageLocale, string> = { en: 'English', fr: 'Français' };

const CUBE_OPTION = NOTATION_OPTIONS[0]!;

/**
 * The message, the payload and the span for whichever of the two error classes
 * came back — chosen by `notation`, which is the discriminant the package put
 * on the result for exactly this.
 *
 * 🔴 Note what is *not* shared: the sentence. `describeSyntaxError` and
 * `describeScrambleError` are two tables over two unions, and that is the
 * 0.12.0 design decision felt from the consumer side. What *is* shared is
 * `underlineSpan` — both classes carry `offset` and `length` with the same
 * contract, so the caret is drawn once.
 */
function present(validation: ScrambleValidation, locale: MessageLocale) {
  if (validation.valid) return null;

  if (validation.notation === 'cube') {
    const error = validation.error;
    const payload: (readonly [string, string])[] = [];
    if (error.char !== undefined) payload.push(['char', `"${error.char}"`]);
    if (error.family !== undefined) payload.push(['family', error.family]);
    if (error.outer !== undefined) payload.push(['outer', String(error.outer)]);
    if (error.inner !== undefined) payload.push(['inner', String(error.inner)]);
    if (error.count !== undefined) payload.push(['count', String(error.count)]);
    return {
      error,
      reason: error.reason as string,
      sentence: describeSyntaxError(error, locale),
      payload: payload as readonly (readonly [string, string])[],
      className: 'AlgorithmSyntaxError',
    };
  }

  const error = validation.error;
  return {
    error,
    reason: error.reason as string,
    sentence: describeScrambleError(error, locale),
    payload: scramblePayloadOf(error),
    className: 'ScrambleSyntaxError',
  };
}

export function NotationWorkbench() {
  const [option, setOption] = useState<NotationOption>(CUBE_OPTION);
  const [input, setInput] = useState("R U R' U' // sexy move");
  const [locale, setLocale] = useState<MessageLocale>('en');
  const [generating, setGenerating] = useState(false);

  const catalogue = catalogueFor(option.notation);

  /**
   * One call for all six grammars, re-run on every keystroke.
   *
   * `validateScramble` takes the **event**, not a notation, because the event
   * is what a caller actually has — a row in a database, a picker value, a
   * `result.event` from `generateScramble`. Six buttons rather than seventeen
   * is this page's editorial choice; the package's parameter is the event.
   *
   * Deliberately not wrapped in a `try`. It re-throws anything that is not a
   * syntax error, and that boundary is the useful part.
   */
  const validation = useMemo(
    () => validateScramble(option.event, input),
    [option.event, input],
  );

  /**
   * The tree, the serialization and the inverse — **cube only**, and by a
   * *second* call.
   *
   * This is the shape of 0.12.0's central decision, made visible rather than
   * described. `validateScramble` answers "is this valid for this event" and
   * hands back no parsed form, because there is no shared tree to hand back:
   * five notations, five node types, and a Pyraminx `2` means counterclockwise
   * rather than a half turn, so one merged `amount` would be a lie. A caller
   * who wants the cube tree asks the cube-specific function for it, which is
   * one extra parse of a string that is microseconds long.
   */
  const derived = useMemo(() => {
    if (option.notation !== 'cube' || !validation.valid) return null;
    const parsed = validateAlgorithm(input);
    if (!parsed.valid) return null;
    return {
      algorithm: parsed.algorithm,
      serialized: serializeAlgorithm(parsed.algorithm),
      inverse: serializeAlgorithm(invertAlgorithm(parsed.algorithm)),
    };
  }, [option.notation, validation, input]);

  const invalidSamples = catalogue ? catalogue.invalid : INVALID_SAMPLES;
  const validSamples = catalogue ? catalogue.valid : VALID_SAMPLES;

  const failures = useMemo(
    () =>
      invalidSamples.map((sample) => ({
        sample,
        validation: validateScramble(option.event, sample.input),
      })),
    [invalidSamples, option.event],
  );
  /** Read off the rows rather than asserted: how many distinct codes this table actually reaches. */
  const distinctCodes = new Set(
    failures.map((row) => (row.validation.valid ? null : row.validation.error.reason)),
  ).size;

  const foreign = useMemo(
    () => FOREIGN_NOTATION_SAMPLES.map((sample) => ({ sample, ...inspectAsCube(sample) })),
    [],
  );

  const loadWarning = loadWarningFor(option);

  function pickNotation(next: NotationOption) {
    setOption(next);
    // Land on something this grammar accepts. Switching to Clock and being told
    // your cube algorithm is not a Clock token is true and useless.
    const first = (catalogueFor(next.notation) ?? { valid: VALID_SAMPLES }).valid[0];
    if (first) setInput(first.input);
  }

  async function loadScramble() {
    setGenerating(true);
    try {
      const result = await generateScramble(option.event);
      setInput(result.moves);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-medium text-neutral-300">Notation</legend>
          <div className="flex flex-wrap gap-2">
            {NOTATION_OPTIONS.map((candidate) => (
              <button
                key={candidate.notation}
                type="button"
                onClick={() => pickNotation(candidate)}
                aria-pressed={candidate.notation === option.notation}
                className={[
                  'rounded-lg border px-3 py-1.5 text-sm font-medium transition',
                  candidate.notation === option.notation
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200',
                ].join(' ')}
              >
                {candidate.label}
              </button>
            ))}
          </div>
          <p className="text-sm leading-relaxed text-neutral-500">
            {option.blurb}{' '}
            <span className="text-neutral-400">
              Validated as{' '}
              <code className="font-mono text-neutral-300">
                validateScramble(&apos;{option.event}&apos;, …)
              </code>{' '}
              — {option.covers}.
            </span>
          </p>
        </fieldset>

        <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="algorithm" className="text-sm font-medium text-neutral-300">
            {option.label} scramble
          </label>

          <fieldset className="flex items-center gap-2">
            <legend className="sr-only">Language of the error message</legend>
            <span className="text-xs text-neutral-500">Message language</span>
            {(['en', 'fr'] as const).map((candidate) => (
              <button
                key={candidate}
                type="button"
                onClick={() => setLocale(candidate)}
                aria-pressed={locale === candidate}
                className={[
                  'rounded-md border px-2.5 py-1 text-xs font-medium transition',
                  locale === candidate
                    ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                    : 'border-neutral-800 text-neutral-400 hover:border-neutral-600',
                ].join(' ')}
              >
                {LOCALE_LABEL[candidate]}
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
            {generating ? 'Generating…' : `Load a real ${option.label} scramble`}
          </button>
          <button
            type="button"
            onClick={() => setInput('')}
            className="rounded-lg border border-neutral-800 px-3 py-1.5 font-medium text-neutral-400 transition hover:border-neutral-600 hover:text-neutral-200"
          >
            Clear
          </button>
          {loadWarning ? (
            <p className="text-amber-300/80">
              Heads up: <code className="font-mono">{option.event}</code> {loadWarning}, on the main
              thread, in this tab. Validation itself costs nothing — this is the *other* half of the
              package.
            </p>
          ) : (
            <p className="text-neutral-500">
              <code className="font-mono text-neutral-300">{option.event}</code> needs no pruning
              table, so this is instant even on the first click.
            </p>
          )}
        </div>
      </div>

      <section id="validation-result" aria-live="polite" className="flex flex-col gap-4">
        {validation.valid ? (
          <ValidPanel option={option} derived={derived} input={input} />
        ) : (
          <ErrorPanel validation={validation} input={input} locale={locale} option={option} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          {catalogue ? `What ${option.label} notation accepts` : 'Everything the grammar accepts'}
        </h2>
        <p className="text-sm leading-relaxed text-neutral-400">
          {catalogue ? (
            <>
              Parsing needs no pruning table for any of the six grammars — only{' '}
              <em>generating</em> does. Every row below validates instantly, in a browser, with no
              server behind it.
            </>
          ) : (
            <>
              One row per construct. None of these needs a pruning table, so every one of them is
              instant, in a browser, on the first call — which is why this page works on the static
              build with no server behind it.
            </>
          )}
        </p>
        <SampleList samples={validSamples} onPick={setInput} active={input} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Every way {catalogue ? `${option.label} notation` : 'it'} can fail
        </h2>
        <p className="text-sm leading-relaxed text-neutral-400">
          {distinctCodes} distinct <code className="font-mono text-neutral-200">reason</code> codes
          {catalogue ? (
            <>
              , from the thirteen in{' '}
              <code className="font-mono text-neutral-200">ScrambleErrorReason</code> — a{' '}
              <strong className="text-neutral-200">separate</strong> union from the cube one, which
              is why upgrading to 0.12.0 did not break the message table for cube notation.
            </>
          ) : (
            <>
              , out of the twenty in{' '}
              <code className="font-mono text-neutral-200">SyntaxErrorReason</code>. The twentieth,{' '}
              <code className="font-mono text-neutral-200">unexpected-token</code>, is the deliberate
              residual — nothing the parser currently produces reaches it.
            </>
          )}{' '}
          Every code, span and payload in this table is read from the package as the page renders;
          the only thing kept in this repo is the input and a sentence about it.
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
              {failures.map(({ sample, validation: row }) => {
                const shown = row.valid ? null : present(row, locale);
                return (
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
                      {shown ? shown.reason : '— parsed cleanly'}
                    </td>
                    <td className="px-4 py-2.5 align-top font-mono text-xs whitespace-nowrap text-neutral-400">
                      {shown ? `${shown.error.offset} / ${shown.error.length}` : '—'}
                    </td>
                    <td className="px-4 py-2.5 align-top font-mono text-xs text-neutral-400">
                      {shown && shown.payload.length > 0
                        ? shown.payload.map(([key, value]) => `${key}: ${value}`).join(', ')
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {catalogue ? null : (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
            Notation this grammar refuses
          </h2>
          <p className="text-sm leading-relaxed text-neutral-400">
            The five other notations are still <em>not</em> this grammar, and 0.12.0 did not change
            that — it gave them a door of their own. Feed one of these to the cube tab and it fails;
            switch the notation above and the same string validates. That is the whole shape of the
            release: six grammars kept apart, one function to pick between them. A Pyraminx{' '}
            <code className="font-mono text-neutral-200">2</code> means counterclockwise rather than
            a half turn, so one shared amount field would still be actively wrong.
          </p>
          <SampleList samples={FOREIGN_NOTATION_SAMPLES} onPick={setInput} active={input} />
          <p className="text-xs leading-relaxed text-neutral-500">
            Each throws{' '}
            <code className="font-mono text-neutral-400">
              {foreign[0]?.error ? foreign[0].error.name : 'AlgorithmSyntaxError'}
            </code>
            , and each throws it at{' '}
            <span className="text-neutral-400">
              {foreign
                .map((row) => (row.error ? `character ${row.error.offset}` : 'no error'))
                .join(', ')}
            </span>{' '}
            — not at the start. The cube parser recognises no notation but its own: it reads whatever
            valid cube moves come first and stops at the first character it cannot, so{' '}
            <code className="font-mono text-neutral-400">UR2</code> in that Clock scramble parses
            happily as <code className="font-mono text-neutral-400">U R2</code> before the{' '}
            <code className="font-mono text-neutral-400">+</code> ends it. Click one and read the note
            the panel adds — the error itself cannot tell a foreign notation from a typo, which is
            exactly why the event has to come from you.
          </p>
        </section>
      )}
    </div>
  );
}

/** Runs a sample through the **cube** grammar specifically, whatever tab is open. */
function inspectAsCube(sample: NotationSample) {
  const result = validateAlgorithm(sample.input);
  return { error: result.valid ? null : result.error };
}

function ValidPanel({
  option,
  derived,
  input,
}: {
  readonly option: NotationOption;
  readonly derived: {
    readonly algorithm: Parameters<typeof serializeAlgorithm>[0];
    readonly serialized: string;
    readonly inverse: string;
  } | null;
  readonly input: string;
}) {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900/50 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-100">Valid {option.label} notation</h2>
        {derived ? (
          <span className="rounded-full border border-emerald-500/50 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
            {derived.algorithm.nodes.length} node
            {derived.algorithm.nodes.length === 1 ? '' : 's'}
          </span>
        ) : (
          <span className="rounded-full border border-emerald-500/50 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
            {'{ valid: true }'}
          </span>
        )}
      </div>

      {derived ? (
        <>
          <dl className="mt-4 flex flex-col gap-3">
            <div>
              <dt className="text-xs tracking-wide text-neutral-500 uppercase">
                serializeAlgorithm
              </dt>
              <dd className="mt-1 flex flex-wrap items-center gap-3">
                <span className="font-mono text-neutral-50">{derived.serialized || '(empty)'}</span>
                {derived.serialized && derived.serialized !== input.trim() ? (
                  <span className="text-xs text-amber-300/80">
                    differs from what you typed — comments are dropped, whitespace collapses, and
                    three spellings resolve at parse time
                  </span>
                ) : null}
              </dd>
            </div>

            <div>
              <dt className="text-xs tracking-wide text-neutral-500 uppercase">invertAlgorithm</dt>
              <dd className="mt-1 flex flex-wrap items-center gap-3">
                <span className="font-mono text-neutral-50">{derived.inverse || '(empty)'}</span>
                {derived.inverse ? (
                  <CopyButton value={derived.inverse} label="Copy inverse" />
                ) : null}
              </dd>
            </div>
          </dl>

          <div className="mt-5 border-t border-neutral-800 pt-4">
            <h3 className="text-xs tracking-wide text-neutral-500 uppercase">
              parseAlgorithm — the tree
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-neutral-500">
              Not from{' '}
              <code className="font-mono text-neutral-400">validateScramble</code> — it returns
              validity and nothing else. This tree is a second call to{' '}
              <code className="font-mono text-neutral-400">validateAlgorithm</code>, which is the
              cube-specific function and the only one of the six with a tree to hand back.
            </p>
            <div className="mt-3">
              <AlgorithmTree algorithm={derived.algorithm} />
            </div>
          </div>
        </>
      ) : (
        /*
         * The bespoke arm, and the honest version of D1's answer: there is
         * nothing else to show, and the page says why rather than inventing a
         * rendering for a tree that was never returned.
         */
        <div className="mt-4 flex flex-col gap-3 text-sm leading-relaxed text-neutral-400">
          <p>
            That is the entire result:{' '}
            <code className="font-mono text-neutral-200">
              {`{ valid: true, notation: '${option.notation}' }`}
            </code>
            . No tree, no move list, no normalised spelling.
          </p>
          <p>
            Not an oversight — a decision, and the central one of 0.12.0. Five notations have five
            node types, and merging them would be actively wrong rather than merely awkward: a
            Pyraminx <code className="font-mono text-neutral-200">2</code> means{' '}
            <em>counterclockwise</em>, so one shared{' '}
            <code className="font-mono text-neutral-200">amount</code> field would carry a false
            meaning. Publishing all five instead would freeze five shapes that were written for a
            solver&rsquo;s convenience and have never had to survive a consumer.
          </p>
          <p className="text-neutral-500">
            So the package answers the question a form field actually asks — is this valid for this
            event — and reserves the rest. Adding a payload later is additive and breaks nobody;
            removing one would not be. If you need the moves today, the puzzle&rsquo;s own parser is
            still there inside the package; it is simply not exported yet, and{' '}
            <a
              className="text-emerald-400 hover:text-emerald-300"
              href="https://github.com/cubesmithjs/cubesmith-scrambler/issues"
            >
              an issue saying why you need it
            </a>{' '}
            is what would change that.
          </p>
        </div>
      )}
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
          <span className="text-sm text-neutral-500">
            {sample.puzzle ? (
              <>
                <span className="text-neutral-300">{sample.puzzle}</span> — {sample.note}
              </>
            ) : (
              sample.note
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * What the cube error cannot tell you: that this was never cube notation in the
 * first place.
 *
 * `parseAlgorithm` recognises no notation but its own. It reads valid cube moves
 * until it meets a character it cannot, so a Clock scramble comes back as
 * `not-a-move` on a `+` — the same code, and the same shape of message, as a
 * typo. Since 0.12.0 the fix is one line rather than a lecture: pass the event.
 */
function ForeignNotationNote({
  sample,
  error,
}: {
  readonly sample: NotationSample;
  readonly error: { readonly input: string; readonly offset: number };
}) {
  /** What the parser accepted as ordinary cube notation before it stopped. */
  const consumed = error.input.slice(0, error.offset).trim();

  return (
    <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/5 px-4 py-3 text-sm leading-relaxed text-neutral-300">
      <p>
        <span className="font-semibold text-sky-300">This is {sample.puzzle} notation.</span> The
        refusal is deliberate — but notice that the error does not say so, and cannot: the message
        above is the same one a typo gets.
      </p>
      <p className="mt-2 text-neutral-400">
        {consumed ? (
          <>
            The parser read <code className="font-mono text-neutral-200">{consumed}</code> as
            ordinary cube notation first, and only stopped at character {error.offset}. It
            recognises no notation but its own; it reads what it can and reports the first character
            it cannot.
          </>
        ) : (
          <>
            It failed at the very first character. Nothing here was cube notation, but the error
            still describes a character rather than a notation.
          </>
        )}{' '}
        <span className="text-neutral-200">
          Switch the notation above and this exact string validates
        </span>{' '}
        — which is the point of{' '}
        <code className="font-mono text-neutral-200">validateScramble(event, text)</code>. The event
        is the piece of information the string itself does not carry, and it is always something you
        already have: <code className="font-mono text-neutral-200">result.event</code> from{' '}
        <code className="font-mono text-neutral-200">generateScramble</code>, or the row the
        scramble was stored against.
      </p>
    </div>
  );
}

function ErrorPanel({
  validation,
  input,
  locale,
  option,
}: {
  readonly validation: Extract<ScrambleValidation, { valid: false }>;
  readonly input: string;
  readonly locale: MessageLocale;
  readonly option: NotationOption;
}) {
  const shown = present(validation, locale)!;
  const span = underlineSpan(shown.error);
  const foreign = option.notation === 'cube' ? foreignNotationFor(input) : null;

  return (
    <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-semibold text-amber-200">
          Not valid {option.label} notation
        </h2>
        <span className="rounded-full border border-amber-500/50 px-2.5 py-0.5 font-mono text-xs text-amber-300">
          {shown.reason}
        </span>
      </div>

      {/*
        A compiler's rendering, because it is the one that survives every case:
        the input echoed, and a caret line under the offending span. It is drawn
        by one function for both error classes — `underlineSpan` — because both
        carry `offset` and `length` under the same contract.
      */}
      <pre className="mt-4 overflow-x-auto text-sm leading-snug">
        <code className="font-mono text-neutral-100">{input || ' '}</code>
        {'\n'}
        <code aria-hidden="true" className="font-mono text-amber-400">
          {' '.repeat(span.start)}
          {'^'.repeat(span.width)}
        </code>
      </pre>

      <p className="mt-4 leading-relaxed text-amber-100">{shown.sentence}</p>

      <p className="mt-2 text-xs text-neutral-500">
        {span.missing
          ? `length is 0 — the text is missing at character ${span.start} rather than wrong, so that is a caret and not an underline.`
          : span.width === 1
            ? `Character ${span.start}.`
            : `Characters ${span.start} to ${span.start + span.width - 1}.`}
      </p>

      {foreign ? <ForeignNotationNote sample={foreign} error={shown.error} /> : null}

      <dl className="mt-5 grid gap-x-6 gap-y-2 border-t border-amber-500/20 pt-4 text-sm sm:grid-cols-[auto_1fr]">
        <dt className="font-mono text-xs text-neutral-500">class</dt>
        <dd className="font-mono text-xs text-neutral-300">{shown.className}</dd>

        <dt className="font-mono text-xs text-neutral-500">reason</dt>
        <dd className="font-mono text-xs text-neutral-300">{shown.reason}</dd>

        <dt className="font-mono text-xs text-neutral-500">offset / length</dt>
        <dd className="font-mono text-xs text-neutral-300">
          {shown.error.offset} / {shown.error.length}
        </dd>

        {shown.payload.map(([key, value]) => (
          <div key={key} className="contents">
            <dt className="font-mono text-xs text-neutral-500">{key}</dt>
            <dd className="font-mono text-xs text-neutral-300">{value}</dd>
          </div>
        ))}

        <dt className="font-mono text-xs text-neutral-500">message</dt>
        <dd className="font-mono text-xs break-words text-neutral-400">{shown.error.message}</dd>
      </dl>

      <p className="mt-4 text-sm leading-relaxed text-neutral-400">
        The sentence above the table is written in{' '}
        <code className="font-mono text-neutral-200">
          src/examples/{option.notation === 'cube' ? 'syntax-messages.ts' : 'scramble-messages.ts'}
        </code>
        , in this repo, from <code className="font-mono text-neutral-200">reason</code> and the
        fields beside it.{' '}
        {option.notation === 'cube' ? null : (
          <>
            It is a <strong className="text-neutral-200">second</strong> table, over a second union,
            and that is the cost of the package keeping the two error types apart — the benefit being
            that the cube table did not have to change at all when these thirteen codes shipped.{' '}
          </>
        )}
        The package ships no message strings beyond{' '}
        <code className="font-mono text-neutral-200">.message</code> — the English one in the table,
        which is the right thing to log and the wrong thing to show a user — and it never will.
        Switching the language above changes nothing about what the package returned.
      </p>
    </div>
  );
}
