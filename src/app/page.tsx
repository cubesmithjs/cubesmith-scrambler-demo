import Link from 'next/link';

import { Playground } from '@/components/playground';

/** True in the static GitHub Pages build, which has no server half to compare against. */
const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
          WCA scrambles, from one function call
        </h1>
        <p className="mt-3 leading-relaxed text-neutral-400">
          <code className="font-mono text-neutral-200">@cubesmith/scrambler</code> generates WCA
          scrambles with no dependencies, no Web Worker, and no DOM — so the same call works in a
          Route Handler and in a Client Component. This page runs it both ways and times it, because
          the interesting part of this half of the package is not the API, it is where you choose to
          call it.
        </p>
        <p className="mt-3 leading-relaxed text-neutral-400">
          The other half reads notation rather than printing it: parse an algorithm into a typed
          tree, invert it, write it back, or validate a text field on every keystroke and get a
          stable error code you can translate yourself. That half needs no tables and has no cold
          start, so it lives on its own page —{' '}
          <Link
            href="/notation"
            prefetch={STATIC_EXPORT ? false : undefined}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Notation
          </Link>
          .
        </p>
      </section>

      <Playground />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Server or browser?
        </h2>
        <p className="leading-relaxed text-neutral-400">
          Most events build a pruning table the first time you ask for them, then answer in
          milliseconds forever after. The table lives in the memory of whichever process built it,
          and that single fact decides where you should call this package.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <h3 className="font-semibold text-emerald-300">Server — the default</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              One process serves everybody, so exactly one visitor pays the cold start and every
              other request is fast. Nothing lands in the client bundle. The catch worth knowing:
              on a serverless host each instance warms up separately, so a scale-out or a redeploy
              starts the clock again.
            </p>
          </div>

          <div className="rounded-xl border border-neutral-800 p-4">
            <h3 className="font-semibold text-neutral-200">Browser — when offline matters</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              No network, no server cost, and it keeps working on a venue&rsquo;s bad wifi. But the
              work runs on the main thread, so a cold 3x3x3 freezes the tab for seconds. Every
              visitor pays that cold start, once per tab. Generate one scramble early, before the
              user is waiting on it.
            </p>
          </div>
        </div>

        <p className="leading-relaxed text-neutral-400">
          {STATIC_EXPORT ? 'Watch the elapsed time as you generate.' : 'Toggle the switch above and watch the elapsed time.'} The first call for an event is
          slow, the next ones are not, and events that share a table share the warm-up — generate a
          3x3x3 and the blindfolded, one-handed and fewest-moves variants are already fast. Events
          with no table at all, like Clock and Megaminx, are instant from the very first call.
        </p>

        <p className="leading-relaxed text-neutral-400">
          None of this applies to the notation half: a parser has no table to build, so{' '}
          <Link
            href="/notation"
            prefetch={STATIC_EXPORT ? false : undefined}
            className="text-emerald-400 hover:text-emerald-300"
          >
            that page
          </Link>{' '}
          is fast everywhere and the server/browser question does not arise.
        </p>

        <p className="leading-relaxed text-neutral-400">
          The snippets on the{' '}
          <Link
            href="/code"
            prefetch={STATIC_EXPORT ? false : undefined}
            className="text-emerald-400 hover:text-emerald-300"
          >
            code page
          </Link>{' '}
          cover every public export, and are read from real files in this repo — so they are
          type-checked by the same build that ships them.
        </p>
      </section>
    </div>
  );
}
