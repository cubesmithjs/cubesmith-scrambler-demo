// The drawing layer is a SECOND ENTRY POINT, and the import path is the whole
// point of it: the main entry re-exports nothing from here. Drawing is roughly
// as large as scrambling, and a practice timer that never draws must not pay
// for it — so this line is what opts you in.
import {
  drawableEvents,
  drawScramble,
  isDrawableEvent,
  scrambleImageToSvg,
  type ImageShape,
} from '@cubesmith/scrambler/draw';

// `drawScramble` takes the scramble as TEXT — TNoodle's own public signature —
// and that is the decision that matters. There is one path, so a scramble you
// typed, pasted, or read back out of your database draws exactly as a freshly
// generated one does. Nothing here needs a scrambler or a pruning table.
export function drawOne() {
  const image = drawScramble('333', "R U R' U' F2 L D");

  console.log(image.shapes.length); // 54 stickers
  console.log(image.width, image.height); // TNoodle's getPreferredSize()
  console.log(image.strokeWidth); // the document default; a shape may override it

  return image;
}

// What comes back is DATA — a flat array of shapes in paint order, not markup.
// Later shapes draw over earlier ones, which two of the puzzles depend on: the
// Clock lays its dial faces over a panel, and Square-1 draws its middle bar
// over the layer views. Do not sort this array.
export function readTheShapes() {
  const image = drawScramble('pyram', "L U' R U' L' R B");

  // Four kinds, as a discriminated union, so a switch over `kind` needs no
  // default arm and a fifth kind in a future release becomes a compile error
  // rather than a silently missing sticker.
  for (const shape of image.shapes) {
    console.log(describe(shape));
  }
}

function describe(shape: ImageShape): string {
  switch (shape.kind) {
    case 'rect':
      return `rect ${shape.w}x${shape.h} at ${shape.x},${shape.y} — ${shape.fill}`;
    case 'circle':
      return `circle r${shape.r} at ${shape.cx},${shape.cy} — ${shape.fill}`;
    case 'polygon':
      return `polygon of ${shape.points.length} points — ${shape.fill}`;
    case 'path':
      return `path — ${shape.fill}`;
  }
}

// `face` is the colour-scheme key a shape wears, and it is present only on the
// shapes that ARE stickers. A Clock hand and a Square-1 middle bar leave it
// absent, because inventing a face for those would be a false claim. It is what
// lets a React consumer label a sticker, and what lets a test say "every U
// shape is white" without re-deriving the layout it is checking.
export function countStickersPerFace() {
  const image = drawScramble('333', "R U R' U'");

  const perFace = new Map<string, number>();
  for (const shape of image.shapes) {
    if (shape.face === undefined) continue;
    perFace.set(shape.face, (perFace.get(shape.face) ?? 0) + 1);
  }

  console.log([...perFace]); // [['U', 9], ['R', 9], …]
}

// The other consumer of the same data: a standalone SVG document string, for a
// print route or a PDF where React is not in the picture. It writes a viewBox
// and no pixel width or height, so the medium decides how large it renders.
//
// A React app should map `image.shapes` to elements instead — see
// `src/components/scramble-drawing.tsx` in this repo, which is twenty lines.
// Feeding this string through dangerouslySetInnerHTML would throw away every
// per-sticker key, <title> and click target on the way in.
export function serializeForPrint() {
  const svg = scrambleImageToSvg(drawScramble('minx', 'R++ D-- R-- D++ U'));
  console.log(svg.startsWith('<svg')); // true
  return svg;
}

// All seventeen events draw. `isDrawableEvent` is the non-throwing way to ask,
// and it is worth using rather than assuming: WcaEventId is a TYPE union and
// the drawer registry is a RUNTIME fact, so the two can disagree in a release
// that adds an event before its picture. `drawableEvents()` enumerates them.
export function whichEventsDraw() {
  console.log(drawableEvents().length); // 17

  const event = 'sq1';
  if (isDrawableEvent(event)) {
    drawScramble(event, '(-3,-4) / (0,3) /');
  }
}
