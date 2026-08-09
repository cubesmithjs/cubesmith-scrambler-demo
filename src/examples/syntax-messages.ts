import type { AlgorithmSyntaxError, SyntaxErrorReason } from '@cubesmith/scrambler';

/**
 * Turning a `SyntaxErrorReason` into a sentence a person can read — one *you*
 * wrote.
 *
 * 🔴 This file is the point of the whole 0.11.0 release. The package ships no
 * message strings beyond the English `.message`, and never will: it hands back
 * a stable code plus the data a message would interpolate, and the sentence
 * belongs to the consumer. That is why this table lives here, in the app, and
 * not in the library.
 *
 * Before 0.11.0 the only ways to write this file were string-matching
 * `.message` — which turns every wording change in the package into a silent
 * breakage — or reimplementing the classification, which means reimplementing
 * the tokenizer.
 *
 * This is not a demo prop: `/notation` calls exactly this function, so every
 * sentence below is one you can see rendered.
 */

/**
 * A template is a function rather than a string with placeholders, because the
 * data each code carries differs — `char`, `family`, `outer`/`inner`, `count`,
 * or nothing at all. Taking the error itself keeps every template's signature
 * identical and lets each one read only the fields its own code populates.
 */
type Template = (error: AlgorithmSyntaxError) => string;

/**
 * Every code.
 *
 * **One language ships here, and that is a choice this repo made, not one the
 * package made for it.** A second language is another table keyed exactly the
 * same way — the codes are stable, so nothing about adding one is interesting,
 * which is the whole point. The package returns a code and the data to
 * interpolate; where the sentence comes from, and how many of them there are, is
 * the consumer's business.
 *
 * A `Record` over the full union rather than a `switch` with a `default` arm,
 * deliberately: adding a code is *not* a breaking change for the package, so on
 * the release that adds one you want a compile error telling you to write the
 * new sentence — not a silent fallback that ships a vague message to users in
 * production. If you would rather never be blocked by an upgrade, make this
 * `Partial<Record<…>>` and fall back to `error.message`; just know you have
 * chosen which way the failure goes.
 *
 * Renaming a code *is* breaking, and the package says so, which is what makes
 * this table safe to key on.
 */
const MESSAGES: Record<SyntaxErrorReason, Template> = {
  'amount-zero': () => "An amount of 0 turns nothing. Write R, R2 or R' instead.",
  'layer-range-incomplete': () => 'A layer range needs a number on both sides, as in 2-3Rw.',
  'layer-range-not-ascending': (error) =>
    `A layer range counts inwards from the face, so ${error.outer}-${error.inner} is backwards.`,
  'layer-count-too-small': (error) =>
    `A wide move turns at least 2 layers, not ${error.count}. For a single layer, drop the w.`,
  'layer-prefix-without-move': () => 'A layer number has to be followed by a move, as in 3Rw.',
  'not-a-move': (error) =>
    `"${error.char}" is not a move. Faces are U D F B L R, slices M E S, rotations x y z.`,
  'family-takes-no-width': (error) =>
    `${error.family} already turns a single slice, so it takes no w.`,
  'layer-count-without-w': (error) =>
    `A layer count only applies to a wide move. Add a w, as in ${error.count}Rw.`,
  'repeated-prime': () => "Only one ' per move. R2' is fine, R'' is not.",
  'unclosed-group': () => 'This ( is never closed.',
  'empty-group': () => 'An empty group () has nothing to repeat.',
  'bracket-missing-separator': () =>
    'A bracket needs a , for a commutator or a : for a conjugate — [R, U] or [R: U].',
  'unclosed-bracket': () => 'This [ is never closed.',
  'bracket-extra-separator': () => 'A bracket takes one separator, not two.',
  'bracket-empty-half': () => 'Both halves of a bracket need moves.',
  'unmatched-close-group': () => 'This ) closes a group that was never opened.',
  'unmatched-close-bracket': () => 'This ] closes a bracket that was never opened.',
  'stray-comma': () => 'A , only means something inside a commutator, as in [R, U].',
  'stray-colon': () => 'A : only means something inside a conjugate, as in [R: U].',
  // The package documents this one as the residual: nothing the parser
  // currently produces reaches it. Kept because an error constructed without a
  // detail reports it, and because a default arm that cannot fire today is
  // cheaper than a code invented under pressure later.
  'unexpected-token': () => 'This is not valid notation here.',
};

/** The sentence to show a user, for the error the package handed you. */
export function describeSyntaxError(error: AlgorithmSyntaxError): string {
  return MESSAGES[error.reason](error);
}

/**
 * Where to point, as a compiler does: the character index the problem starts
 * at, and how many characters it covers.
 *
 * A `length` of `0` means the text is **missing** rather than wrong — `2-Rw`
 * has no second layer number to underline, and `offset` is where it should have
 * been written. Render a caret there; a zero-width highlight would be invisible
 * and a one-character one would blame the wrong character.
 *
 * The parameter is structural rather than `AlgorithmSyntaxError`, so the same
 * function serves `ScrambleSyntaxError` too. That is worth noticing: 0.12.0
 * kept the two error classes deliberately apart, and the *rendering* still
 * needs only one copy, because both classes carry `offset` and `length` with
 * the same contract. What could not be shared is the message table — see
 * `scramble-messages.ts` — and that is exactly the line the package drew.
 */
export function underlineSpan(error: { readonly offset: number; readonly length: number }): {
  readonly start: number;
  readonly width: number;
  readonly missing: boolean;
} {
  return {
    start: error.offset,
    width: Math.max(error.length, 1),
    missing: error.length === 0,
  };
}
