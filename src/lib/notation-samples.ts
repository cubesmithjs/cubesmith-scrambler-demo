import type { Notation } from '@cubesmith/scrambler';

/**
 * Inputs for the `/notation` page.
 *
 * Note what is **not** here: not one `SyntaxErrorReason` code, and not one
 * offset or length. Each row below is an input plus a sentence about it; the
 * code, the span and the interpolated data are read from the package at render
 * time. That is the same rule the event picker follows with
 * `isImplementedEvent` — a second copy of the package's own classification,
 * maintained by hand in this repo, is exactly the thing that goes stale.
 */

export interface NotationSample {
  readonly input: string;
  /** What this input is here to show. Never restates the code — the page reads that live. */
  readonly note: string;
  /**
   * The puzzle whose notation this is, when it is **not** cube notation.
   *
   * Needed because the error alone cannot say it. `parseAlgorithm` does not
   * recognise notations; it reads valid cube moves until it meets a character it
   * cannot, so a Clock scramble reports `not-a-move` on a `+` exactly as a typo
   * would. Only this repo knows the input was a Clock scramble, so only this
   * repo can tell the reader.
   */
  readonly puzzle?: string;
  /**
   * Which grammar this sample actually belongs to, so clicking it can take the
   * reader there.
   *
   * `puzzle` is a label and this is an identifier; they are separate because
   * "Square-1" is what a person reads and `'square1'` is what the package
   * dispatches on, and conflating them would put a display string in a
   * discriminant.
   */
  readonly notation?: Notation;
}

/** Every construct the grammar accepts, one per row. */
export const VALID_SAMPLES: readonly NotationSample[] = [
  { input: "R U R' U'", note: 'Plain face turns.' },
  { input: "R U R' U' // sexy move", note: 'A comment runs to the end of the line and is not a node.' },
  { input: "Rw2 3Rw' 2-3Rw", note: 'Wide moves: a width, a numeric prefix, and an explicit layer range.' },
  { input: "r U l'", note: 'Lowercase is a wide move, and is re-emitted as Rw / Lw — one spelling out.' },
  { input: "M' E S2", note: 'Slices.' },
  { input: "x y2 z'", note: 'Whole-puzzle rotations.' },
  { input: "(R U R' U')2", note: 'A group with a repetition.' },
  { input: '[R, U]', note: "A commutator — R U R' U', kept as two halves rather than expanded." },
  { input: "[R: (U Rw U')2]", note: 'A conjugate, nested. Inverting it inverts only the second half.' },
  { input: "R U R' . U R U'", note: 'A pause, marking a break between stages.' },
  { input: "R3 R2'", note: 'Amounts the WCA never emits, accepted because this layer reads what others wrote.' },
];

/**
 * One input per reachable failure — nineteen of the twenty documented codes.
 *
 * The twentieth, `unexpected-token`, is the package's deliberate residual:
 * nothing the parser currently produces reaches it, and it is what an error
 * built without a detail reports rather than claiming a precision it does not
 * have. There is no input to put in this list for it, so there isn't one.
 */
export const INVALID_SAMPLES: readonly NotationSample[] = [
  { input: 'R U Q2 R', note: 'An unknown letter. A validator that tolerates Q is not validating.' },
  { input: 'R0', note: 'Zero turns nothing.' },
  { input: "R''", note: 'One prime per move.' },
  { input: 'Mw', note: 'A slice has no width to widen.' },
  { input: '3R', note: 'A layer count with no w.' },
  { input: '1Rw', note: 'A wide move of one layer is not wide.' },
  { input: '3', note: 'A layer number with no move after it.' },
  { input: '2-Rw', note: 'Half a layer range — the case where length is 0 because text is missing.' },
  { input: '4-2Rw', note: 'A range that counts outwards.' },
  { input: '(R U', note: 'An unclosed group.' },
  { input: '()', note: 'An empty group.' },
  { input: 'R U)', note: 'A closer with nothing open.' },
  { input: '[R U]', note: 'A bracket with no separator, so neither a commutator nor a conjugate.' },
  { input: '[R, U', note: 'An unclosed bracket.' },
  { input: '[R, U: F]', note: 'Two separators in one bracket.' },
  { input: '[R: ]', note: 'A bracket half with no moves — note the span covers the whole bracket.' },
  { input: 'R U]', note: 'A bracket closer with nothing open.' },
  { input: 'R , U', note: 'A comma outside a commutator.' },
  { input: 'R : U', note: 'A colon outside a conjugate.' },
];

