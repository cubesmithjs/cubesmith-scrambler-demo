'use client';

import {
  AlgorithmSyntaxError,
  generateScramble,
  ScrambleSyntaxError,
  type WcaEventId,
} from '@cubesmith/scrambler';
import {
  defaultColorScheme,
  drawScramble,
  InvalidColorError,
  scrambleImageToSvg,
  UnimplementedDrawingError,
  UnsupportedScrambleError,
  type PartialColorScheme,
  type ScrambleImage,
} from '@cubesmith/scrambler/draw';
import { useMemo, useState } from 'react';

import { coldCost, getEvent } from '@/lib/events';
import { DRAW_SAMPLES } from '@/lib/draw-samples';

import { CopyButton } from './copy-button';
import { EventPicker } from './event-picker';
import { ScrambleDrawing } from './scramble-drawing';

/**
 * Which class a failed draw threw, as a badge.
 *
 * Five outcomes, and telling them apart is the whole reason the drawing layer
 * added three error types instead of throwing `Error`. Two of the five are *not*
 * new: a malformed scramble throws the package's existing syntax errors
 * unwrapped, so a consumer already handling those from `validateScramble` keeps
 * its handling and gains nothing to write.
 */
type DrawFailure = {
  readonly className: string;
  readonly message: string;
  readonly note: string;
};

function classify(error: unknown): DrawFailure {
  if (error instanceof UnsupportedScrambleError) {
    return {
      className: 'UnsupportedScrambleError',
      message: error.message,
      note: 'Valid cube notation that a WCA scramble never contains — a slice move, a layer range, a commutator. The parser accepts it; the drawing has no cubie to move for it. Distinct from a syntax error on purpose: the text is fine, the content is not.',
    };
  }
  if (error instanceof UnimplementedDrawingError) {
    return {
      className: 'UnimplementedDrawingError',
      message: error.message,
      note: 'No drawer for this event. Deliberately not UnimplementedEventError, which means no *scrambler* — two different absences, and as of 0.13.0 neither one is reachable from this page, since all seventeen events both generate and draw.',
    };
  }
  if (error instanceof InvalidColorError) {
    return {
      className: 'InvalidColorError',
      message: error.message,
      note: 'Colour overrides are validated at the door rather than escaped on the way out. That is what lets scrambleImageToSvg write a fill attribute with no escaping at all: there is one place to be right instead of one per attribute.',
    };
  }
  if (error instanceof ScrambleSyntaxError) {
    return {
      className: 'ScrambleSyntaxError',
      message: error.message,
      note: 'Thrown unwrapped by the drawing layer — the same class validateScramble returns for the five bespoke grammars, carrying the same offset, span and stable reason code.',
    };
  }
  if (error instanceof AlgorithmSyntaxError) {
    return {
      className: 'AlgorithmSyntaxError',
      message: error.message,
      note: 'Thrown unwrapped by the drawing layer — the same class parseAlgorithm throws, carrying the same offset, span and stable reason code. Handling it once covers both call sites.',
    };
  }
  return {
    className: 'error',
    message: error instanceof Error ? error.message : String(error),
    note: 'Not one of the classes this layer documents.',
  };
}

type DrawState =
  | { readonly ok: true; readonly image: ScrambleImage }
  | { readonly ok: false; readonly failure: DrawFailure };

/**
 * Cube notation the parser accepts and a drawing cannot apply, one example per
 * kind. These exist to be clicked: `UnsupportedScrambleError` is the one new
 * error class a reader is unlikely to hit by accident, because it needs input
 * that is *valid* and still undrawable.
 */
const UNSUPPORTED_EXAMPLES: readonly { readonly label: string; readonly scramble: string }[] = [
  { label: 'a slice move', scramble: "R U M' U'" },
  { label: 'a commutator', scramble: '[R, U]' },
  { label: 'a layer range', scramble: '2-3Rw U' },
];

