import { AlgorithmSyntaxError, ScrambleSyntaxError, validateScramble } from '@cubesmith/scrambler';
import {
  drawScramble,
  InvalidColorError,
  UnimplementedDrawingError,
  UnsupportedScrambleError,
} from '@cubesmith/scrambler/draw';

// Five things a draw can throw, and only three of them are new. The two reused
// ones are the interesting half: a malformed scramble throws the package's
// EXISTING syntax errors, unwrapped, so a consumer already handling those from
// validateScramble keeps its handling and writes nothing new for typos.
export function handleEveryFailure(event: '333' | 'sq1', scramble: string) {
  try {
    return drawScramble(event, scramble);
  } catch (error) {
    if (error instanceof UnsupportedScrambleError) {
      // Valid cube notation a WCA scramble never contains — a slice move, a
      // layer range, a commutator. The text parsed fine; there is no cubie to
      // move for it. Distinct from a syntax error on purpose: telling a user
      // "that is a typo" when they wrote a perfectly good commutator is worse
      // than saying nothing.
      console.warn(`cannot draw that: ${error.message}`);
    } else if (error instanceof UnimplementedDrawingError) {
      // No PICTURE for this event. Deliberately not UnimplementedEventError,
      // which means no SCRAMBLER — two different absences, and conflating them
      // would send a caller looking for the wrong missing thing. Unreachable as
      // of 0.13.0, since all seventeen events draw; catch it anyway, because
      // WcaEventId is a type union and the registry is a runtime fact.
      console.warn(`no drawing for ${error.message}`);
    } else if (error instanceof InvalidColorError) {
      console.warn(`bad colour override: ${error.message}`);
    } else if (error instanceof ScrambleSyntaxError) {
      // One of the five bespoke grammars — Megaminx, Clock, Pyraminx, Skewb,
      // Square-1. Same offset, span and stable reason code validateScramble
      // returns, because it is the same class, thrown unwrapped.
      console.warn(`${error.reason} at ${error.offset}, ${error.length} long`);
    } else if (error instanceof AlgorithmSyntaxError) {
      // Cube notation. Same deal — the class parseAlgorithm throws.
      console.warn(`${error.reason} at ${error.offset}, ${error.length} long`);
    } else {
      throw error;
    }
    return null;
  }
}

// The three inputs that produce UnsupportedScrambleError, which is the one new
// class you are unlikely to hit by accident: it needs input that is VALID and
// still undrawable.
export function validNotationADrawingCannotApply() {
  const cases = ["R U M' U'", '[R, U]', '2-3Rw U'];

  for (const scramble of cases) {
    try {
      drawScramble('333', scramble);
    } catch (error) {
      console.log(scramble, error instanceof UnsupportedScrambleError); // true, all three
    }
  }
}

// If you only want to know whether it will draw, check first rather than
// catching: a throw is the wrong control flow for "the user is still typing".
// `validateScramble` is the non-throwing check and covers all six grammars.
//
// Note what it does NOT cover, though, and why the try/catch above still earns
// its place. Validation answers a question about SYNTAX, so `R U M' U'` passes
// it and still cannot be drawn. Validate to decide whether to show a red
// squiggle; catch to decide whether there is a picture.
export function validateThenDraw(scramble: string) {
  const check = validateScramble('333', scramble);
  if (!check.valid) {
    return { picture: null, message: `${check.error.reason} at ${check.error.offset}` };
  }

  try {
    return { picture: drawScramble('333', scramble), message: null };
  } catch (error) {
    if (error instanceof UnsupportedScrambleError) {
      return { picture: null, message: 'valid notation, but not something a scramble contains' };
    }
    throw error;
  }
}
