import {
  generateScramble,
  InvalidScrambleCountError,
  MAX_SCRAMBLE_COUNT,
} from '@cubesmith/scrambler';

// Multi-Blind is one attempt over many cubes, so it is the only event that
// takes a `count`. Everything else about the call is unchanged.
export async function multiBlind() {
  const result = await generateScramble('333mbf', { count: 5 });

  console.log(result.scrambles?.length); // 5
  console.log(result.moves === result.scrambles?.[0]); // true

  // `moves` is always the first scramble, which is why code written before
  // Multi-Blind existed keeps working against this result untouched. Only
  // multi-scramble events carry `scrambles` at all, hence the optional chain.
  for (const [index, scramble] of (result.scrambles ?? [result.moves]).entries()) {
    console.log(`cube ${index + 1}: ${scramble}`);
  }

  // The draws are independent and deliberately not de-duplicated, so two cubes
  // in one attempt may legitimately get the same scramble. Do not "fix" that by
  // retrying until they differ — that would bias the distribution.

  return result;
}

// `count` on any other event throws rather than being quietly ignored. Both
// causes share one error class: the event does not do multi-scramble at all,
// or the number is outside 1..MAX_SCRAMBLE_COUNT.
export async function countIsNotUniversal() {
  try {
    await generateScramble('333', { count: 5 });
  } catch (error) {
    if (error instanceof InvalidScrambleCountError) {
      // `error.event` and `error.count` carry what was asked for.
      console.warn(`${error.event} does not take a count (asked for ${error.count}).`);
    }
  }

  // The cap is a guard, not a WCA regulation: every cube is a full random-state
  // 3x3x3 solve of roughly 100 ms, and this package has no Worker to hide that
  // work in, so an unbounded count fed from user input would block the calling
  // thread for minutes.
  console.log(MAX_SCRAMBLE_COUNT); // 100
}
