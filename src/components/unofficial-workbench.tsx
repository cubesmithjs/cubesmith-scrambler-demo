'use client';

import {
  generateUnofficialScramble,
  isImplementedUnofficialEvent,
  validateUnofficialScramble,
  type UnofficialEventId,
  type UnofficialScrambleResult,
} from '@cubesmith/scrambler/unofficial';
import {
  drawingViews,
  drawUnofficialScramble,
  isDrawableUnofficialEvent,
  type UnofficialDrawingView,
} from '@cubesmith/scrambler/unofficial/draw';
import { useMemo, useState } from 'react';

import { ScrambleDrawing } from '@/components/scramble-drawing';

/**
 * The sixteen unofficial events, grouped the way the package documents them.
 *
 * A literal list rather than `unofficialEvents()`, for the names: the package
 * deals in ids, and a picker wants words. `isImplementedUnofficialEvent` still
 * decides whether a tile works, so a list that drifted from the package would
 * show a dead tile rather than a silent gap.
 */
const GROUPS: readonly {
  readonly title: string;
  readonly events: readonly { readonly id: UnofficialEventId; readonly name: string }[];
}[] = [
  {
    title: 'Big cubes',
    events: [
      { id: '888', name: '8x8x8' },
      { id: '999', name: '9x9x9' },
      { id: '1010', name: '10x10x10' },
      { id: '1111', name: '11x11x11' },
      { id: '1212', name: '12x12x12' },
    ],
  },
  {
    title: 'Blindfolded',
    events: [
      { id: '222bf', name: '2x2x2 Blindfolded' },
      { id: '666bf', name: '6x6x6 Blindfolded' },
      { id: '777bf', name: '7x7x7 Blindfolded' },
      { id: 'pyrambf', name: 'Pyraminx Blindfolded' },
      { id: 'minxbf', name: 'Megaminx Blindfolded' },
    ],
  },
  {
    title: '3x3x3 shape mods',
    events: [
      { id: 'mirror', name: 'Mirror Cube' },
      { id: 'axis', name: 'Axis Cube' },
      { id: 'fisher', name: 'Fisher Cube' },
      { id: 'windmill', name: 'Windmill Cube' },
      { id: 'ghost', name: 'Ghost Cube' },
      { id: 'mastermorphix', name: 'Mastermorphix' },
    ],
  },
];

/**
 * What the first scramble of an event costs this tab, when it builds a table.
 * These reuse the WCA puzzles' tables, so the numbers are the ones `events.ts`
 * measured for `222`, `333` and `pyram`.
 */
const COLD_COST: Partial<Record<UnofficialEventId, string>> = {
  '222bf': 'about 4 s (the 2x2x2 tables)',
  pyrambf: 'about 200 ms (the Pyraminx tables)',
  mirror: 'about 8 s (the 3x3x3 tables)',
  axis: 'about 8 s (the 3x3x3 tables)',
  fisher: 'about 8 s (the 3x3x3 tables)',
  windmill: 'about 8 s (the 3x3x3 tables)',
  ghost: 'about 8 s (the 3x3x3 tables)',
  mastermorphix: 'about 8 s (the 3x3x3 tables)',
};

const QUALITY_NOTE: Record<UnofficialScrambleResult['quality'], string> = {
  'random-state': 'Uniform over every reachable state of the puzzle.',
  'random-moves': 'A sequence of random moves, as the WCA prescribes for its big cubes.',
  'random-state-mechanism':
    'Uniform over the hidden 3x3x3, not over the centre orientations this puzzle shows. Calling it random-state would overclaim.',
};

const VIEW_LABEL: Record<UnofficialDrawingView, string> = {
  net: 'Net',
  isometric: 'Isometric, front and back',
  'height-map': 'Height map (flat, printable)',
};

interface Generated {
  readonly result: UnofficialScrambleResult;
  readonly ms: number;
}