export function DrawWorkbench() {
  const [event, setEvent] = useState<WcaEventId>('333');
  const [scramble, setScramble] = useState(DRAW_SAMPLES['333']);
  const [overrides, setOverrides] = useState<PartialColorScheme>({});
  const [showSvg, setShowSvg] = useState(false);
  const [generating, setGenerating] = useState(false);

  const defaults = useMemo(() => defaultColorScheme(event), [event]);
  const selected = getEvent(event);

  /**
   * Drawing is cheap enough to redo on every keystroke — it is geometry over a
   * parsed move list, with no table behind it — so there is no debounce here
   * and no `useEffect`. The picture is derived state, which is what `useMemo`
   * is for.
   */
  const state: DrawState = useMemo(() => {
    try {
      return { ok: true, image: drawScramble(event, scramble, overrides) };
    } catch (error) {
      return { ok: false, failure: classify(error) };
    }
  }, [event, scramble, overrides]);

  function chooseEvent(next: WcaEventId) {
    setEvent(next);
    setScramble(DRAW_SAMPLES[next]);
    // Schemes are not interchangeable between puzzles — three of them disagree
    // about what colour `R` is, and the Clock's keys are not faces at all — so
    // carrying an override across an event change would produce a picture that
    // is plausible and wrong.
    setOverrides({});
  }

  async function generateFresh() {
    setGenerating(true);
    try {
      // Two frames, so the disabled state paints before the main thread blocks.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const result = await generateScramble(event);
      setScramble(result.moves);
    } finally {
      setGenerating(false);
    }
  }

  const svg = state.ok ? scrambleImageToSvg(state.image) : null;
  const overriddenKeys = Object.keys(overrides).filter((key) => overrides[key] !== undefined);

  return (
    <div className="flex flex-col gap-6">
      <EventPicker value={event} onChange={chooseEvent} disabled={generating} />

      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <label htmlFor="draw-scramble" className="text-sm font-medium text-neutral-400">
            Scramble <span className="text-neutral-600">(drawn as you type)</span>
          </label>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <button
              type="button"
              onClick={() => setScramble(DRAW_SAMPLES[event])}
              className="text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300"
            >
              Reset to the sample
            </button>
            <button
              type="button"
              onClick={generateFresh}
              disabled={generating}
              className="text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generating ? 'Generating…' : 'Generate a fresh one'}
            </button>
          </div>
        </div>

        <textarea
          id="draw-scramble"
          value={scramble}
          onChange={(changeEvent) => setScramble(changeEvent.target.value)}
          spellCheck={false}
          rows={3}
          className="w-full resize-y rounded-lg border border-neutral-800 bg-neutral-900 px-3 py-2 font-mono text-sm leading-relaxed text-neutral-100 focus:border-emerald-500 focus:outline-none"
        />

        <p className="text-sm text-neutral-500">
          Paste anything — a scramble from your database, one off a printed sheet, one you typed
          wrong on purpose. <code className="font-mono text-neutral-300">drawScramble</code> takes{' '}
          <strong className="text-neutral-300">text</strong>, which is TNoodle&rsquo;s own signature
          and the decision that matters here: there is one path, so a stored scramble draws exactly
          as a freshly generated one does.
          {coldCost(selected) ? (
            <>
              {' '}
              Note that <em>generating</em> a fresh {selected.name} is the expensive half —{' '}
              {coldCost(selected)} the first time in this tab, on the main thread. Drawing the one
              already in the box costs nothing.
            </>
          ) : null}
        </p>
      </div>

      {state.ok ? (
        <>
          <figure className="flex flex-col items-center gap-4 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6">
            <ScrambleDrawing
              image={state.image}
              title={`${selected.name} scramble drawing`}
              className="max-h-80 w-full max-w-md"
            />
            <figcaption className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-neutral-500">
              <span>
                <span className="text-neutral-400">{state.image.shapes.length}</span> shapes
              </span>
              <span>
                intrinsic{' '}
                <span className="text-neutral-400">
                  {state.image.width}&times;{state.image.height}
                </span>
              </span>
              <span>
                stroke <span className="text-neutral-400">{state.image.strokeWidth}</span>
              </span>
              <span className="font-mono text-neutral-600">{state.image.event}</span>
            </figcaption>
          </figure>

          <p className="-mt-2 text-sm leading-relaxed text-neutral-500">
            Those {state.image.shapes.length} shapes are what{' '}
            <code className="font-mono text-neutral-300">drawScramble</code> returned — an array of
            rectangles, polygons, circles and paths in paint order, not markup. The picture above is
            React elements mapped straight off it, so every sticker keeps its own key and could
            carry a click target or a <code className="font-mono text-neutral-300">&lt;title&gt;</code>.
            An SVG string could not.
          </p>
        </>
      ) : (
        <section className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-amber-200">No picture</h3>
            <span className="rounded-full border border-amber-500/50 px-2.5 py-0.5 font-mono text-xs text-amber-300">
              {state.failure.className}
            </span>
          </div>
          <p className="mt-3 font-mono text-sm break-words text-amber-100/90">
            {state.failure.message}
          </p>
          <p className="mt-4 text-sm leading-relaxed text-neutral-400">{state.failure.note}</p>
        </section>
      )}

      <section className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-5">
        <h3 className="font-semibold text-neutral-200">Colours</h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          <code className="font-mono text-neutral-300">defaultColorScheme(&apos;{event}&apos;)</code>{' '}
          returns these {Object.keys(defaults).length} keys. Override any subset and the rest are
          inherited, matching TNoodle&rsquo;s &ldquo;missing entries merged from defaults&rdquo;.
          {event === 'clock' ? (
            <>
              {' '}
              🔴 Note the Clock&rsquo;s keys are not faces at all — they are dial, hand, pin and
              panel parts. Copying a cube&rsquo;s scheme onto it would not merge; it would be
              ignored.
            </>
          ) : null}
        </p>

        <div className="flex flex-wrap gap-2">
          {Object.entries(defaults).map(([key, fallback]) => {
            const current = overrides[key] ?? fallback;
            return (
              <label
                key={key}
                className="flex items-center gap-2 rounded-lg border border-neutral-800 py-1.5 pr-3 pl-1.5 text-sm"
              >
                <input
                  type="color"
                  value={/^#[0-9a-f]{6}$/i.test(current) ? current : '#000000'}
                  onChange={(changeEvent) =>
                    setOverrides((previous) => ({ ...previous, [key]: changeEvent.target.value }))
                  }
                  aria-label={`${key} colour`}
                  className="h-7 w-7 cursor-pointer rounded border-0 bg-transparent p-0"
                />
                <span className="font-mono text-neutral-300">{key}</span>
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-sm">
          <button
            type="button"
            onClick={() => setOverrides({})}
            disabled={overriddenKeys.length === 0}
            className="text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Back to the defaults
          </button>
          <button
            type="button"
            onClick={() => {
              const first = Object.keys(defaults)[0];
              if (first) setOverrides({ [first]: 'rebeccapurple' });
            }}
            className="text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300"
          >
            Use a CSS named colour
          </button>
          <button
            type="button"
            onClick={() => {
              const first = Object.keys(defaults)[0];
              if (first) setOverrides({ [first]: 'not-a-colour' });
            }}
            className="text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300"
          >
            Send a colour that is not one
          </button>
          <span className="text-neutral-600">
            {overriddenKeys.length === 0
              ? 'no overrides — every key inherited'
              : `${overriddenKeys.length} of ${Object.keys(defaults).length} overridden`}
          </span>
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-5">
        <h3 className="font-semibold text-neutral-200">Notation a drawing cannot apply</h3>
        <p className="text-sm leading-relaxed text-neutral-400">
          Three inputs the parser is perfectly happy with and the drawing still refuses. They are
          not typos, which is exactly why they get their own error class rather than a syntax one.
        </p>
        <div className="flex flex-wrap gap-3">
          {UNSUPPORTED_EXAMPLES.map((example) => (
            <button
              key={example.label}
              type="button"
              onClick={() => {
                setEvent('333');
                setScramble(example.scramble);
              }}
              className="rounded-lg border border-neutral-800 px-3 py-1.5 text-sm transition hover:border-neutral-600"
            >
              <span className="font-mono text-neutral-200">{example.scramble}</span>
              <span className="ml-2 text-neutral-500">{example.label}</span>
            </button>
          ))}
        </div>
      </section>

      {svg ? (
        <section className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-neutral-200">
              <code className="font-mono text-sm">scrambleImageToSvg(image)</code>
            </h3>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setShowSvg((previous) => !previous)}
                aria-expanded={showSvg}
                className="text-sm text-emerald-400 underline underline-offset-2 transition hover:text-emerald-300"
              >
                {showSvg ? 'Hide' : `Show all ${svg.length.toLocaleString()} characters`}
              </button>
              <CopyButton value={svg} label="Copy SVG" />
            </div>
          </div>
          <p className="text-sm leading-relaxed text-neutral-400">
            The other consumer of the same data: a standalone SVG document string, for a print
            route or a PDF where React is not in the picture. It writes a{' '}
            <code className="font-mono text-neutral-300">viewBox</code> and no pixel size, so the
            medium decides how large it renders.
          </p>
          <pre className="max-h-64 overflow-auto rounded-lg bg-neutral-950 p-4 text-xs leading-relaxed">
            <code className="font-mono break-all whitespace-pre-wrap text-neutral-400">
              {showSvg ? svg : `${svg.slice(0, 300)}…`}
            </code>
          </pre>
        </section>
      ) : null}
    </div>
  );
}
