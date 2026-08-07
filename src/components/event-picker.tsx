'use client';

import { isImplementedEvent, type WcaEventId } from '@cubesmith/scrambler';

import { WCA_EVENTS } from '@/lib/events';

interface EventPickerProps {
  readonly value: WcaEventId;
  readonly onChange: (event: WcaEventId) => void;
  readonly disabled: boolean;
}

/**
 * All seventeen WCA events, including the one that does not work.
 *
 * The "no scrambler" mark comes from the package's own `isImplementedEvent`
 * rather than from a list maintained here, so when a future release registers
 * `333mbf` this picker starts offering it with no code change.
 */
export function EventPicker({ value, onChange, disabled }: EventPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
      {WCA_EVENTS.map((event) => {
        const implemented = isImplementedEvent(event.id);
        const selected = event.id === value;

        return (
          <button
            key={event.id}
            type="button"
            data-event={event.id}
            onClick={() => onChange(event.id)}
            disabled={disabled}
            aria-pressed={selected}
            className={[
              'rounded-lg border px-3 py-2 text-left transition disabled:opacity-40',
              selected
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-neutral-800 hover:border-neutral-600',
              implemented ? '' : 'border-dashed',
            ].join(' ')}
          >
            <span className="block text-sm font-medium text-neutral-100">{event.name}</span>
            <span className="block font-mono text-xs text-neutral-500">
              {implemented ? event.id : `${event.id} · no scrambler`}
            </span>
          </button>
        );
      })}
    </div>
  );
}
