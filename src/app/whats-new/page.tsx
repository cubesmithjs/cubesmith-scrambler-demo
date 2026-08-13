import Link from 'next/link';

import { CompatibilityChecks } from '@/components/compatibility-checks';

const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';
const PREFETCH = STATIC_EXPORT ? false : undefined;

const CHANGELOG_URL = 'https://github.com/cubesmithjs/cubesmith-scrambler/blob/main/CHANGELOG.md';

export const metadata = {
  title: "What's new — @cubesmith/scrambler demo",
  description:
    'Everything that changed between 0.12.0 and 0.14.0: batch generation, prepareEvent, a second entry point for 2D drawing, and two events that emit a different string than they used to.',
};

export default function WhatsNewPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
          0.12.0 &rarr; 0.14.0
        </h1>
        <p className="mt-3 leading-relaxed text-neutral-400">
          Two releases. <strong className="text-neutral-200">0.13.0</strong> added two public
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