/**
 * Scrambles from the five puzzles whose notation is deliberately *not* the cube
 * grammar. Feeding one to the **cube** arm throws, which is documented behaviour
 * rather than a gap: a Pyraminx `2` means counterclockwise, not a half turn, so
 * folding these into one type would be actively wrong.
 *
 * 0.12.0 did **not** change that. `validateScramble('minx', …)` routes to the
 * Megaminx grammar, and `parseAlgorithm` on the same string still refuses — a
 * test in the package asserts exactly that. So this list stays, and stays on the
 * cube tab: it is the sharpest lesson on the page, and the one 0.12.0 makes
 * *more* useful rather than obsolete, because now there is somewhere to send
 * each of these strings instead of only somewhere it fails.
 */
export const FOREIGN_NOTATION_SAMPLES: readonly NotationSample[] = [
  { input: 'R++ D-- U', note: 'Pochmann notation.', puzzle: 'Megaminx', notation: 'megaminx' },
  {
    input: 'UR2+ DR4- ALL1+ y2 U4+',
    note: 'Pins and hours.',
    puzzle: 'Clock',
    notation: 'clock',
  },
  {
    input: '(-3,2)/ (3,0)/ (1,-3)',
    note: 'Slice-and-turn pairs.',
    puzzle: 'Square-1',
    notation: 'square1',
  },
];

/** The sample this input is, if it is one of the foreign notations above. */
export function foreignNotationFor(input: string): NotationSample | null {
  return FOREIGN_NOTATION_SAMPLES.find((sample) => sample.input === input.trim()) ?? null;
}

/**
 * The same two lists, for each of the five bespoke notations 0.12.0 opened up.
 *
 * The rule from the top of this file holds here too and is worth restating,
 * because there are now thirteen more codes to be tempted by: **not one
 * `ScrambleErrorReason`, offset or length appears below.** Every row is an input
 * and a sentence about it; the code, the span and the payload are read from the
 * package as the page renders. A hand-maintained second copy of the package's
 * classification is precisely what this demo exists to argue against.
 *
 * Twelve of the thirteen codes are reachable and have a row. The thirteenth,
 * `unexpected-token`, is the package's documented residual — nothing any of the
 * five parsers produces reaches it — so there is no input to write for it, and
 * there isn't one.
 */
export interface NotationCatalogue {
  readonly valid: readonly NotationSample[];
  readonly invalid: readonly NotationSample[];
}

export const MEGAMINX_SAMPLES: NotationCatalogue = {
  valid: [
    { input: "R++ D-- U'", note: 'The whole move set is six tokens; here are three of them.' },
    { input: 'U', note: 'The only one that turns a single layer, one fifth.' },
    { input: 'R++ D++ R-- D-- R++ D++ U', note: 'A line of a real scramble — ten R/D tokens then a U.' },
  ],
  invalid: [
    { input: 'R++ X++ U', note: 'A letter that names no move. Only U, R and D exist.' },
    { input: 'R+++', note: 'Names a move, then spells its direction wrong — a different mistake, and now a different code.' },
    { input: "U'' R++", note: 'U takes at most one prime.' },
    { input: 'U++', note: 'U turns one layer by a fifth, so it takes a prime rather than ++.' },
  ],
};

