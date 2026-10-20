import type { WcaEventId } from '@cubesmith/scrambler';
import { useSyncExternalStore } from 'react';

import { getEvent, type TableGroup } from './events';

/**
 * What this tab has built, per pruning table — the demo's mirror of state the
 * package keeps privately.
 *
 * The package holds its tables in module scope, so they live exactly as long as
 * this JavaScript context: across client-side navigation between pages, and
 * gone on a reload. A `useState` per page cannot represent that — it forgot a
 * table the moment you navigated away, so a 3x3x3 warmed on `/batch` was
 * announced as cold on `/`. That is why this is a module, like the thing it
 * tracks.
 *
 * 🔴 It is only ever a mirror. Every place in the demo that generates or
 * prepares *in the browser* reports here; a call the demo does not make cannot
 * be seen. A Route Handler warms the server process instead, so the server path
 * reports nothing.
 */
export type TableState =
  /** The event builds no table at all, so there is nothing to be cold about. */
  | { readonly kind: 'none' }
  | { readonly kind: 'cold' }
  /** `prepareEvent` ran and no scramble has been generated since. */
  | { readonly kind: 'prepared'; readonly prepareMs: number; readonly firstAfterPrepareMs: null }
  | {
      readonly kind: 'warm';
      /** Set when the table got here through `prepareEvent` rather than a first scramble. */
      readonly prepareMs: number | null;
      /** The first single scramble after preparing — the number that says what preparing bought. */
      readonly firstAfterPrepareMs: number | null;
    };

const NONE: TableState = { kind: 'none' };
const COLD: TableState = { kind: 'cold' };

const states = new Map<NonNullable<TableGroup>, TableState>();
const listeners = new Set<() => void>();

function update(table: NonNullable<TableGroup>, next: TableState): void {
  states.set(table, next);
  for (const listener of listeners) listener();
}

export function tableStateOf(event: WcaEventId): TableState {
  const table = getEvent(event).table;
  if (table === null) return NONE;
  return states.get(table) ?? COLD;
}

/** After `prepareEvent(event)` resolved in this tab, taking `prepareMs`. */
export function recordPrepared(event: WcaEventId, prepareMs: number): void {
  const table = getEvent(event).table;
  if (table === null) return;
  const current = states.get(table);
  // Preparing an already-warm table is a no-op in the package, and the
  // milliseconds it reports say so; keep the first scramble that made it warm.
  if (current?.kind === 'warm') {
    update(table, { ...current, prepareMs: current.prepareMs ?? prepareMs });
    return;
  }
  update(table, { kind: 'prepared', prepareMs, firstAfterPrepareMs: null });
}

/**
 * After a browser-side generation for `event`.
 *
 * `singleScrambleMs` is the time of one `generateScramble` call producing one
 * scramble, or `null` for anything else — a batch, or several Multi-Blind cubes
 * — since only a single scramble is comparable with the event's `firstCall`.
 */
export function recordGenerated(event: WcaEventId, singleScrambleMs: number | null): void {
  const table = getEvent(event).table;
  if (table === null) return;
  const current = states.get(table);
  if (current?.kind === 'warm') return;
  update(table, {
    kind: 'warm',
    prepareMs: current?.kind === 'prepared' ? current.prepareMs : null,
    firstAfterPrepareMs: current?.kind === 'prepared' ? singleScrambleMs : null,
  });
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/**
 * The table state for `event`, re-rendering when any page changes it.
 *
 * The server snapshot is "cold" (or "none"): the static HTML is rendered where no
 * table exists, and that is also the truth on a freshly loaded tab.
 */
export function useTableState(event: WcaEventId): TableState {
  return useSyncExternalStore(
    subscribe,
    () => tableStateOf(event),
    () => (getEvent(event).table === null ? NONE : COLD),
  );
}
