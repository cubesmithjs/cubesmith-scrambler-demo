import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: '@cubesmith/scrambler demo',
  description:
    'A small Next.js reference app showing every way to call the @cubesmith/scrambler npm package — generating scrambles on the server or in the browser, and reading, inverting and validating WCA notation.',
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
            <nav className="flex items-center gap-5 text-sm text-neutral-400">
              <Link href="/" prefetch={PREFETCH} className="hover:text-neutral-100">
                Scrambles
              </Link>
              <Link href="/notation" prefetch={PREFETCH} className="hover:text-neutral-100">
                Notation
              </Link>
              <Link href="/code" prefetch={PREFETCH} className="hover:text-neutral-100">
                Code
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
