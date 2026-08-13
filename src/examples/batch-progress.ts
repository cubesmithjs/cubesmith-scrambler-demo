import { generateScrambles } from '@cubesmith/scrambler';

// `onProgress` is AWAITED. It fires after each scramble, never before the
// first, and exactly `count` times.
export async function reportProgress() {
  await generateScrambles('333', 20, {
    onProgress: (done, total) => {
      console.log(`${done}/${total}`);
    },
  });
}

// 🔴 The distinction that decides whether a progress bar moves.
//
// `onProgress` being awaited makes yielding POSSIBLE. It does not make it
// HAPPEN. An `await` on an already-resolved promise schedules a *microtask*,
// and the browser drains the whole microtask queue before it is allowed to
// paint. So this — the obvious, correct-looking version — leaves the bar at
// zero until the batch finishes, then snaps it to full:
//
//   onProgress: async (done, total) => { setProgress(done / total); }
//
// Only a real macrotask hands the frame back. Two nested rAFs, because the
// first fires *before* the upcoming paint and the second only after it.
function nextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
  });
}

export async function progressThatActuallyPaints(setProgress: (fraction: number) => void) {
  await generateScrambles('333', 20, {
    onProgress: async (done, total) => {
      setProgress(done / total);
      await nextPaint();
    },
  });
}

// Throwing from `onProgress` propagates out of `generateScrambles` and stops
// further draws. That is the entire cancel path — which is why the signature
// takes no AbortSignal: doing so would put a DOM type in the public types of a
// package that deliberately has none, and this works in Node just as well.
class Cancelled extends Error {}

export async function cancellable(shouldStop: () => boolean) {
  try {
    return await generateScrambles('444', 100, {
      onProgress: async (done, total) => {
        if (shouldStop()) throw new Cancelled();
        console.log(`${done}/${total}`);
        await nextPaint();
      },
    });
  } catch (error) {
    if (error instanceof Cancelled) {
      // No partial array comes back — a caller asked for 100 scrambles, and 60
      // of them is not a smaller success. Nor does `onProgress` hand you the
      // scramble it just drew; it gets two counters and nothing else. So if you
      // genuinely need to keep the work done before a cancel, drive the batch
      // in chunks of your own and stop between them, rather than trying to
      // salvage one from the inside.
      console.log('stopped early');
      return [];
    }
    throw error;
  }
}
