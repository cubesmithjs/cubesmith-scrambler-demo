import { generateScramble, UnimplementedEventError } from '@cubesmith/scrambler';

import type { ScrambleResponse } from '@/lib/api';
import { getEvent, isWcaEventId } from '@/lib/events';

/**
 * The Node runtime, not Edge. Generating on the server is only worth doing
 * because the pruning tables stay in memory between requests, and that needs
 * a long-lived process.
 */
export const runtime = 'nodejs';

/** A scramble is a fresh random value; a cached one would be the same scramble for everybody. */
export const dynamic = 'force-dynamic';

/**
 * Pruning tables this process has already built, keyed by table group rather
 * than by event, because several events share one table: generate a `333` and
 * `333bf`, `333fm` and `333oh` are warm too.
 *
 * The honest caveat, which this demo would rather state than hide: on a
 * serverless host each instance has its own memory. "Warm" means warm *here*.
 * Scale out, or redeploy, and the next instance pays the cold start again.
 */
const warmedTables = new Set<string>();

export async function GET(request: Request): Promise<Response> {
  const params = new URL(request.url).searchParams;
  const event = params.get('event');
  const rawSeed = params.get('seed')?.trim();

  if (!isWcaEventId(event)) {
    return Response.json(
      { ok: false, kind: 'bad-request', message: `"${event}" is not a WCA event id.` } satisfies ScrambleResponse,
      { status: 400 },
    );
  }

  // An empty seed field means "no seed", which is not the same as seeding with "".
  const options = rawSeed ? { seed: rawSeed } : {};

  const table = getEvent(event).table;
  // Events with no pruning table have nothing to warm up, so they are never cold.
  const cold = table !== null && !warmedTables.has(table);

  try {
    const startedAt = performance.now();
    const result = await generateScramble(event, options);
    const elapsedMs = performance.now() - startedAt;

    if (table) warmedTables.add(table);

    return Response.json({ ok: true, result, elapsedMs, cold } satisfies ScrambleResponse);
  } catch (error) {
    // The one failure that is a normal outcome rather than a bug. 501 Not
    // Implemented is exactly what it means, and the body still explains it.
    if (error instanceof UnimplementedEventError) {
      return Response.json(
        { ok: false, kind: 'unimplemented', message: error.message } satisfies ScrambleResponse,
        { status: 501 },
      );
    }
    throw error;
  }
}
