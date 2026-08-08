import { invertAlgorithm, parseAlgorithm, serializeAlgorithm } from '@cubesmith/scrambler';

// The package does not only *print* notation, it reads it. `parseAlgorithm`
// turns a string into a typed tree, `serializeAlgorithm` writes a tree back
// out, and `invertAlgorithm` returns the tree that undoes it.
//
// None of this touches a puzzle, so none of it needs a pruning table: unlike
// `generateScramble`, these three are instant on their first call and cost the
// same in a browser as on a server.
export function readAndInvert() {
  // Comments (`// …`) and every kind of whitespace are separators, so notation
  // copied out of an algorithm sheet parses as-is.
  const sexy = parseAlgorithm("R U R' U' // sexy move");

  console.log(sexy.nodes.length); // 4 — the comment is not a node
  console.log(serializeAlgorithm(invertAlgorithm(sexy))); // "U R U' R'"

  // Wide moves, slices, rotations, groups, commutators, conjugates and pauses
  // all round-trip. Inverting a conjugate `[A: B]` inverts only `B`, because
  // `A B A'` undone is `A B' A'` — the setup is not reversed.
  const conjugate = parseAlgorithm("[R: (U Rw U')2]");
  console.log(serializeAlgorithm(invertAlgorithm(conjugate))); // "[R: (U Rw' U')2]"

  return { sexy, conjugate };
}

// `serializeAlgorithm(parseAlgorithm(s))` gives back `s` unchanged, with three
// documented exceptions — spellings that resolve at parse time, so the tree
// does not remember which one you wrote. Worth knowing before you store the
// output next to the input and wonder why they differ.
export function normalizations() {
  const roundTrip = (input: string) => serializeAlgorithm(parseAlgorithm(input));

  console.log(roundTrip("r U l'")); // "Rw U Lw'"  — lowercase is a wide move
  console.log(roundTrip('2Rw')); // "Rw"       — the same block, spelled shorter
  console.log(roundTrip("2-3Rw' x2 M' . (R U)2")); // unchanged

  // What is *not* normalised: nothing cancels and nothing reorders. This layer
  // is syntax with no puzzle behind it, so `R R` is two moves and `R2` inverts
  // to `R2'` rather than to itself. A move order is a property of a puzzle, not
  // of notation.
  console.log(roundTrip('R R')); // "R R"
  console.log(serializeAlgorithm(invertAlgorithm(parseAlgorithm('R2')))); // "R2'"
}

// The five bespoke puzzle notations — Megaminx's `R++ D--`, Clock's pin syntax,
// Pyraminx's and Skewb's order-3 turns, Square-1's `(a,b)/` — are deliberately
// not part of this grammar, and parsing one throws rather than half-working. If
// you hold a scramble string, parse it only when you know it came from a cube
// event.
export function notEveryScrambleIsParseable() {
  try {
    parseAlgorithm('R++ D-- U'); // a Megaminx scramble
  } catch {
    console.log('Megaminx notation is not cube notation, by design.');
  }
}
