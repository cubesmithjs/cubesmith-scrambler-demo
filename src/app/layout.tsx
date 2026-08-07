import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';

import './globals.css';

export const metadata: Metadata = {
  title: '@cubesmith/scrambler demo',
  description:
    'A small Next.js reference app showing how to call the @cubesmith/scrambler npm package from both the server and the browser.',
};

const NPM_URL = 'https://www.npmjs.com/package/@cubesmith/scrambler';
const PACKAGE_REPO_URL = 'https://github.com/cubesmithjs/cubesmith-scrambler';

export default function RootLayout({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-neutral-950 text-neutral-200 antialiased">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-5 py-10">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <Link href="/" className="font-mono text-sm text-neutral-100 hover:text-emerald-300">
              @cubesmith/scrambler
            </Link>
            <nav className="flex items-center gap-5 text-sm text-neutral-400">
              <Link href="/" className="hover:text-neutral-100">
                Demo
              </Link>
              <Link href="/code" className="hover:text-neutral-100">
                Code
              </Link>
              <a href={NPM_URL} className="hover:text-neutral-100">
                npm
              </a>
              <a href={PACKAGE_REPO_URL} className="hover:text-neutral-100">
                GitHub
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