export const CLOCK_SAMPLES: NotationCatalogue = {
  valid: [
    {
      input: 'UR4+ DR3+ DL5- UL3+ U2- R3- D1+ L0+ ALL4- y2 U4+ R0+ D4+ L4- ALL2- DL',
      note: 'A whole official scramble: fourteen dial amounts, the flip, and one pin left up.',
    },
    { input: 'ALL1+ y2 ALL2-', note: 'y2 is a legal token in the middle — it flips the puzzle over.' },
    { input: 'DL5- DL', note: 'The same group twice: with an amount it turns a wheel, bare it closes the scramble.' },
  ],
  invalid: [
    { input: 'UR4+ 5+', note: 'An amount with no pin group in front of it.' },
    { input: 'UR4+ UR3', note: 'An amount with no sign is not an amount.' },
    { input: 'UR4+ XY1+', note: 'Shaped like a token, but XY is not one of the nine pin groups.' },
    { input: 'UR4+ UR9+', note: 'Nine hours. Twelve amounts are spelled 0+ to 6+ and 1- to 5-.' },
    { input: 'ALL1+ U', note: 'A pin group that can turn a wheel but cannot close a scramble.' },
    { input: 'UR4+ ALL', note: 'The same positional rule, on the group that names all four.' },
  ],
};

export const PYRAMINX_SAMPLES: NotationCatalogue = {
  valid: [
    { input: "U' R' U R U' B", note: 'Uppercase layer turns.' },
    { input: "R L' u l'", note: 'Layer turns, then lowercase tips — how a real scramble ends.' },
    { input: "u l r b", note: 'All four tips, which are legal moves in their own right.' },
  ],
  invalid: [
    { input: 'U R Z', note: 'A letter that names no vertex.' },
    { input: 'U f', note: 'Lowercase is a tip, but only for the four vertices.' },
    { input: 'U2', note: 'Order 3, so there is no half turn to spell. Counterclockwise is U-prime.' },
    { input: "U''", note: 'One prime per move.' },
  ],
};

export const SKEWB_SAMPLES: NotationCatalogue = {
  valid: [
    { input: "U L U B' U' B R", note: 'Fixed Corner Notation — four corners, held one still.' },
    { input: "R' L' B'", note: 'Primes are the counterclockwise turns.' },
  ],
  invalid: [
    { input: 'U L F', note: 'F names a face, and this notation names corners.' },
    { input: 'U r', note: 'No lowercase form here — unlike the Pyraminx, a Skewb has no tip.' },
    { input: 'U R2', note: 'Order 3 again, so R2 is not a move.' },
  ],
};

export const SQUARE1_SAMPLES: NotationCatalogue = {
  valid: [
    { input: '(6, 2) / (-2, 4) / (-1, -4) /', note: 'The official layout, spaces inside the pairs and all.' },
    { input: '(1,0)/(0,-2)/', note: 'The same scramble with no spaces — deliberately tolerated.' },
    { input: '(-6, 0)', note: 'A representative another generator prints. It is the same move as (6, 0).' },
  ],
  invalid: [
    { input: '(1, 0) / x', note: 'A character that belongs to no pair and is not a slice.' },
    { input: '(1 0)', note: 'A missing comma. The pair fails to match, so the ( is what is left over.' },
    { input: '(1, 0', note: 'An unbalanced parenthesis — reported the same way, and at the ( rather than at the end.' },
    { input: '(1, 0, 2)', note: 'A third number, which is the same story again.' },
    { input: '(0, 0)', note: 'Turns nothing: a spelling rather than a move, and it would still cost a move.' },
  ],
};

/** The catalogue for a notation, or `null` for the cube grammar, which has its own lists above. */
export function catalogueFor(notation: string): NotationCatalogue | null {
  switch (notation) {
    case 'megaminx':
      return MEGAMINX_SAMPLES;
    case 'clock':
      return CLOCK_SAMPLES;
    case 'pyraminx':
      return PYRAMINX_SAMPLES;
    case 'skewb':
      return SKEWB_SAMPLES;
    case 'square1':
      return SQUARE1_SAMPLES;
    default:
      return null;
  }
}
