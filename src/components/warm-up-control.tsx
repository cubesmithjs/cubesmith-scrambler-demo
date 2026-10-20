'use client';

import { prepareEvent, type WcaEventId } from '@cubesmith/scrambler';
import { useState } from 'react';

import { coldCost, getEvent, preparationOf } from '@/lib/events';
import { recordPrepared, useTableState } from '@/lib/table-state';

function formatMs(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)} s`;
  return `${Math.round(ms)} ms`;
}

/** Resolves after the browser has painted, so the disabled state shows before the thread blocks. */
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

interface WarmUpControlProps {
  readonly event: WcaEventId;
  /** The surrounding page is busy — generating, or running a batch. */
  readonly disabled?: boolean;
  /** Lets the page disable its own controls while the table builds. */
  readonly onBusyChange?: (busy: boolean) => void;
}

/**
 * `prepareEvent` as a button the visitor presses.
 *
 * 🔴 It is not a spinner fix and must never read like one. `prepareEvent` is the
 * same synchronous table build a first scramble would do — it does not yield,
 * and the tab freezes while it runs. What changes is **placement**: the cost
 * lands on a button the visitor chose to press, not on the scramble they were
 * told would be fast.
 *
 * The state shown comes from {@link useTableState}, which mirrors the package's
 * module-scope tables for the whole tab — so a table warmed on another page of
 * this demo is already warm here, exactly as it is in the package.
 */
export function WarmUpControl({ event, disabled = false, onBusyChange }: WarmUpControlProps) {
  const selected = getEvent(event);
  const preparation = preparationOf(selected);
  const state = useTableState(event);
  const [preparing, setPreparing] = useState(false);

  async function prepare() {
    setPreparing(true);
    onBusyChange?.(true);
    await nextPaint();
    const startedAt = performance.now();
    try {
      await prepareEvent(event);
      recordPrepared(event, performance.now() - startedAt);
    } finally {
      setPreparing(false);
      onBusyChange?.(false);
    }
  }

  const label = preparing
    ? `Preparing ${selected.name}…`
    : state.kind === 'none'
      ? `${selected.name} has nothing to prepare`
      : state.kind === 'cold'
        ? `prepareEvent('${event}')`
        : state.kind === 'prepared'
          ? 'Prepared'
          : 'Already warm';

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={prepare}
          disabled={disabled || preparing || state.kind !== 'cold'}
          className="rounded-lg border border-neutral-700 px-4 py-1.5 font-mono text-sm text-neutral-200 transition hover:border-neutral-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {label}
        </button>
        <span
          className={[
            'rounded-full border px-2.5 py-0.5 text-xs',
            preparation.kind === 'full'
              ? 'border-emerald-500/40 text-emerald-300'
              : preparation.kind === 'partial'
                ? 'border-amber-500/50 text-amber-300'
                : 'border-neutral-700 text-neutral-400',
          ].join(' ')}
        >
          {preparation.kind === 'full'
            ? 'fully prepared by prepareEvent'
            : preparation.kind === 'partial'
              ? `partly prepared — ${preparation.leftover} still lands on the first scramble`
              : 'nothing to prepare'}
        </span>
        {state.kind === 'prepared' || state.kind === 'warm' ? (
          <span className="text-sm text-neutral-500">
            {state.prepareMs !== null ? (
              <>
                prepared in <span className="text-neutral-300">{formatMs(state.prepareMs)}</span>
                {' · '}first scramble after it:{' '}
                <span className="text-neutral-300">
                  {state.firstAfterPrepareMs !== null
                    ? formatMs(state.firstAfterPrepareMs)
                    : state.kind === 'prepared'
                      ? 'generate one to see'
                      : 'not measured here'}
                </span>
                {' · '}a cold first scramble: {coldCost(selected)}
              </>
            ) : (
              'built by an earlier scramble in this tab'
            )}
          </span>
        ) : null}
      </div>

      <p className="text-sm leading-relaxed text-neutral-500">
        {state.kind === 'none' ? (
          <>
            {selected.name} builds no pruning table, so{' '}
            <code className="font-mono text-neutral-400">prepareEvent</code> resolves at once — there
            is nothing to precompute, and that is a legitimate answer rather than an error.
          </>
        ) : state.kind === 'cold' ? (
          <>
            Builds the {selected.name} table now — {coldCost(selected)}, on the main thread.
            The page freezes while it runs, exactly as it would on a first scramble; the difference
            is that it happens when you choose.
            {preparation.kind === 'partial' ? (
              <>
                {' '}
                It does not cover everything: about {preparation.leftover} still lands on the
                first scramble, so preparing does not make that one as fast as the tenth.
              </>
            ) : null}
          </>
        ) : (
          <>
            {state.kind === 'prepared' ? 'Prepared' : 'Already warm'} — the tables live in this tab
            until you reload, so every page of this demo shares them.
            {state.kind === 'prepared' && preparation.kind === 'partial' ? (
              <> The first scramble still pays about {preparation.leftover} on top.</>
            ) : null}
          </>
        )}
      </p>
    </div>
  );
}
