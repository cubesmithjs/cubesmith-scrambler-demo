/**
 * One seeded batch in a brand-new copy of the package.
 *
 * A Worker has its own module graph, so the package loaded here has built no
 * table yet — whatever the page has already warmed. That makes it the one
 * honest way to run "cold" twice inside a tab: two Workers are two fresh
 * processes, which is exactly how the package's own test compares a seeded batch
 * with and without a preceding `prepareEvent`.
 *
 * Used only by the comparison panel on /batch. The package itself needs no
 * Worker anywhere else on this site.
 */
import { generateScrambles, prepareEvent, type WcaEventId } from '@cubesmith/scrambler';

export interface SeededBatchRequest {
  readonly event: WcaEventId;
  readonly seed: string;
  readonly count: number;
  readonly prepare: boolean;
}

export type SeededBatchReply =
  | {
      readonly ok: true;
      readonly moves: readonly string[];
      readonly prepareMs: number | null;
      readonly batchMs: number;
    }
  | { readonly ok: false; readonly message: string };

// Typed locally rather than by adding the `webworker` lib, which would change
// what `self` means for every other file in the project.
const scope = globalThis as unknown as {
  onmessage: ((message: { readonly data: SeededBatchRequest }) => void) | null;
  postMessage: (reply: SeededBatchReply) => void;
};

scope.onmessage = async ({ data }) => {
  try {
    let prepareMs: number | null = null;
    if (data.prepare) {
      const startedAt = performance.now();
      await prepareEvent(data.event);
      prepareMs = performance.now() - startedAt;
    }

    const startedAt = performance.now();
    const results = await generateScrambles(data.event, data.count, { seed: data.seed });
    scope.postMessage({
      ok: true,
      moves: results.map((result) => (result.scrambles ?? [result.moves]).join(' | ')),
      prepareMs,
      batchMs: performance.now() - startedAt,
    });
  } catch (error) {
    scope.postMessage({ ok: false, message: error instanceof Error ? error.message : String(error) });
  }
};
