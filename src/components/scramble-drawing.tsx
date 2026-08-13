import type { ImageShape, ScrambleImage } from '@cubesmith/scrambler/draw';

/**
 * A {@link ScrambleImage} rendered as React elements — one element per shape,
 * mapped straight off `image.shapes`.
 *
 * This is the reason the package returns **data** rather than an SVG string.
 * `scrambleImageToSvg` exists too and the draw page shows its output, but it
 * would have to arrive here through `dangerouslySetInnerHTML`, which throws away
 * every per-sticker key, `<title>` and event target on the way in. Mapping the
 * array keeps all three, and costs the twenty lines below.
 *
 * `viewBox` comes from the image's intrinsic size and no pixel `width`/`height`
 * is set, so the surrounding CSS decides how large this renders — the same
 * choice `scrambleImageToSvg` makes.
 */
export function ScrambleDrawing({
  image,
  className,
  title,
}: {
  readonly image: ScrambleImage;
  readonly className?: string;
  /** Accessible name. There is no sensible generic default, so callers pass one. */
  readonly title: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${image.width} ${image.height}`}
      strokeLinejoin="round"
      strokeWidth={image.strokeWidth}
      role="img"
      aria-label={title}
      className={className}
    >
      {image.shapes.map((shape, index) => (
        // The index is the only stable identity available: `shapes` is a paint
        // order, and two stickers of the same colour at different coordinates
        // are genuinely interchangeable as values. Nothing reorders the array.
        <Shape key={index} shape={shape} />
      ))}
    </svg>
  );
}

/**
 * One shape. The switch needs no `default` arm — `ImageShape` is a discriminated
 * union of exactly four kinds, so TypeScript already knows this is exhaustive,
 * and a fifth kind in a future release would become a compile error here rather
 * than a silently missing sticker.
 */
function Shape({ shape }: { readonly shape: ImageShape }) {
  // Every shape carries `fill`, `stroke` and an optional `strokeWidth`. React
  // wants `undefined` rather than an absent key to mean "inherit the root", and
  // that is exactly what the package leaves absent.
  const paint = {
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
  };

  switch (shape.kind) {
    case 'rect':
      return <rect x={shape.x} y={shape.y} width={shape.w} height={shape.h} {...paint} />;
    case 'circle':
      return <circle cx={shape.cx} cy={shape.cy} r={shape.r} {...paint} />;
    case 'polygon':
      return <polygon points={shape.points.map(([x, y]) => `${x},${y}`).join(' ')} {...paint} />;
    case 'path':
      return <path d={shape.d} {...paint} />;
  }
}
