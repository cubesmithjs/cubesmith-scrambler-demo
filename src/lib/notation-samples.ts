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
 * Scrambles from the five puzzles whose notation is deliberately *not* this
 * grammar. Parsing one throws, which is the documented behaviour rather than a
 * gap: a Pyraminx `2` means counterclockwise, not a half turn, so folding these
 * into one type would be actively wrong.
 */
export const FOREIGN_NOTATION_SAMPLES: readonly NotationSample[] = [
  { input: 'R++ D-- U', note: 'Megaminx — Pochmann notation.' },
  { input: 'UR2+ DR4- ALL1+ y2 U4+', note: 'Clock — pins and hours.' },
  { input: '(-3,2)/ (3,0)/ (1,-3)', note: 'Square-1 — slice-and-turn pairs.' },
];
