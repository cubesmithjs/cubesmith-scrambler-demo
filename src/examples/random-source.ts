import { createRandomSource, generateScramble, type RandomSource } from '@cubesmith/scrambler';

// The same randomness the scramblers draw from, exported so your own draws can
// share a seed with theirs. One method, `nextUint32()`, which is all any of the
// puzzle code asks for.
//
// Useful when a seed has to cover more than the scramble: assigning competitors
// to groups for a round, picking which of six drills to show, shuffling a
// practice deck. Seed those from the same string as the scramble and the whole
// round is reproducible from one short value, rather than only its cubes.
export function seededDraws() {
  const source = createRandomSource('round-1');

  console.log(source.nextUint32()); // 2081189153 — this exact number, on any machine
  console.log(source.nextUint32()); // 1536382852 — the sequence advances

  // A fresh source with the same seed starts the sequence over.
  console.log(createRandomSource('round-1').nextUint32()); // 2081189153 again

  // Numbers work as seeds too, and no seed at all means
  // `crypto.getRandomValues` — cryptographically random, not reproducible.
  createRandomSource(42);
  createRandomSource();
}

// 🔴 A seeded source is **mulberry32**, a tiny PRNG. It exists so a seed
// reproduces a scramble exactly, and it is not cryptographically secure — never
// use it for anything a person could gain by predicting. The unseeded source is
// the one backed by Web Crypto; a seeded one is reproducible *because* it is
// predictable, and those are the same property described twice.
export function pickOne<T>(items: readonly T[], source: RandomSource): T {
  if (items.length === 0) throw new Error('nothing to pick from');

  // Modulo is a slight bias unless the range divides 2^32 evenly. Fine for
  // choosing a drill; do the rejection-sampling version if the choice is worth
  // money. (The package does this properly internally — see `utils/random-int`,
  // which is not exported, because a scrambler must have no bias at all.)
  return items[source.nextUint32() % items.length] as T;
}

// Where this pays off: one seed, and everything about the round is reproducible
// — the scramble *and* every decision your app made around it.
export async function reproducibleRound(seed: string) {
  const scramble = await generateScramble('333', { seed });
  const source = createRandomSource(seed);

  return {
    moves: scramble.moves,
    judge: pickOne(['Amina', 'Yuki', 'Mateo'], source),
    station: pickOne([1, 2, 3, 4], source),
  };
}
