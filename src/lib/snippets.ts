import { readFile } from 'node:fs/promises';
import path from 'node:path';

export interface Snippet {
  readonly title: string;
  readonly description: string;
  readonly file: string;
  readonly source: string;
}

export interface SnippetGroup {
  readonly title: string;
  /** What this group of calls is for, and when you would reach for it rather than another. */
  readonly blurb: string;
  readonly snippets: readonly Snippet[];
}

type SnippetSpec = Omit<Snippet, 'source'>;
type GroupSpec = Omit<SnippetGroup, 'snippets'> & { readonly snippets: readonly SnippetSpec[] };

/**
 * Every public export of `@cubesmith/scrambler`, across both entry points,
 * grouped by the job you are doing rather than by the module it lives in.
 *
 * The grouping is the useful part. The package has parts that never touch each
 * other: one generates scrambles and pays for pruning tables, one reads
 * notation and costs microseconds, one draws a picture and is imported from a
 * different path so you can decline it — plus two small primitive surfaces.
 * Reading the export list alphabetically hides all of that.
 *
 * 🔴 The two drawing groups import from `@cubesmith/scrambler/draw`, and the
 * import line is load-bearing rather than cosmetic: the main entry re-exports
 * nothing from there, so a snippet that reached for the short path would not
 * compile. Which is the point — the build is what keeps these honest.
 */
