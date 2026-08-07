import { generateScramble, isImplementedEvent, type WcaEventId } from '@cubesmith/scrambler';

// `WcaEventId` is the full WCA event union. It describes the events the
// package aims to cover, not the ones it can generate today, so it will
// happily type-check `'333mbf'` even though nothing is registered for it.
//
// `isImplementedEvent` is the runtime source of truth. Check it before you
// offer an event in a picker, and you never have to maintain your own copy of
// the supported list.
export async function guarded(event: WcaEventId) {
  if (!isImplementedEvent(event)) {
    return null; // '333mbf' is the only event that fails this today.
  }

  return generateScramble(event);
}
