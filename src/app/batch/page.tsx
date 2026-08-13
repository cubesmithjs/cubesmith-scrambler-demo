import Link from 'next/link';

import { BatchWorkbench } from '@/components/batch-workbench';

const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

export const metadata = {
  title: 'Batches — @cubesmith/scrambler demo',
  description:
    'generateScrambles, onProgress and prepareEvent, added in 0.13.0: draw a whole round from one random source, keep the page responsive while it runs, and pay the table cost on purpose.',
};

export default function BatchPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
            A whole round, not one scramble
          </h1>
          <span className="rounded-full border border-emerald-500/50 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
            new in 0.13.0
          </span>
        </div>
        <p className="mt-3 leading-relaxed text-neutral-400">
          A competition does not need <em>a</em> scramble. It needs a set: every group, every
          attempt, every extra, for every round — hundreds of them, reproducible, and in an order
          somebody can map onto a scramble sheet.{' '}
          <code className="font-mono text-neutral-200">generateScrambles(event, count, options)</code>{' '}
          is that call.
        </p>
        <p className="mt-3 leading-relaxed text-neutral-400">
          🔴 It is <strong className="text-neutral-200">not sugar over a loop</strong>, and that is
          the reason it exists. It creates <strong className="text-neutral-200">one</strong>{' '}
          random source for the whole batch. The idiom it replaces —{' '}
          <code className="font-mono text-neutral-200">generateScramble</code> called{' '}
          <em>n</em> times — rebuilds its source from the seed on every call, so a seeded loop
          returns the same scramble <em>n</em> times. Silently. The panel at the bottom of this page
          runs that loop for real rather than asking you to take the paragraph&rsquo;s word for it.
        </p>
      </section>

      <BatchWorkbench />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Why the progress bar is a checkbox
        </h2>
        <p className="leading-relaxed text-neutral-400">
          <code className="font-mono text-neutral-200">onProgress</code> is{' '}
          <strong className="text-neutral-200">awaited</strong>, and that is the package&rsquo;s
          entire answer to a long batch blocking a thread. It is called after each scramble, never
          before the first, and exactly <code className="font-mono text-neutral-200">count</code>{' '}
          times.
        </p>
        <p className="leading-relaxed text-neutral-400">
          Being awaited makes yielding <em>possible</em>. It does not make it{' '}
          <em>happen</em> — and the difference is the single most common way a progress bar ends up
          frozen at zero. An <code className="font-mono text-neutral-200">await</code> on a promise
          that is already resolved schedules a <strong className="text-neutral-200">microtask</strong>
          , and microtasks run to exhaustion before the browser is allowed to paint. Only a real
          macrotask — <code className="font-mono text-neutral-200">requestAnimationFrame</code>,{' '}
          <code className="font-mono text-neutral-200">setTimeout</code> — hands the frame back.
          Switch the checkbox off above and watch a correct, well-intentioned, entirely useless
          progress bar.
        </p>
        <p className="leading-relaxed text-neutral-400">
          The same awaited callback is also the cancel path: throw from it and the throw propagates
          out of <code className="font-mono text-neutral-200">generateScrambles</code>, stopping
          further draws. That is why there is no{' '}
          <code className="font-mono text-neutral-200">AbortSignal</code> in the signature — taking
          one would put a DOM type in the public types of a package that deliberately has none.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Two counts that do not mean the same thing
        </h2>
        <p className="leading-relaxed text-neutral-400">
          Multi-Blind is the one event where a batch has two axes, so it gets two options and they
          stay orthogonal. <code className="font-mono text-neutral-200">count</code> is how many{' '}
          <em>attempts</em>; <code className="font-mono text-neutral-200">cubesPerAttempt</code> is
          how many <em>cubes</em> in one attempt. Neither borrows the other&rsquo;s meaning, and
          passing <code className="font-mono text-neutral-200">cubesPerAttempt</code> for any other
          event throws <code className="font-mono text-neutral-200">InvalidScrambleCountError</code>{' '}
          rather than being quietly ignored.
        </p>
        <p className="leading-relaxed text-neutral-400">
          They are also bounded by different numbers, on purpose.{' '}
          <code className="font-mono text-neutral-200">MAX_BATCH_COUNT</code> is 500 and{' '}
          <code className="font-mono text-neutral-200">MAX_SCRAMBLE_COUNT</code> is 100. Reusing one
          for both would cap a 5x5x5 batch — about a millisecond a scramble — at the same limit as
          cubes in a 4x4x4 blindfolded attempt. Both are runaway guards rather than WCA
          regulations.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Paying the table cost on purpose
        </h2>
        <p className="leading-relaxed text-neutral-400">
          <code className="font-mono text-neutral-200">prepareEvent(event)</code> builds a
          puzzle&rsquo;s lookup and pruning tables when <em>you</em> choose, rather than charging
          them to the first scramble somebody is waiting for. Call it behind a &ldquo;preparing
          scrambles&rdquo; screen, or at server boot, and the batch that follows starts warm. It
          resolves immediately for an event with nothing to precompute — Clock is linear algebra
          over <code className="font-mono text-neutral-200">Z12</code>, Megaminx is random-moves —
          and that is a legitimate answer rather than an error.
        </p>
        <p className="leading-relaxed text-neutral-400">
          🔴 It is <strong className="text-neutral-200">not</strong> implemented as &ldquo;generate
          a scramble and throw it away&rdquo;. A discarded draw consumes entropy, which would shift
          every later scramble under a seed and turn a performance helper into a correctness
          hazard. A test in the package asserts that a seeded batch is byte-identical with and
          without a preceding <code className="font-mono text-neutral-200">prepareEvent</code>.
        </p>
        <p className="leading-relaxed text-neutral-400">
          One honest caveat the package states rather than glosses: 4x4x4 is the event where
          preparing does <em>not</em> make the first scramble as fast as the tenth. Two things stay
          lazy deliberately — the per-group wing-pair tables, which cost about 8.5 s that one
          scramble does not need, and the centre-generator library, which is a search rather than a
          table and costs more to pre-build than a first scramble does. Square-1 leaves about 1.5 s
          for the same reason.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Where to run this
        </h2>
        <p className="leading-relaxed text-neutral-400">
          Everything above runs in your browser on this page, because that is the version of it you
          can click. For a real scramble set the answer is almost always the other one: a batch is
          minutes of computation, and the{' '}
          <Link
            href="/"
            prefetch={STATIC_EXPORT ? false : undefined}
            className="text-emerald-400 hover:text-emerald-300"
          >
            server-or-browser trade-off
          </Link>{' '}
          gets sharper the longer the work runs. On a server one process pays each cold start once
          and nothing lands in the client bundle;{' '}
          <code className="font-mono text-neutral-200">onProgress</code> is then a place to stream
          progress to a client rather than a place to paint.
        </p>
      </section>
    </div>
  );
}
