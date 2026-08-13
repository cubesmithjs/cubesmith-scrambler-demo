import { generateScrambles, prepareEvent } from '@cubesmith/scrambler';

// `prepareEvent` builds whatever a puzzle precomputes — lookup tables, pruning
// tables, move permutations — when YOU choose, instead of charging it to the
// first scramble somebody is waiting on. Nothing else changes: it is the same
// tables, built at a different moment.
export async function warmUpBeforeTheUserArrives() {
  console.time('prepare');
  await prepareEvent('333');
  console.timeEnd('prepare'); // seconds

  console.time('first scramble');
  await generateScrambles('333', 12, { seed: 'round-1' });
  console.timeEnd('first scramble'); // milliseconds
}

// It resolves immediately for an event with nothing to precompute. Clock is
// linear algebra over Z12 and Megaminx is random-moves, so neither has a table
// to build — that is a legitimate answer, not a silent failure or a no-op you
// should route around.
export async function nothingToPrepareIsFine() {
  await prepareEvent('clock');
  await prepareEvent('minx');
}

// 🔴 It is NOT "generate a scramble and throw it away", and the difference is
// correctness rather than tidiness. A discarded draw consumes entropy from the
// source, which would shift every later scramble under a seed — turning a
// performance helper into a silent reproducibility bug. The package asserts
// that a seeded batch is byte-identical with and without a preceding prepare.
export async function preparingDoesNotDisturbTheSeed() {
  const cold = await generateScrambles('222', 5, { seed: 'fixed' });

  await prepareEvent('222');
  const warm = await generateScrambles('222', 5, { seed: 'fixed' });

  console.log(
    cold.every((result, index) => result.moves === warm[index]?.moves), // true
  );
}

// Where to call it. On a server, at boot or behind a health check, so the first
// visitor is not the one who pays. In a browser, behind an explicit "preparing
// scrambles" screen — the work still blocks the main thread, and prepareEvent
// moves that block somewhere you have already told the user about rather than
// removing it.
export async function serverBoot() {
  // Sequential, not Promise.all: these are CPU-bound and single-threaded, so
  // racing them just interleaves the same total work and reports a misleading
  // per-event time.
  for (const event of ['333', '222', 'skewb', 'pyram'] as const) {
    await prepareEvent(event);
  }
}

// One honest caveat the package documents rather than glosses: 4x4x4 is the
// event where preparing does NOT make the first scramble as fast as the tenth.
// Two things stay lazy on purpose — the per-group wing-pair tables, which cost
// about 8.5 s that a single scramble does not need and measurably make the
// TOTAL worse, and the centre-generator library, which is a search rather than
// a table and costs more to pre-build than a first scramble does. Square-1
// leaves about 1.5 s for the same reason. Prepare it anyway; just do not budget
// as though the first 4x4x4 will be free.
export async function theFourByFourCaveat() {
  await prepareEvent('444');
  const results = await generateScrambles('444', 3);
  console.log(results.length);
}
