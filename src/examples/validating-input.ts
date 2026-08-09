import {
  AlgorithmSyntaxError,
  parseAlgorithm,
  validateAlgorithm,
  type Algorithm,
} from '@cubesmith/scrambler';

import { describeSyntaxError, underlineSpan } from './syntax-messages';

// Two ways to read notation, for two different situations. Picking the wrong
// one is the most common way to make this layer feel awkward.
//
// `parseAlgorithm` throws. Right when invalid input is *exceptional* — a stored
// algorithm library, a scramble coming back from your own API, a migration.
// There, an exception is the correct control flow: something upstream is broken
// and you want a stack trace.
//
// `validateAlgorithm` returns a result. Right when invalid input is *normal* —
// a text field, where "not valid yet" is the state the user spends most of
// their keystrokes in. Throwing once per keypress is exceptions as control flow.

/** What a form field wants back on every keystroke: usable, or a reason it is not. */
export type FieldState =
  | { readonly status: 'valid'; readonly algorithm: Algorithm }
  | {
      readonly status: 'invalid';
      readonly message: string;
      readonly start: number;
      readonly width: number;
      readonly missing: boolean;
    };

export function checkField(input: string): FieldState {
  const result = validateAlgorithm(input);

  // Empty input is the empty algorithm, not an error — the same answer
  // `parseAlgorithm('')` gives. An empty field is not yet a mistake, so this
  // arm needs no special case above.
  if (result.valid) {
    return { status: 'valid', algorithm: result.algorithm };
  }

  // The tree comes back on the valid arm, so a field that has already been
  // validated does not need parsing a second time to be used.
  return {
    status: 'invalid',
    message: describeSyntaxError(result.error),
    ...underlineSpan(result.error),
  };
}

// `validateAlgorithm` re-throws anything that is not a syntax error. That is a
// deliberate boundary rather than an oversight: a bug inside the package must
// not reach your user disguised as their typo. So the `false` arm always means
// "the input is wrong", never "something went wrong".
export function whatValidateDoesNotSwallow(input: string): boolean {
  const result = validateAlgorithm(input); // may throw — and should, if it does
  return result.valid;
}

// The throwing side, for the case it is meant for. The error carries `input`,
// `offset`, `length`, `reason` and whichever of `char` / `family` /
// `outer` / `inner` / `count` its code populates — so a batch validator can
// report *where* and *what*, not just "invalid".
export function validateLibrary(algorithms: readonly string[]): void {
  for (const source of algorithms) {
    try {
      parseAlgorithm(source);
    } catch (error) {
      if (error instanceof AlgorithmSyntaxError) {
        // `.message` is, and will stay, an English sentence: it is the right
        // thing to log and the wrong thing to show a user. `.reason` is the
        // one to branch on.
        console.error(`${source}: ${error.reason} at ${error.offset} — ${error.message}`);
        continue;
      }

      throw error;
    }
  }
}
