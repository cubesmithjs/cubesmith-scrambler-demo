import { generateScramble } from '@cubesmith/scrambler';

// Pass a seed and generation becomes reproducible: the same seed and the same
// event give byte-identical moves, on any machine and in any runtime. Handy
// for test fixtures, for sharing a scramble as a short string, and for giving
// every competitor in a round the same scramble.
export async function seeded() {
  const first = await generateScramble('333', { seed: 'cubesmith' });
  const second = await generateScramble('333', { seed: 'cubesmith' });

  console.log(first.moves === second.moves); // true

  // Numbers work as seeds too.
  const fromNumber = await generateScramble('222', { seed: 42 });

  // Without a seed you get a cryptographically random scramble instead.
  const random = await generateScramble('222');

  return { first, second, fromNumber, random };
}
