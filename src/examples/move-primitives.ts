import {
  AMOUNTS,
  FACES,
  inverseMove,
  inverseMoves,
  moveToString,
  movesToString,
  parseMove,
  type FaceMove,
} from '@cubesmith/scrambler';

// A second, much smaller notation surface, older than the tree above and kept
// separate on purpose: `FaceMove` is a single-layer turn of one of the six
// faces, and nothing else. No wide moves, no slices, no rotations.
//
// Reach for it when you are *building* a sequence of plain face turns —
// generating drill sets, rendering a mini keyboard, writing a solver's output.
// For *reading* notation somebody else wrote, use `parseAlgorithm`: it accepts
// the full grammar, and `parseMove` is a `/^([UDFBLR])(2|')?$/` regex that
// throws on everything else.
export function primitives() {
  console.log(FACES); // ["U", "D", "F", "B", "L", "R"]
  console.log(AMOUNTS); // [1, 2, 3]  — quarter, half, counter-quarter

  // `amount` is 1, 2 or 3 — unsigned, unlike an `Algorithm`'s signed amount.
  // 3 is the counter-clockwise quarter turn and prints as a prime.
  console.log(moveToString({ face: 'R', amount: 3 })); // "R'"
  console.log(parseMove("R'")); // { face: "R", amount: 3 }

  const trigger: readonly FaceMove[] = [
    { face: 'R', amount: 1 },
    { face: 'U', amount: 1 },
    { face: 'R', amount: 3 },
    { face: 'U', amount: 3 },
  ];

  console.log(movesToString(trigger)); // "R U R' U'"
  console.log(movesToString(inverseMoves(trigger))); // "U R U' R'"
  console.log(moveToString(inverseMove({ face: 'F', amount: 2 }))); // "F2" — a half turn is its own inverse
}

// Every legal single-layer face move: the two exported constants crossed. Handy
// as the move pool for a drill generator, and a reminder that these lists come
// from the package rather than from a copy you maintain.
export function allFaceMoves(): FaceMove[] {
  return FACES.flatMap((face) => AMOUNTS.map((amount) => ({ face, amount })));
}

// The narrow acceptance is the thing to design around. `parseMove` throws a
// plain `Error` — not an `AlgorithmSyntaxError`, with no offset and no reason
// code — because it is a token check, not a parser.
export function narrowByDesign() {
  console.log(allFaceMoves().length); // 18

  for (const token of ['Rw', 'M', "x'", '3Rw']) {
    try {
      parseMove(token);
    } catch {
      console.log(`${token}: not a single-layer face move — parseAlgorithm reads this, parseMove does not.`);
    }
  }
}
