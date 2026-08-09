import Link from 'next/link';

import { NotationWorkbench } from '@/components/notation-workbench';

const STATIC_EXPORT = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1';

export const metadata = {
  title: 'Notation — @cubesmith/scrambler demo',
  description:
    'Read, invert and validate WCA scramble notation with @cubesmith/scrambler — all six grammars and all seventeen events, with the stable error codes added in 0.11.0 and 0.12.0.',
};

export default function NotationPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">
          Reading notation, not only printing it
        </h1>
        <p className="mt-3 leading-relaxed text-neutral-400">
          The other half of the package. <code className="font-mono text-neutral-200">generateScramble</code>{' '}
          writes notation; these four functions read it —{' '}
          <code className="font-mono text-neutral-200">parseAlgorithm</code> into a typed tree,{' '}
          <code className="font-mono text-neutral-200">serializeAlgorithm</code> back out,{' '}
          <code className="font-mono text-neutral-200">invertAlgorithm</code> for the sequence that
          undoes it, and{' '}
          <code className="font-mono text-neutral-200">validateAlgorithm</code> for the case where
          invalid input is normal rather than exceptional. Type in the field and every one of them
          runs on each keystroke.
        </p>
        <p className="mt-3 leading-relaxed text-neutral-400">
          Those four are the <em>cube</em> grammar, which is twelve of the seventeen events. Since
          0.12.0 the other five — Megaminx, Clock, Pyraminx, Skewb and Square-1 — have a public
          check too, behind{' '}
          <code className="font-mono text-neutral-200">validateScramble(event, text)</code>. Pick a
          notation below and the same field answers for that grammar instead. The parsers were
          always in the package, generating and reading its own scrambles; what they lacked until
          0.12.0 was an offset, a span and a code, which is the difference between an error you can
          show a user and one you can only log.
        </p>
        <p className="mt-3 leading-relaxed text-neutral-400">
          No pruning tables are involved anywhere on this page, so unlike{' '}
          <Link
            href="/"
            prefetch={STATIC_EXPORT ? false : undefined}
            className="text-emerald-400 hover:text-emerald-300"
          >
            scramble generation
          </Link>{' '}
          there is no cold start and no reason to prefer a server: it is a parser, it costs
          microseconds, and the browser is where the text being typed already is.
        </p>
      </section>

      <NotationWorkbench />

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Throw, or return a result?
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-neutral-800 p-4">
            <h3 className="font-mono text-sm font-semibold text-neutral-200">parseAlgorithm</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Throws <code className="font-mono text-neutral-300">AlgorithmSyntaxError</code>. The
              right call when invalid input is <em>exceptional</em> — validating a stored algorithm
              library, reading a scramble back from your own API, running a migration. There, an
              exception is correct control flow: something upstream is broken and you want the stack
              trace.
            </p>
          </div>

          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4">
            <h3 className="font-mono text-sm font-semibold text-emerald-300">validateAlgorithm</h3>
            <p className="mt-2 text-sm leading-relaxed text-neutral-400">
              Returns{' '}
              <code className="font-mono text-neutral-300">
                {'{ valid: true, algorithm } | { valid: false, error }'}
              </code>
              . New in 0.11.0, and the right call for the field above, where invalid-while-typing is
              the normal state. It hands back the parsed tree on the valid arm so you do not tokenize
              twice, treats empty input as the empty algorithm rather than an error, and re-throws
              anything that is <em>not</em> a syntax error — a bug in the package must not reach your
              user disguised as their typo.
            </p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          Why the message is yours to write
        </h2>
        <p className="leading-relaxed text-neutral-400">
          Before 0.11.0 an error carried an offset and an English sentence, so classifying one meant
          matching that sentence as a string — which quietly turns any wording change in the package
          into a broken consumer — or reimplementing the tokenizer. The parser knew the difference
          between <code className="font-mono text-neutral-200">Mw</code>,{' '}
          <code className="font-mono text-neutral-200">3R</code> and{' '}
          <code className="font-mono text-neutral-200">R&apos;&apos;</code> and reported one opaque
          string for all three.
        </p>
        <p className="leading-relaxed text-neutral-400">
          Now it returns a stable <code className="font-mono text-neutral-200">reason</code> code,
          the <code className="font-mono text-neutral-200">length</code> of the span to underline,
          and whichever of <code className="font-mono text-neutral-200">char</code>,{' '}
          <code className="font-mono text-neutral-200">family</code>,{' '}
          <code className="font-mono text-neutral-200">outer</code>/
          <code className="font-mono text-neutral-200">inner</code> and{' '}
          <code className="font-mono text-neutral-200">count</code> that code carries. What it does
          not return — and never will, in any release — is a sentence in your language. A scramble
          library is the wrong home for a translation catalogue, and shipping an English table keyed
          by code would only invite the request for the next two languages.
        </p>
        <p className="leading-relaxed text-neutral-400">
          0.12.0 added thirteen more codes for the other five grammars — and put them in a{' '}
          <strong className="text-neutral-200">separate</strong> union,{' '}
          <code className="font-mono text-neutral-200">ScrambleErrorReason</code>, rather than
          extending the cube one. That is a real trade and this repo pays both halves of it: a
          second message table, in{' '}
          <code className="font-mono text-neutral-200">src/examples/scramble-messages.ts</code>, and
          a call site that has to know which of the two error classes it is holding — in exchange
          for the cube table not breaking on upgrade, which it would have, since it is an exhaustive{' '}
          <code className="font-mono text-neutral-200">Record</code> over every code by design.
        </p>
        <p className="leading-relaxed text-neutral-400">
          So the English and French wordings in the panel above are this repo&rsquo;s, not the
          package&rsquo;s. They live in two tables in{' '}
          <code className="font-mono text-neutral-200">src/examples/</code>, keyed by code, and the{' '}
          <Link
            href="/code"
            prefetch={STATIC_EXPORT ? false : undefined}
            className="text-emerald-400 hover:text-emerald-300"
          >
            code page
          </Link>{' '}
          prints both files verbatim. Adding a third language is one more column; adding a fourth is
          the same again. That is the trade the package is making on your behalf.
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          What this layer is not
        </h2>
        <p className="leading-relaxed text-neutral-400">
          Syntax, with no puzzle behind it. There is no{' '}
          <code className="font-mono text-neutral-200">simplify()</code> and no move cancellation:{' '}
          <code className="font-mono text-neutral-200">R R</code> stays two moves and{' '}
          <code className="font-mono text-neutral-200">R2</code> inverts to{' '}
          <code className="font-mono text-neutral-200">R2&apos;</code> rather than to itself. Saying
          otherwise needs a move order, which is a property of a puzzle and not of notation — try
          both in the field and watch the tree rather than taking this paragraph&rsquo;s word for it.
        </p>
      </section>
    </div>
  );
}
