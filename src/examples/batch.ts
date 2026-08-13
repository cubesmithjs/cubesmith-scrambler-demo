import {
  generateScramble,
  generateScrambles,
  InvalidScrambleCountError,
  MAX_BATCH_COUNT,
  MAX_SCRAMBLE_COUNT,
} from '@cubesmith/scrambler';

// `generateScrambles` draws N scrambles for one event from ONE random source.
// That is the whole reason it exists, and it is not a convenience wrapper.
export async function drawARound() {
  const results = await generateScrambles('333', 5, { seed: 'round-1' });

  // `results[i]` is the i-th draw, and that order is part of the contract —
  // a caller mapping a batch onto (group, attempt) slots depends on it.
  results.forEach((result, index) => {
    console.log(`attempt ${index + 1}: ${result.moves}`);
  });

  // Reproducible AND distinct. Both halves matter, and only one source gives
  // you both: same seed, same five scrambles, in the same order, anywhere.
  const again = await generateScrambles('333', 5, { seed: 'round-1' });
  console.log(again[0]?.moves === results[0]?.moves); // true

  return results;
}

// The idiom this replaced, and the measured bug in it. `generateScramble`
// builds its RandomSource from the seed on EVERY call, so a seeded loop draws
// the same scramble N times — silently, with nothing thrown and nothing logged,
// identically on every machine. That last part is what lets it survive a test
// suite: the output is stable, just wrong.
export async function theTrapThisCloses() {
  const looped: string[] = [];
  for (let index = 0; index < 5; index += 1) {
    looped.push((await generateScramble('333', { seed: 'round-1' })).moves);
  }
  console.log(new Set(looped).size); // 1 — five copies of one scramble

  const batched = await generateScrambles('333', 5, { seed: 'round-1' });
  console.log(new Set(batched.map((result) => result.moves)).size); // 5
}

// Duplicates are NOT removed, and that is deliberate rather than an oversight.
// Each draw is its own uniform draw, so a repeat is a legitimate outcome;
// filtering or re-rolling would bias the distribution. If your scramble sheet
// must not repeat, that is a policy your application owns, and it should be
// written as one — draw more and reject, and record that you did.
export async function repeatsAreLegitimate() {
  const results = await generateScrambles('222', 200);
  const distinct = new Set(results.map((result) => result.moves)).size;
  console.log(`${distinct} distinct out of ${results.length}`);
}

// Multi-Blind is the one event where a batch has two axes, and they stay
// orthogonal: `count` is how many ATTEMPTS, `cubesPerAttempt` is how many CUBES
// in one attempt. Neither borrows the other's meaning.
export async function multiBlindRound() {
  const attempts = await generateScrambles('333mbf', 3, { cubesPerAttempt: 8 });

  console.log(attempts.length); // 3 attempts
  console.log(attempts[0]?.scrambles?.length); // 8 cubes in the first

  // `cubesPerAttempt` maps onto the per-call `count`, so MAX_SCRAMBLE_COUNT
  // keeps governing cubes-per-attempt exactly as it always did. Passing it for
  // any other event throws rather than being quietly ignored.
  try {
    await generateScrambles('333', 3, { cubesPerAttempt: 8 });
  } catch (error) {
    if (error instanceof InvalidScrambleCountError) {
      console.warn(`${error.event} does not take cubes per attempt`);
    }
  }
}

// Two caps, two different numbers, on purpose. MAX_BATCH_COUNT bounds a batch;
// MAX_SCRAMBLE_COUNT bounds cubes in one multi-blind attempt. Reusing one for
// both would cap a 5x5x5 batch — about a millisecond a scramble — at the same
// limit as a 4x4x4 blindfolded attempt, where each cube is a real solve.
// Both are runaway guards against unbounded user input, not WCA regulations.
export function theTwoCaps() {
  console.log(MAX_BATCH_COUNT); // 500
  console.log(MAX_SCRAMBLE_COUNT); // 100
}
