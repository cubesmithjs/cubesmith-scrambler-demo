import { generateScramble, isImplementedEvent, type WcaEventId } from '@cubesmith/scrambler';

// `WcaEventId` is the full WCA event union. It describes the events the
// package aims to cover, not the ones it can generate today — the two have
// coincided since 0.10.0, which registered '333mbf' and took coverage to all
// seventeen, but they are still separate things and a future WCA event would
// separate them again.
//
// `isImplementedEvent` is the runtime source of truth. Check it before you
// offer an event in a picker, and you never have to maintain your own copy of
// the supported list — including on the release that makes the list complete.
export async function guarded(event: WcaEventId) {
  if (!isImplementedEvent(event)) {
    return null; // Unreachable since 0.10.0. Still the right thing to write.
  }

  return generateScramble(event);
}