const GROUPS: readonly GroupSpec[] = [
  {
    title: 'Generating scrambles',
    blurb:
      'The half of the package that builds pruning tables. Where you call it is the decision that matters — see the demo page for the timings.',
    snippets: [
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
          'The typed failure you get for an event with no scrambler, and how to handle it. No event triggers it since 0.10.0 completed the set — worth keeping anyway, since the union covers events the registry may not.',
      },
    ],
  },
  {
    title: 'Drawing a whole round',
    blurb:
      'Added in 0.13.0, for the job a competition actually has: not one scramble, but every group and attempt of every round — reproducible, in order, and without freezing whatever is running it.',
    snippets: [
      {
        title: 'Draw a batch from one random source',
        file: 'batch.ts',
        description:
          'generateScrambles and the measured bug it closes — a seeded caller-side loop returns the same scramble N times. Plus why duplicates are kept, how Multi-Blind gets two independent counts, and why the two caps are different numbers.',
      },
      {
        title: 'Report progress, and cancel',
        file: 'batch-progress.ts',
        description:
          'onProgress is awaited, which makes yielding possible and not automatic — the microtask-versus-macrotask distinction that decides whether a progress bar moves at all. Throwing from it is the whole cancel path, which is why there is no AbortSignal.',
      },
      {
        title: 'Pay the table cost on purpose',
        file: 'prepare-event.ts',
        description:
          'prepareEvent, why it is not implemented as "generate one and throw it away" (a discarded draw consumes entropy and would shift every later seeded scramble), and the one event where preparing still does not make the first scramble cheap.',
      },
    ],
  },
  {
    title: 'Drawing the picture',
    blurb:
      'The 0.13.0 second entry point, @cubesmith/scrambler/draw. Imported separately because it is roughly as large as the scrambling half, and a consumer that only scrambles must not pay for it.',
    snippets: [
      {
        title: 'Draw a scramble',
        file: 'drawing.ts',
        description:
          'drawScramble taking the scramble as text, what a ScrambleImage actually is, why the shape array is a paint order you must not sort, and when to reach for scrambleImageToSvg instead of mapping it yourself.',
      },
      {
        title: 'Change the colours',
        file: 'drawing-colors.ts',
        description:
          'defaultColorScheme, partial overrides merged over the defaults — and the trap: the schemes are not interchangeable between puzzles, and using the wrong one fails silently rather than throwing.',
      },
      {
        title: 'Handle every way a draw can fail',
        file: 'drawing-errors.ts',
        description:
          'Three new error classes and two deliberately reused ones, plus the distinction validation cannot make for you: a slice move is valid notation and still has no picture.',
      },
    ],
  },
  {
    title: 'Reading notation',
    blurb:
      'The other half. No puzzle, no tables, no cold start — a parser, a serializer and an inverter over full WCA algorithm notation.',
    snippets: [
      {
        title: 'Parse, invert, serialize',
        file: 'notation.ts',
        description:
          'The round trip, the three spellings that normalise on the way through, and the notations this grammar deliberately refuses.',
      },
      {
        title: 'Walk the tree',
        file: 'ast-walk.ts',
        description:
          'Counting moves through groups, commutators and conjugates — and why a switch over node.type needs no default arm.',
      },
    ],
  },
  {
    title: 'Validating what somebody typed',
    blurb:
      'A non-throwing check (0.11.0), errors you can classify and translate without string-matching an English sentence, and since 0.12.0 the same for all seventeen events rather than the twelve written in cube notation.',
    snippets: [
      {
        title: 'Validate a text field',
        file: 'validating-input.ts',
        description:
          'validateAlgorithm on every keystroke versus parseAlgorithm on a stored library — the same parser, two different situations, and the one thing validateAlgorithm refuses to swallow.',
      },
      {
        title: 'Validate any event, not just the cube ones',
        file: 'validating-any-event.ts',
        description:
          'validateScramble over all six grammars, why it takes the event rather than sniffing the string, why the valid arm hands back no tree, and how the two error classes are told apart.',
      },
      {
        title: 'Write the message yourself',
        file: 'syntax-messages.ts',
        description:
          'All twenty cube reason codes turned into sentences, because the package ships none. This is the exact file the notation page renders from — and a second language would be another table keyed identically.',
      },
      {
        title: 'And again, for the other five notations',
        file: 'scramble-messages.ts',
        description:
          'The thirteen ScrambleErrorReason codes, in the same shape. A second table on purpose — the file opens with what that cost and what it bought.',
      },
    ],
  },
  {
    title: 'Primitives',
    blurb:
      'Two small surfaces worth knowing exist, both exported so you do not maintain your own copy.',
    snippets: [
      {
        title: 'Single-layer face moves',
        file: 'move-primitives.ts',
        description:
          'FaceMove and its helpers, for building sequences rather than reading them — and why parseMove is not parseAlgorithm.',
      },
      {
        title: 'Seeded randomness of your own',
        file: 'random-source.ts',
        description:
          'The same RandomSource the scramblers draw from, so one seed can reproduce your decisions as well as the cubes. Not cryptographic when seeded, on purpose.',
      },
    ],
  },
];

/**
 * Reads each snippet out of the real file in `src/examples/`, so what the page
 * shows is exactly what the compiler checks. Those files are inside `tsconfig`'s
 * `include`, which means `npm run build` type-checks every line printed there —
 * a snippet cannot rot against a package upgrade without failing the build.
 *
 * Two of them are not illustrations at all: `syntax-messages.ts` and
 * `validating-input.ts` are imported by the notation page, so that page and the
 * code page cannot disagree about how an error becomes a sentence.
 *
 * The `/code` page is statically rendered, so this runs at build time and the
 * result is baked into the HTML. No file reads happen at request time, which is
 * what keeps it working on a serverless host where `src/` is not deployed.
 */
export async function loadSnippets(): Promise<SnippetGroup[]> {
  const directory = path.join(process.cwd(), 'src', 'examples');

  return Promise.all(
    GROUPS.map(async (group) => ({
      ...group,
      snippets: await Promise.all(
        group.snippets.map(async (snippet) => ({
          ...snippet,
          source: (await readFile(path.join(directory, snippet.file), 'utf8')).trim(),
        })),
      ),
    })),
  );
}

/** How many files the code page prints, for a sentence that would otherwise go stale. */
export const SNIPPET_COUNT = GROUPS.reduce((total, group) => total + group.snippets.length, 0);
