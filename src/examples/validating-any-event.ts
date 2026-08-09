import {
  AlgorithmSyntaxError,
  ScrambleSyntaxError,
  validateScramble,
  type WcaEventId,
} from '@cubesmith/scrambler';

import { describeScrambleError } from './scramble-messages';
import { describeSyntaxError, underlineSpan } from './syntax-messages';

// New in 0.12.0. `validateAlgorithm` reads cube notation, which is twelve of
// the seventeen events; the other five — Megaminx, Clock, Pyraminx, Skewb and
// Square-1 — are written in grammars of their own. `validateScramble` is one
// door onto all six, and you pick with the thing you already have: the event.
//
// The event matters because a scramble string does not carry it. `R++ D-- U` is
// a valid Megaminx scramble and an invalid cube one, and no amount of looking at
// the characters tells you which question you meant to ask.

export function isValidFor(event: WcaEventId, text: string): boolean {
  return validateScramble(event, text).valid;
}

// Empty input is valid for every event, exactly as it is for
// `validateAlgorithm` — an empty field is not yet a mistake.
export function emptyIsValid(): boolean {
  return validateScramble('sq1', '').valid && validateScramble('333', '').valid;
}

/** What a form field wants back: usable, or a reason it is not, in words you wrote. */
export type FieldState =
  | { readonly status: 'valid' }
  | {
      readonly status: 'invalid';
      readonly message: string;
      readonly start: number;
      readonly width: number;
      readonly missing: boolean;
    };

export function checkScrambleField(event: WcaEventId, input: string): FieldState {
  const result = validateScramble(event, input);

  // The valid arm carries `notation` and nothing else — no tree, no move list.
  // There is no shared tree to hand back: five notations have five node types,
  // and a Pyraminx `2` means *counterclockwise* rather than a half turn, so one
  // merged `amount` field would carry a false meaning. If you want the cube
  // tree, ask `validateAlgorithm` for it; that is the one grammar with a public
  // one.
  if (result.valid) return { status: 'valid' };

  // 🔴 Two error classes, and `notation` is the discriminant. This is worth
  // understanding rather than working around: `ScrambleSyntaxError` is
  // deliberately NOT a subclass of `AlgorithmSyntaxError`, so an existing
  // `catch (e) { if (e instanceof AlgorithmSyntaxError) … }` written against
  // 0.11.0 cannot silently start receiving Clock codes its table has never
  // heard of.
  const message =
    result.notation === 'cube'
      ? describeSyntaxError(result.error)
      : describeScrambleError(result.error);

  // The caret is drawn by one function for both, though: `offset` and `length`
  // mean the same thing on both classes, and a `length` of 0 still means the
  // text is *missing* rather than wrong.
  return { status: 'invalid', message, ...underlineSpan(result.error) };
}

// The two classes, seen from a `catch`. The five bespoke parsers still throw —
// `validateScramble` is the non-throwing wrapper over all of them — so this is
// the shape you need if you are calling one of them directly, or writing a
// batch validator over a table of stored scrambles.
export function classifyThrown(error: unknown): string {
  if (error instanceof ScrambleSyntaxError) {
    // `error.notation` says which of the five, and codes are prefixed to match:
    // `clock-hour-out-of-range`, `square1-zero-turn`, and so on.
    return `${error.notation}: ${error.reason} at ${error.offset}`;
  }

  if (error instanceof AlgorithmSyntaxError) {
    return `cube: ${error.reason} at ${error.offset}`;
  }

  // Neither, so it is not a syntax error at all. `validateScramble` re-throws
  // these for the same reason `validateAlgorithm` does: a bug inside the package
  // must not reach your user disguised as their typo.
  throw error;
}

// A batch check over scrambles stored with the event they belong to — the case
// that was impossible before 0.12.0 without hand-rolling five parsers, since
// only the twelve cube events had anything public to call.
export function findBadScrambles(
  rows: readonly { readonly event: WcaEventId; readonly moves: string }[],
): readonly string[] {
  const problems: string[] = [];

  for (const row of rows) {
    const result = validateScramble(row.event, row.moves);
    if (result.valid) continue;
    // `.message` is, and will stay, an English sentence: the right thing to log
    // and the wrong thing to show a user. `.reason` is the one to branch on.
    problems.push(`${row.event}: ${result.error.reason} at ${result.error.offset}`);
  }

  return problems;
}
