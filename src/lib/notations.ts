import type { Notation, WcaEventId } from '@cubesmith/scrambler';

import { coldCost, getEvent } from './events';

/**
 * The six grammars, as the page offers them.
 *
 * 🔴 **Six options, not seventeen.** `validateScramble` takes a `WcaEventId`,
 * and a seventeen-item picker would be the wrong shape for this page: twelve of
 * those events share one grammar, so eleven of the rows would answer
 * identically. The page is about *notations*. Each row below names the event it
 * validates as, which is the parameter the package actually wants.
 *
 * The event is also what the "load a real scramble" button generates from — so
 * one choice covers both, and the scramble a reader lands on is always one this
 * grammar accepts.
 */
export interface NotationOption {
  readonly notation: Notation;
  readonly label: string;
  /** The event this notation is validated as. For cube, one of twelve. */
  readonly event: WcaEventId;
  /** Which events this grammar serves, for a sentence rather than a list. */
  readonly covers: string;
  /** What is worth knowing about the grammar itself, in one line. */
  readonly blurb: string;
}

export const NOTATION_OPTIONS: readonly NotationOption[] = [
  {
    notation: 'cube',
    label: 'Cube',
    // 5x5x5 rather than 3x3x3 for the reason the page has always used it: it is
    // random-moves, so it builds no pruning table and cannot freeze this tab —
    // and its `3Rw'` output is notation `parseMove` cannot read.
    event: '555',
    covers: 'twelve of the seventeen events',
    blurb:
      'The grammar parseAlgorithm reads: faces, wide moves, slices, rotations, groups, commutators, conjugates, pauses and comments.',
  },
  {
    notation: 'megaminx',
    label: 'Megaminx',
    event: 'minx',
    covers: 'minx',
    blurb:
      'Pochmann notation — six tokens, two of which hold a face still and turn everything else.',
  },
  {
    notation: 'clock',
    label: 'Clock',
    event: 'clock',
    covers: 'clock',
    blurb:
      'A pin group and an hour count per token, a y2 flip in the middle, and a closing declaration of which pins are left up.',
  },
  {
    notation: 'pyraminx',
    label: 'Pyraminx',
    event: 'pyram',
    covers: 'pyram',
    blurb:
      'Order-3 vertex turns, so there is no half turn. Uppercase turns a layer, lowercase turns just that tip.',
  },
  {
    notation: 'skewb',
    label: 'Skewb',
    event: 'skewb',
    covers: 'skewb',
    blurb:
      'Fixed Corner Notation: one corner held still, the other four named U R L B. Uppercase only — there is no tip.',
  },
  {
    notation: 'square1',
    label: 'Square-1',
    event: 'sq1',
    covers: 'sq1',
    blurb:
      'Pairs of 30° layer turns and a / slice. Tolerant about spacing and about which representative a value uses.',
  },
];

/**
 * What generating a scramble for this notation will cost the tab, in a sentence,
 * or `null` when it needs no table and so costs nothing worth warning about.
 *
 * Derived from `events.ts`'s measured table costs rather than written again
 * here. Square-1 is the row that matters: ~4 s on the main thread, and a page
 * that let you click into that without saying so would be doing the thing this
 * demo exists to argue against.
 */
export function loadWarningFor(option: NotationOption): string | null {
  const cost = coldCost(getEvent(option.event));
  return cost === null ? null : `builds a pruning table on the first click — about ${cost}`;
}
