import Link from 'next/link';

import { DrawWorkbench } from '@/components/draw-workbench';

const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

export const metadata = {
  title: 'Drawing — @cubesmith/scrambler demo',
  description:
    'The 2D scramble picture added in 0.13.0: drawScramble for all seventeen events, returned as data rather than markup, from the separate @cubesmith/scrambler/draw entry point.',
};

export default function DrawPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
            The picture beside the scramble
          </h1>
          <span className="rounded-full border border-emerald-500/50 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
            new in 0.13.0
          </span>
        </div>
        <p className="mt-3 leading-relaxed text-neutral-400">
          Every official WCA scramble sheet prints a flat sticker net next to each scramble, so a
          delegate can check at a glance that the cube in front of them matches the paper.{' '}
          <code className="font-mono text-neutral-200">drawScramble</code> produces that net, for
          all <strong className="text-neutral-200">seventeen</strong> events. Geometry, layout
          constants and colour values are read from{' '}
          <code className="font-mono text-neutral-200">thewca/tnoodle-lib</code> source, so this is
          a transcription rather than an impression of one.
        </p>
        <p className="mt-3 leading-relaxed text-neutral-400">
          It lives behind a <strong className="text-neutral-200">second entry point</strong> —{' '}
          <code className="font-mono text-neutral-200">@cubesmith/scrambler/draw</code> — and the
          main entry re-exports nothing from it. That is not tidiness: the drawing layer is roughly
          as large as the scrambling one, and a practice timer or a results page that never draws
          anything must not pay for it. The split is verified against the built artefact rather than
          trusted, by a test that reads <code className="font-mono text-neutral-200">dist/index.js</code>{' '}
          and fails if a drawing-only symbol appears in it.
        </p>
      </section>

      <DrawWorkbench />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Data, not an SVG string
        </h2>
        <p className="leading-relaxed text-neutral-400">
          <code className="font-mono text-neutral-200">drawScramble</code> returns a{' '}
          <code className="font-mono text-neutral-200">ScrambleImage</code>: a width, a height, a
          document stroke width, and a flat array of shapes in paint order. Each shape is a{' '}
          <code className="font-mono text-neutral-200">rect</code>,{' '}
          <code className="font-mono text-neutral-200">polygon</code>,{' '}
          <code className="font-mono text-neutral-200">circle</code> or{' '}
          <code className="font-mono text-neutral-200">path</code> with a fill, a stroke, and — when
          it is a sticker — the colour-scheme key it wears.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <h3 className="font-semibold text-emerald-300">A React consumer maps it</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              One element per shape, which is what the picture above is. Every sticker keeps its own
              key, and can carry a <code className="font-mono text-neutral-300">&lt;title&gt;</code>,
              a click target or a hover state. Handed an SVG string instead, you would reach for{' '}
              <code className="font-mono text-neutral-300">dangerouslySetInnerHTML</code> and lose
              all three at the door.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 p-4">
            <h3 className="font-semibold text-neutral-200">A print route wants the string</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              So <code className="font-mono text-neutral-300">scrambleImageToSvg</code> is a thin
              serializer over exactly the same data — shown in full further up the page. Both
              consumers are served without either one paying for the other&rsquo;s shape.
            </p>
          </div>
        </div>

        <p className="leading-relaxed text-neutral-400">
          There is a third beneficiary, and it is the one that makes &ldquo;the same as
          TNoodle&rdquo; a checkable claim at all: a test can assert that the U-face centre
          rectangle sits at a given coordinate and is white. Against a string, the only available
          assertion is a substring match on markup.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Still no DOM anywhere
        </h2>
        <p className="leading-relaxed text-neutral-400">
          2D drawing is in scope precisely because it is arithmetic — numbers and colour strings.
          There is no canvas, no WebGL, no{' '}
          <code className="font-mono text-neutral-200">customElements</code>, and nothing that
          reads a layout. So the same call works in a Route Handler, in a Client Component and in a
          build script, exactly like the scrambling half; the pictures on this page are computed
          during server rendering and again in the browser, from the same function.
        </p>
        <p className="leading-relaxed text-neutral-400">
          3D is <em>not</em> in scope, and 0.13.0 did not change that. A rotating cube needs a
          renderer, a render loop and a browser — three things this package does not have and is
          not going to grow.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          What can go wrong, and what it is called
        </h2>
        <p className="leading-relaxed text-neutral-400">
          Three new error classes, and two deliberately reused ones. The reuse is the interesting
          half: a malformed scramble throws{' '}
          <code className="font-mono text-neutral-200">AlgorithmSyntaxError</code> or{' '}
          <code className="font-mono text-neutral-200">ScrambleSyntaxError</code>{' '}
          <strong className="text-neutral-200">unwrapped</strong>, so if you already handle those
          from <code className="font-mono text-neutral-200">validateScramble</code> on the{' '}
          <Link
            href="/notation"
            prefetch={STATIC_EXPORT ? false : undefined}
            className="text-emerald-400 hover:text-emerald-300"
          >
            notation page
          </Link>
          , adding drawing costs you no new handling for typos.
        </p>

        <div className="overflow-x-auto rounded-xl border border-neutral-800">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="border-b border-neutral-800 text-neutral-400">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Class
                </th>
                <th scope="col" className="px-4 py-2.5 font-medium">
                  Means
                </th>
              </tr>
            </thead>
            <tbody className="text-neutral-400">
              <tr className="border-b border-neutral-900">
                <td className="px-4 py-2.5 font-mono text-xs text-emerald-300">
                  UnimplementedDrawingError
                </td>
                <td className="px-4 py-2.5">
                  No picture for this event. Pointedly <em>not</em>{' '}
                  <code className="font-mono text-neutral-300">UnimplementedEventError</code>, which
                  means no scrambler — two different absences, and as of 0.13.0 no event has either.
                </td>
              </tr>
              <tr className="border-b border-neutral-900">
                <td className="px-4 py-2.5 font-mono text-xs text-emerald-300">
                  UnsupportedScrambleError
                </td>
                <td className="px-4 py-2.5">
                  Valid cube notation a scramble never contains: a slice move, a layer range, a
                  commutator. The text is fine; there is no cubie to move for it.
                </td>
              </tr>
              <tr className="border-b border-neutral-900">
                <td className="px-4 py-2.5 font-mono text-xs text-emerald-300">InvalidColorError</td>
                <td className="px-4 py-2.5">
                  An override that is not a colour. Checked on the way in, which is what lets the
                  serializer write attributes with no escaping.
                </td>
              </tr>
              <tr className="border-b border-neutral-900">
                <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                  AlgorithmSyntaxError
                </td>
                <td className="px-4 py-2.5">Not new. A typo in cube notation, thrown unwrapped.</td>
              </tr>
              <tr>
                <td className="px-4 py-2.5 font-mono text-xs text-neutral-500">
                  ScrambleSyntaxError
                </td>
                <td className="px-4 py-2.5">
                  Not new. A typo in one of the five bespoke grammars, thrown unwrapped.
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <p className="leading-relaxed text-neutral-400">
          Four of the five are reachable from the workbench above: the buttons under{' '}
          <em>Colours</em> and <em>Notation a drawing cannot apply</em> exist to be clicked, and a
          typo in the scramble box covers both syntax classes.{' '}
          <code className="font-mono text-neutral-200">UnimplementedDrawingError</code> is the one
          you cannot trigger here, because there is no event left that lacks a drawer — the same
          reason the scramble page had to move its typed-failure demonstration to{' '}
          <code className="font-mono text-neutral-200">InvalidScrambleCountError</code>. It is
          exported anyway, since{' '}
          <code className="font-mono text-neutral-200">WcaEventId</code> is a type union and the
          registry is a runtime fact; those can disagree in a future release, and{' '}
          <code className="font-mono text-neutral-200">isDrawableEvent(event)</code> is the
          non-throwing way to ask.
        </p>
      </section>
    </div>
  );
}
