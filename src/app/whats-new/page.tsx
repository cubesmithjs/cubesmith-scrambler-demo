import Link from 'next/link';

import { CompatibilityChecks } from '@/components/compatibility-checks';
import { SeamCheck } from '@/components/seam-check';

const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';
const PREFETCH = STATIC_EXPORT ? false : undefined;

const CHANGELOG_URL = 'https://github.com/cubesmithjs/cubesmith-scrambler/blob/main/CHANGELOG.md';

export const metadata = {
  title: "What's new — @cubesmith/scrambler demo",
  description:
    'Everything that changed between 0.12.0 and 0.15.0: the Face Turning Octahedron, sixteen unofficial events, batch generation, prepareEvent, 2D drawing, and the scrambles that emit a different string than they used to.',
};

export default function WhatsNewPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
          0.12.0 &rarr; 0.15.0
        </h1>
        <p className="mt-3 leading-relaxed text-neutral-400">
          Three releases. <strong className="text-neutral-200">0.15.0</strong> added the Face
          Turning Octahedron, sixteen unofficial events behind entry points of their own, and a fix
          that stops a 3x3x3 scramble printing a turn that merges into the one before.{' '}
          <strong className="text-neutral-200">0.13.0</strong> added two public
          surfaces a competition scramble set needs and 0.12.0 did not have — a batch draw and 2D
          drawing for all seventeen events — plus a warm-up helper.{' '}
          <strong className="text-neutral-200">0.14.0</strong> added no API at all and instead
          changed what two events emit: Clock now matches TNoodle&rsquo;s token format exactly, and
          4x4x4 scrambles are roughly 40% shorter.
        </p>
        <p className="mt-3 leading-relaxed text-neutral-400">
          Everything below is live on this site, not a list of release notes. The two new APIs have
          their own pages; the two emit changes are checked in your browser as this page renders.
          The package&rsquo;s own{' '}
          <a
            href={CHANGELOG_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300"
          >
            CHANGELOG
            <span className="sr-only"> (opens in a new tab)</span>
          </a>{' '}
          is the authority on any of it.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3 border-b border-neutral-900 pb-3">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
            0.15.0 — an eighteenth event, sixteen unofficial ones, and a fix
          </h2>
          <span className="text-sm text-neutral-500">two unions grew; some seeded 3x3x3 output changes</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            href="/notation"
            title="fto"
            body="The Face Turning Octahedron, official from 2027-01-02: random-state scrambles, a seventh grammar with two reason codes, and a drawing. Its notation and minimum solve distance are provisional until the WCA publishes the FTO regulations. It is on every page that lists events."
            cta="Its grammar on /notation"
          />
          <Card
            href="/unofficial"
            title="@cubesmith/scrambler/unofficial"
            body="Big cubes to 12x12x12, blindfolded variants and six 3x3x3 shape mods, behind two entry points of their own, so a WCA-only app bundles none of it and isImplementedEvent still answers no for them."
            cta="Generate and draw them"
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="font-mono text-sm font-semibold text-emerald-300">No repeated turn at the 3x3x3 seam</h3>
          <p className="text-sm leading-relaxed text-neutral-400">
            The 3x3x3 solver works in two phases, and where they met it could print{' '}
            <code className="font-mono text-neutral-200">R2 R&apos;</code>, or{' '}
            <code className="font-mono text-neutral-200">R2 L2 R&apos;</code> through the opposite face:
            one turn longer than what it performs. 0.15.0 makes the second phase read the first
            one&apos;s moves. It reaches every 3x3x3-family event:{' '}
            <code className="font-mono text-neutral-200">333</code>,{' '}
            <code className="font-mono text-neutral-200">333oh</code>,{' '}
            <code className="font-mono text-neutral-200">333bf</code>,{' '}
            <code className="font-mono text-neutral-200">333fm</code> and{' '}
            <code className="font-mono text-neutral-200">333mbf</code>.
          </p>
          <SeamCheck />
        </div>

        <p className="text-sm leading-relaxed text-neutral-400">
          <strong className="text-neutral-200">Upgrading:</strong> a seeded 3x3x3-family scramble
          changes only if its seed produced one of those repeats (28 of 300 in the package&apos;s
          sample); every other seed gives the same string. An exhaustive{' '}
          <code className="font-mono text-neutral-200">switch</code> or{' '}
          <code className="font-mono text-neutral-200">Record</code> over{' '}
          <code className="font-mono text-neutral-200">WcaEventId</code>,{' '}
          <code className="font-mono text-neutral-200">Notation</code> or{' '}
          <code className="font-mono text-neutral-200">ScrambleErrorReason</code> needs an{' '}
          <code className="font-mono text-neutral-200">&apos;fto&apos;</code> arm — this demo had two.
          And before 1.0, a <code className="font-mono text-neutral-200">^0.14</code> range does not
          include 0.15.0.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3 border-b border-neutral-900 pb-3">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
            0.13.0 — two new surfaces
          </h2>
          <span className="text-sm text-neutral-500">additive; nothing breaks</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card
            href="/batch"
            title="generateScrambles"
            body="N scrambles for one event from one random source, in draw order. Not sugar over a loop — the loop it replaces returns the same scramble n times whenever a seed is passed, which is a real bug this closes rather than a convenience."
            cta="Draw a batch"
          />
          <Card
            href="/draw"
            title="@cubesmith/scrambler/draw"
            body="A second entry point: the flat sticker net beside every scramble on a WCA sheet, for all seventeen events, returned as data rather than markup. The main entry re-exports nothing from it, so a consumer that only scrambles never pays for it."
            cta="Draw a scramble"
          />
          <Card
            href="/batch"
            title="onProgress"
            body="Awaited, called after each scramble, exactly count times. Throwing from it is the cancel path — which is why there is no AbortSignal, and therefore no DOM type in the package's public types."
            cta="Watch a progress bar freeze"
          />
          <Card
            href="/batch"
            title="prepareEvent"
            body="Builds a puzzle's tables when you choose rather than charging them to the first scramble somebody is waiting for. Pointedly not implemented as 'generate one and throw it away' — a discarded draw consumes entropy and would shift every later scramble under a seed."
            cta="Pay a cold start on purpose"
          />
        </div>

        <p className="leading-relaxed text-neutral-400">
          One more number worth knowing before you upgrade: the main entry grew by{' '}
          <strong className="text-neutral-200">1.2 kB gzipped</strong> (48.3 → 49.6 kB), and{' '}
          <em>none</em> of that is drawing code. The <code className="font-mono text-neutral-200">./draw</code>{' '}
          entry is a separate 23.6 kB you only pay for by importing it. That split is verified
          against the built artefact rather than trusted — a test reads{' '}
          <code className="font-mono text-neutral-200">dist/index.js</code> and asserts seven
          drawing-only symbols are absent from it, including a Megaminx colour value that appears
          nowhere else in the package.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline gap-3 border-b border-neutral-900 pb-3">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
            0.13.0 &amp; 0.14.0 — three events emit a different string
          </h2>
          <span className="text-sm text-neutral-500">checked live, below</span>
        </div>

        <p className="leading-relaxed text-neutral-400">
          These are the changes to read carefully, because they are the only ones a consumer can see
          without calling anything new. All three follow the same rule, and it is worth stating once
          before the panels: <strong className="text-neutral-200">emit narrow, accept wide</strong>.
          What the package <em>writes</em> got stricter. What it <em>reads</em> did not change at
          all, so a scramble already stored in your database still parses, still validates and still
          draws.
        </p>

        <p className="leading-relaxed text-neutral-400">
          One consequence to plan for: seeded output for <code className="font-mono text-neutral-200">clock</code>,{' '}
          <code className="font-mono text-neutral-200">sq1</code>,{' '}
          <code className="font-mono text-neutral-200">444</code> and{' '}
          <code className="font-mono text-neutral-200">444bf</code> differs from 0.12.0. If you pin
          scrambles by seed and compare the strings — a snapshot test, a fixture file — those four
          need re-recording. The other thirteen events emit exactly what they did.
        </p>

        <CompatibilityChecks />
      </section>

      <section className="flex flex-col gap-4">
        <div className="border-b border-neutral-900 pb-3">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
            What did not change
          </h2>
        </div>
        <p className="leading-relaxed text-neutral-400">
          No public API was removed or altered across either release.{' '}
          <code className="font-mono text-neutral-200">generateScramble</code>, its options and its
          result type are untouched;{' '}
          <code className="font-mono text-neutral-200">validateScramble</code>,{' '}
          <code className="font-mono text-neutral-200">validateAlgorithm</code> and the whole{' '}
          <Link href="/notation" prefetch={PREFETCH} className="text-emerald-400 hover:text-emerald-300">
            notation layer
          </Link>{' '}
          keep their signatures and their types. The{' '}
          <code className="font-mono text-neutral-200">.d.ts</code> for the main entry gained
          declarations and lost none.
        </p>
        <p className="leading-relaxed text-neutral-400">
          Still no dependencies, still no Web Worker, still no DOM — including in the drawing layer,
          which is in scope precisely because 2D is arithmetic. Still ESM-only and Node 18 or newer.
          The package remains pre-1.0, where by convention a minor bump may carry a visible
          behaviour change, which is why the Clock and 4x4x4 work shipped as 0.14.0 rather than
          0.13.1.
        </p>
      </section>
    </div>
  );
}

function Card({
  href,
  title,
  body,
  cta,
}: {
  readonly href: string;
  readonly title: string;
  readonly body: string;
  readonly cta: string;
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-neutral-800 p-4">
      <h3 className="font-mono text-sm font-semibold text-emerald-300">{title}</h3>
      <p className="flex-1 text-sm leading-relaxed text-neutral-400">{body}</p>
      <Link
        href={href}
        prefetch={PREFETCH}
        className="text-sm text-emerald-400 transition hover:text-emerald-300"
      >
        {cta} &rarr;
      </Link>
    </div>
  );
}
