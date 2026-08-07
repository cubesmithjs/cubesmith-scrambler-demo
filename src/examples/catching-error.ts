import {
  generateScramble,
  UnimplementedEventError,
  type ScrambleResult,
  type WcaEventId,
} from '@cubesmith/scrambler';

// If you would rather call first and handle the failure, the error is a typed
// class that carries the offending event on `error.event`. The package never
// invents a placeholder scramble for something it cannot actually generate,
// which is why this is an exception and not a silently empty string.
export async function tryScramble(event: WcaEventId): Promise<ScrambleResult | null> {
  try {
    return await generateScramble(event);
  } catch (error) {
    if (error instanceof UnimplementedEventError) {
      console.warn(`No scrambler registered for ${error.event} yet.`);
      return null;
    }

    // Anything else is a real bug: let it through rather than swallowing it.
    throw error;
  }
}
