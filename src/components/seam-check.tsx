'use client';

import { generateScrambles } from '@cubesmith/scrambler';
import { useState } from 'react';

const AXIS: Readonly<Record<string, string>> = { U: 'UD', D: 'UD', R: 'RL', L: 'RL', F: 'FB', B: 'FB' };

/**
 * The first token that merges into an earlier one, or `null`.
 *
 * Within a run of turns on one axis, no face may repeat: turns on one axis
 * commute, so a repeat anywhere in the run slides next to its twin and merges.
 * That covers `R2 R'` and also `R2 L2 R'`. It is the rule 0.15.0 enforces where
 * the 3x3x3 solver's two phases meet, written again here so the page checks the
 * package rather than quoting it.
 */
function firstRepeat(scramble: string): string | null {
  const tokens = scramble.split(' ');
  for (let i = 1; i < tokens.length; i += 1) {
    const face = tokens[i]![0]!;
    for (let j = i - 1; j >= 0; j -= 1) {
      const earlier = tokens[j]![0]!;
      if (AXIS[earlier] !== AXIS[face]) break;
      if (earlier === face) return tokens.slice(j, i + 1).join(' ');
    }
  }
  return null;
}

const COUNT = 40;

export function SeamCheck() {
  const [state, setState] = useState<
    | { readonly kind: 'idle' }
    | { readonly kind: 'running' }
    | { readonly kind: 'done'; readonly checked: number; readonly repeats: readonly string[]; readonly ms: number }
  >({ kind: 'idle' });

  async function run() {
    setState({ kind: 'running' });
    // Two frames, so "running" paints before the table build blocks the tab.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const startedAt = performance.now();
    const batch = await generateScrambles('333', COUNT, { seed: 'whats-new-seam' });
    const repeats = batch.flatMap((result) => {
      const repeat = firstRepeat(result.moves);
      return repeat === null ? [] : [repeat];
    });
    setState({ kind: 'done', checked: batch.length, repeats, ms: performance.now() - startedAt });
  }

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-neutral-800 p-5">
      <p className="text-sm text-neutral-400">
        Generates {COUNT} seeded <code className="font-mono text-neutral-200">333</code> scrambles in
        this tab and looks for a repeated face inside a run of same-axis turns. On 0.14.1 about one
        scramble in ten had one. The first scramble builds the 3x3x3 tables, about 8 s.
      </p>
      <div>
        <button
          type="button"
          onClick={run}
          disabled={state.kind === 'running'}
          className="rounded-lg border border-emerald-500/60 px-4 py-1.5 text-sm text-emerald-300 transition hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {state.kind === 'running' ? 'Generating…' : 'Run the check'}
        </button>
      </div>
      {state.kind === 'done' && (
        <p className={`text-sm ${state.repeats.length === 0 ? 'text-emerald-300' : 'text-red-300'}`}>
          {state.repeats.length === 0
            ? `✓ ${state.checked} scrambles, no repeated turn (${(state.ms / 1000).toFixed(1)} s).`
            : `✗ ${state.repeats.length} of ${state.checked} have a repeat, for example ${state.repeats[0]}.`}
        </p>
      )}
    </div>
  );
}
