import {
  generateScramble,
  InvalidScrambleCountError,
  UnimplementedEventError,
} from '@cubesmith/scrambler';

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
  const rawCount = params.get('count')?.trim();

  if (!isWcaEventId(event)) {
    return Response.json(
      { ok: false, kind: 'bad-request', message: `"${event}" is not a WCA event id.` } satisfies ScrambleResponse,
      { status: 400 },
    );
  }

  // Only the *syntax* is checked here — "is this a number at all". Whether the
  // number is usable is the package's call, not ours: `333mbf` accepts a count,
  // every other event rejects one, and the bound is `MAX_SCRAMBLE_COUNT`. Range-
  // checking here as well would mean two copies of a rule the package already
  // owns, and the copy here would be the one that silently goes stale.
  if (rawCount !== undefined && !/^-?\d+$/.test(rawCount)) {
    return Response.json(
      { ok: false, kind: 'bad-request', message: `"${rawCount}" is not a whole number.` } satisfies ScrambleResponse,
      { status: 400 },
    );
  }

  // An empty seed field means "no seed", which is not the same as seeding with "".
  const options = {
    ...(rawSeed ? { seed: rawSeed } : {}),
    ...(rawCount !== undefined ? { count: Number(rawCount) } : {}),
  };

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
    // Two failures that are normal outcomes rather than bugs.

    // 501 Not Implemented is exactly what it means, and the body still explains
    // it. Unreachable from the picker since 0.10.0 completed the event set —
    // kept because the route is a public URL anyone can call, and because a
    // future WCA event would make it reachable again the day it is added.
    if (error instanceof UnimplementedEventError) {
      return Response.json(
        { ok: false, kind: 'unimplemented', message: error.message } satisfies ScrambleResponse,
        { status: 501 },
      );
    }

    // A caller mistake, so 400 rather than 501: the event exists and works, the
    // count asked for is the part that cannot be honoured.
    if (error instanceof InvalidScrambleCountError) {
      return Response.json(
        { ok: false, kind: 'invalid-count', message: error.message } satisfies ScrambleResponse,
        { status: 400 },
      );
    }

    throw error;
  }
}
