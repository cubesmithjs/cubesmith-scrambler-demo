import type { ScrambleResult, WcaEventId } from '@cubesmith/scrambler';

/**
 * The shape `/api/scramble` returns.
 *
 * An unimplemented event is a normal, expected outcome rather than a crash, so
 * it comes back as a structured failure the UI can render. An
 * `UnimplementedEventError` cannot survive a trip over the network, so the
 * route flattens it into `kind: 'unimplemented'` and the page turns it back
 * into the same UI state the client-side `catch` produces.
 */
export type ScrambleResponse =
  | {
      readonly ok: true;
      readonly result: ScrambleResult;
      /** Time spent inside `generateScramble` on the server, in milliseconds. */
      readonly elapsedMs: number;
      /** True when this was the first call for this pruning table in the server process. */
      readonly cold: boolean;
    }
  | {
      readonly ok: false;
      readonly kind: 'unimplemented' | 'bad-request';
      readonly message: string;
    };

/** Where a scramble was generated. The point of the demo is that both work. */
export type RunMode = 'server' | 'client';

export interface RunError {
  readonly kind: 'unimplemented' | 'other';
  readonly message: string;
}

/** One generation attempt, successful or not, as the page displays it. */
export interface Run {
  readonly mode: RunMode;
  readonly event: WcaEventId;
  /** Time inside `generateScramble` itself, wherever it ran. */
  readonly elapsedMs: number;
  /** Full `fetch` time including the network. Server mode only. */
  readonly roundTripMs: number | null;
  /** Whether this call had to build a pruning table first. */
  readonly cold: boolean;
  readonly seed: string | null;
  readonly result: ScrambleResult | null;
  readonly error: RunError | null;
}
