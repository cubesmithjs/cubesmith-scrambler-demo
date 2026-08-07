import { generateScramble } from '@cubesmith/scrambler';

// The whole API for the common case. `generateScramble` is `async` so the
// package can add lazily-loaded puzzle data later without a breaking change;
// the work today is plain synchronous computation on the calling thread.
export async function basic() {
  const result = await generateScramble('333');

  console.log(result.moves); // "R2 F2 D' F2 D B2 D' B2 U B2 L2 ..."
  console.log(result.event); // "333"
  console.log(result.quality); // "random-state"

  return result;
}
