import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface Snippet {
  readonly title: string;
  readonly description: string;
  readonly file: string;
  readonly source: string;
}

const EXAMPLES: readonly Omit<Snippet, 'source'>[] = [
  {
    title: 'Generate a scramble',
    file: 'basic.ts',
    description: 'The whole API for the common case: one call, one await.',
  },
  {
    title: 'Reproduce a scramble from a seed',
    file: 'seeded.ts',
    description:
      'A seed makes generation deterministic, so the same seed and event give identical moves anywhere.',
  },
  {
    title: 'Check an event is supported',
    file: 'guard.ts',
    description:
      'The type union covers every WCA event; the registry decides which ones actually generate.',
  },
  {
    title: 'Generate a Multi-Blind attempt',
    file: 'multi-blind.ts',
    description:
      'The one event that takes a count, why result.moves still works unchanged, and why passing count anywhere else is an error rather than a no-op.',
  },
  {
    title: 'Catch UnimplementedEventError',
    file: 'catching-error.ts',
    description:
      'The typed failure you get for an event with no scrambler, and how to handle it. No event triggers it as of 0.10.0 — worth keeping anyway, since the union covers events the registry may not.',
  },
];

/**
 * Reads each snippet out of the real file in `src/examples/`, so what this page
 * shows is exactly what the compiler checks. Those files are inside `tsconfig`'s
 * `include`, which means `npm run build` type-checks every line printed here —
 * a snippet cannot rot against a package upgrade without failing the build.
 *
 * The `/code` page is statically rendered, so this runs at build time and the
 * result is baked into the HTML. No file reads happen at request time, which is
 * what keeps it working on a serverless host where `src/` is not deployed.
 */
export async function loadSnippets(): Promise<Snippet[]> {
  const directory = path.join(process.cwd(), 'src', 'examples');

  return Promise.all(
    EXAMPLES.map(async (example) => ({
      ...example,
      source: (await readFile(path.join(directory, example.file), 'utf8')).trim(),
    })),
  );
}
