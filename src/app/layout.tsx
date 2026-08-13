import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: '@cubesmith/scrambler demo',
  description:
    'A small Next.js reference app showing every way to call the @cubesmith/scrambler npm package — generating scrambles on the server or in the browser, drawing a whole round in one batch, rendering the 2D scramble picture, and reading, inverting and validating WCA notation.',
};

const NPM_URL = 'https://www.npmjs.com/package/@cubesmith/scrambler';
const PACKAGE_REPO_URL = 'https://github.com/cubesmithjs/cubesmith-scrambler';

/**
 * Next's segment prefetch asks for `__next.code.__PAGE__.txt` while
 * `output: export` writes that payload to `__next.code/__PAGE__.txt`, so on a
 * plain static host every hover over a nav link 404s. Navigation still works —
 * it falls back to the full payload — but a demo people will open devtools on
 * should not ship a red line in the network tab. Three pages of static HTML have
 * nothing to gain from prefetching anyway.
 */
const PREFETCH = process.env.NEXT_PUBLIC_STATIC_EXPORT === '1' ? false : undefined;

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-200 antialiased">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-5 py-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/"
              prefetch={PREFETCH}
              className="font-mono text-sm text-neutral-100 hover:text-emerald-300"
            >
              @cubesmith/scrambler
            </Link>
            <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-neutral-400">
              <Link href="/" prefetch={PREFETCH} className="hover:text-neutral-100">
                Scrambles
              </Link>
              <Link href="/batch" prefetch={PREFETCH} className="hover:text-neutral-100">
                Batches
              </Link>
              <Link href="/draw" prefetch={PREFETCH} className="hover:text-neutral-100">
                Drawing
              </Link>
              <Link href="/notation" prefetch={PREFETCH} className="hover:text-neutral-100">
                Notation
              </Link>
              <Link href="/code" prefetch={PREFETCH} className="hover:text-neutral-100">
                Code
              </Link>
              {/*
                Marked rather than just listed, because two of the five pages
                above did not exist a version ago and a returning reader has no
                other way to notice. Worth removing once it stops being true.
              */}
              <Link
                href="/whats-new"
                prefetch={PREFETCH}
                className="rounded-full border border-emerald-500/40 px-2.5 py-0.5 text-emerald-400 transition hover:border-emerald-500/70 hover:text-emerald-300"
              >
                New in 0.14
              </Link>
              {/*
                The two links that leave the demo open in a new tab, so a reader
                following them does not lose a warm pruning table and a scramble
                they were looking at. `rel` is not optional with `target="_blank"`:
                without `noopener` the opened page gets a handle on this one
                through `window.opener`.
              */}
              <a
                href={NPM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-100"
              >
                npm
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
              <a
                href={PACKAGE_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-neutral-100"
              >
                GitHub
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </nav>
          </header>

          <main className="flex-1">{children}</main>

          <footer className="border-t border-neutral-900 pt-6 text-sm text-neutral-600">
            <p>
              MIT licensed. Not affiliated with or endorsed by the World Cube Association.
            </p>
          </footer>
        </div>
      </body>
    </html>
  );
}
