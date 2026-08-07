import type { WcaEventId } from '@cubesmith/scrambler';

/**
 * Which pruning table an event's first call has to build, or `null` when the
 * event needs no table at all.
 *
 * Events that share a table share the cold start, which is the single most
 * useful thing to know about this package's performance: once you have
 * generated one 3x3x3 scramble, the blindfolded, one-handed and fewest-moves
 * variants are already warm and cost milliseconds.
 */
export type TableGroup = '222' | '333' | '444' | 'pyram' | 'skewb' | 'sq1' | null;

export interface WcaEvent {
  readonly id: WcaEventId;
  readonly name: string;
  readonly table: TableGroup;
  /**
   * Cost of the first call while the table is still cold — as a *table row*
   * reads it, so an event that reuses another's table says so ("shares 3x3x3")
   * rather than repeating the number.
   *
   * That phrasing does not fit every sentence. Anything that needs the actual
   * duration wants `coldCost(event)`, not this.
   */
  readonly firstCall: string;
  /**
   * Cost of every call afterwards. These are randomised searches rather than
   * fixed-cost lookups, so the honest answer is a range, not an average.
   *
   * For a multi-scramble event this is the cost **per cube** and says so, since
   * the call as a whole costs `count` times it.
   */
  readonly afterwards: string;
}

/**
 * How long each pruning table takes to build, measured on the machine that
 * produced the rows below.
 *
 * Keyed by table rather than by event because that is what the cost actually
 * depends on: five events share the `333` build and all five pay exactly this
 * once, whichever of them is asked for first.
 */
const TABLE_COLD_COST: Record<NonNullable<TableGroup>, string> = {
  '222': '~4 s',
  '333': '~8 s',
  '444': '~7 s',
  pyram: '~200 ms',
  skewb: '~600 ms',
  sq1: '~4 s',
};

/**
 * All seventeen WCA events, in official WCA order.
 *
 * Note there is no `implemented` flag here on purpose. `isImplementedEvent()`
 * from the package is the runtime source of truth, and hardcoding a second
 * copy of that list is exactly the drift this demo is trying to teach you to
 * avoid. The timings are measured on one laptop under Node 22 (see the
 * README) and are here to convey orders of magnitude; the page shows you the
 * real number for your own machine on every run.
 */
export const WCA_EVENTS: readonly WcaEvent[] = [
  { id: '333', name: '3x3x3', table: '333', firstCall: '~8 s', afterwards: '1-300 ms' },
  { id: '222', name: '2x2x2', table: '222', firstCall: '~4 s', afterwards: 'under 1 ms' },
  { id: '444', name: '4x4x4', table: '444', firstCall: '~7 s', afterwards: '110 ms - 1.3 s' },
  { id: '555', name: '5x5x5', table: null, firstCall: 'none', afterwards: 'under 1 ms' },
  { id: '666', name: '6x6x6', table: null, firstCall: 'none', afterwards: '~1 ms' },
  { id: '777', name: '7x7x7', table: null, firstCall: 'none', afterwards: 'under 1 ms' },
  { id: '333bf', name: '3x3x3 Blindfolded', table: '333', firstCall: 'shares 3x3x3', afterwards: '40-100 ms' },
  { id: '333fm', name: '3x3x3 Fewest Moves', table: '333', firstCall: 'shares 3x3x3', afterwards: '40-110 ms' },
  { id: '333oh', name: '3x3x3 One-Handed', table: '333', firstCall: 'shares 3x3x3', afterwards: '40-80 ms' },
  { id: 'clock', name: 'Clock', table: null, firstCall: 'none', afterwards: 'under 1 ms' },
  { id: 'minx', name: 'Megaminx', table: null, firstCall: 'none', afterwards: 'under 1 ms' },
  { id: 'pyram', name: 'Pyraminx', table: 'pyram', firstCall: '~200 ms', afterwards: 'under 1 ms' },
  { id: 'skewb', name: 'Skewb', table: 'skewb', firstCall: '~600 ms', afterwards: 'under 1 ms' },
  { id: 'sq1', name: 'Square-1', table: 'sq1', firstCall: '~4 s', afterwards: '1 ms - 2 s' },
  { id: '444bf', name: '4x4x4 Blindfolded', table: '444', firstCall: 'shares 4x4x4', afterwards: '400 ms - 1 s' },
  { id: '555bf', name: '5x5x5 Blindfolded', table: null, firstCall: 'none', afterwards: 'under 1 ms' },
  // One attempt over many cubes, each cube a full random-state 3x3x3 solve, so
  // this is the only row whose steady-state cost is per *cube* rather than per
  // call — a `count` of 10 costs ten times what is quoted here.
  {
    id: '333mbf',
    name: '3x3x3 Multi-Blind',
    table: '333',
    firstCall: 'shares 3x3x3',
    afterwards: '40 ms - 1 s per cube',
  },
];

const BY_ID = new Map(WCA_EVENTS.map((event) => [event.id, event]));

export function getEvent(id: WcaEventId): WcaEvent {
  const event = BY_ID.get(id);
  if (!event) throw new Error(`unknown event "${id}"`);
  return event;
}

/**
 * How long this event's cold start actually takes, or `null` when it needs no
 * table and so has none.
 *
 * `firstCall` cannot answer this for the five events that share another's
 * table: it reads "shares 3x3x3", which is right in a table cell and nonsense
 * in a sentence like "this will freeze the page for about …".
 */
export function coldCost(event: WcaEvent): string | null {
  return event.table === null ? null : TABLE_COLD_COST[event.table];
}

/** Narrows an arbitrary string from a query param or form field to a `WcaEventId`. */
export function isWcaEventId(value: unknown): value is WcaEventId {
  return typeof value === 'string' && BY_ID.has(value as WcaEventId);
}