export function UnofficialWorkbench() {
  const [event, setEvent] = useState<UnofficialEventId>('888');
  const [seed, setSeed] = useState('');
  const [generated, setGenerated] = useState<Generated | null>(null);
  const [busy, setBusy] = useState(false);

  function choose(next: UnofficialEventId) {
    setEvent(next);
    setGenerated(null);
  }

  async function generate() {
    setBusy(true);
    try {
      // Two frames, so the disabled state paints before a table build blocks the tab.
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const startedAt = performance.now();
      const result = await generateUnofficialScramble(event, seed === '' ? {} : { seed });
      setGenerated({ result, ms: performance.now() - startedAt });
    } finally {
      setBusy(false);
    }
  }

  const validation = generated ? validateUnofficialScramble(event, generated.result.moves) : null;
  const drawings = useMemo(() => {
    if (!generated || !isDrawableUnofficialEvent(event)) return [];
    return drawingViews(event).map((view) => ({
      view,
      image: drawUnofficialScramble(event, generated.result.moves, undefined, { view }),
    }));
  }, [event, generated]);
  const cold = COLD_COST[event];

  return (
    <div className="flex flex-col gap-6">
      {GROUPS.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-neutral-400">{group.title}</h3>
          <div className="flex flex-wrap gap-2">
            {group.events.map(({ id, name }) => (
              <button
                key={id}
                type="button"
                onClick={() => choose(id)}
                disabled={busy || !isImplementedUnofficialEvent(id)}
                className={`rounded-lg border px-3 py-1.5 text-sm transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  id === event
                    ? 'border-emerald-500/70 text-emerald-300'
                    : 'border-neutral-800 text-neutral-300 hover:border-neutral-600'
                }`}
              >
                {name} <span className="font-mono text-xs text-neutral-500">{id}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-neutral-400">
          Seed <span className="text-neutral-600">(optional; same seed, same scramble)</span>
          <input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            placeholder="leave empty for a random one"
            className="w-64 rounded-lg border border-neutral-800 bg-neutral-950 px-3 py-1.5 font-mono text-neutral-200"
          />
        </label>
        <button
          type="button"
          onClick={generate}
          disabled={busy}
          className="rounded-lg border border-emerald-500/60 px-4 py-1.5 text-sm text-emerald-300 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Generating…' : 'Generate'}
        </button>
        {cold && (
          <p className="text-sm text-amber-300/80">
            The first scramble builds a table on this tab: {cold}.
          </p>
        )}
      </div>

      {generated && validation && (
        <section className="flex flex-col gap-4 rounded-xl border border-neutral-800 p-5">
          <p className="break-words font-mono text-sm leading-relaxed text-neutral-100">
            {generated.result.moves}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-sky-500/50 px-2.5 py-0.5 font-mono text-sky-300">
              {generated.result.quality}
            </span>
            <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 font-mono text-neutral-400">
              {generated.result.moves.split(' ').length} tokens
            </span>
            <span className="rounded-full border border-neutral-700 px-2.5 py-0.5 font-mono text-neutral-400">
              {generated.ms.toFixed(0)} ms
            </span>
            <span
              className={`rounded-full border px-2.5 py-0.5 font-mono ${
                validation.valid ? 'border-emerald-500/50 text-emerald-300' : 'border-red-500/50 text-red-300'
              }`}
            >
              validateUnofficialScramble: {validation.valid ? `valid (${validation.notation})` : 'invalid'}
            </span>
          </div>
          <p className="text-sm text-neutral-400">{QUALITY_NOTE[generated.result.quality]}</p>

          {isDrawableUnofficialEvent(event) ? (
            <div className="flex flex-wrap gap-6">
              {drawings.map(({ view, image }) => (
                <figure key={view} className="flex flex-col gap-2">
                  <ScrambleDrawing
                    image={image}
                    title={`${event} scramble, ${VIEW_LABEL[view]}`}
                    className="h-56 w-auto max-w-full"
                  />
                  <figcaption className="text-xs text-neutral-500">
                    view: <code className="font-mono">{view}</code> — {VIEW_LABEL[view]}
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-neutral-500">
              <code className="font-mono text-neutral-300">isDrawableUnofficialEvent(&apos;{event}&apos;)</code>{' '}
              is <code className="font-mono">false</code>: no published source gives this puzzle&apos;s
              geometry yet, and a guessed picture would mislead whoever checks a scramble against it.
              The scramble itself is served all the same.
            </p>
          )}
        </section>
      )}
    </div>
  );
}
