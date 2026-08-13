import {
  defaultColorScheme,
  drawScramble,
  InvalidColorError,
} from '@cubesmith/scrambler/draw';

// `defaultColorScheme` is public because the KEY SET is what you need in order
// to override anything. Six face names for the cubes, four for Pyraminx, twelve
// for Megaminx — and twelve names for the Clock that are not faces at all.
export function readTheScheme() {
  console.log(Object.keys(defaultColorScheme('333'))); // ['B','D','F','L','R','U']
  console.log(Object.keys(defaultColorScheme('pyram'))); // ['F','D','L','R']
  console.log(Object.keys(defaultColorScheme('clock'))); // ['Front','FrontClock','FrontHand',…]

  // The values are TNoodle's own getDefaultColorScheme(), transcribed from
  // java.awt.Color to #rrggbb — not a palette this package chose.
  console.log(defaultColorScheme('333')['U']); // '#ffffff'
}

// Override a subset; the rest are inherited. This is TNoodle's "missing entries
// merged from defaults", and it means a caller who only wants a colour-blind
// friendly red does not have to restate the other five faces to get one.
export function overrideJustOne() {
  return drawScramble('333', "R U R' U'", { R: '#d55e00' });
}

// 🔴 Schemes are NOT interchangeable between puzzles. Three of them disagree
// about what colour `R` is, and the Clock's keys are not faces. Copying the
// cube's scheme onto Skewb or Square-1 produces a picture that is plausible and
// wrong — which is the worst failure mode available, because nothing throws.
// Read defaultColorScheme(event) for the event you are actually drawing.
export function doNotShareASchemeAcrossPuzzles() {
  const cube = defaultColorScheme('333');

  // Wrong: `cube` was read for a different puzzle. Keys the Clock does not have
  // are simply ignored, so this quietly draws a default Clock.
  drawScramble('clock', 'UR1+ DR2+ DL3+ UL4+ U5+ R6+ D0+ L1+ ALL2+ y2 U3+ R4+ D5+ L6+ ALL0+', cube);

  // Right: ask the puzzle what it has.
  const clock = defaultColorScheme('clock');
  console.log(Object.keys(clock));
}

// Colours are validated at the door rather than escaped on the way out, and
// that is what lets `scrambleImageToSvg` write a fill attribute with no
// escaping at all: there is one place to be right instead of one per attribute.
// Accepted: #rgb, #rrggbb, #rgba, #rrggbbaa, a CSS named colour, or 'none'.
export function whatCountsAsAColour() {
  drawScramble('222', 'R U', { U: '#fff' });
  drawScramble('222', 'R U', { U: 'rebeccapurple' });
  drawScramble('222', 'R U', { U: 'none' }); // an unpainted sticker, deliberately

  try {
    drawScramble('222', 'R U', { U: 'octarine' });
  } catch (error) {
    if (error instanceof InvalidColorError) {
      // Thrown at the call, not baked into markup a browser then guesses at.
      console.warn(error.message);
    }
  }
}
