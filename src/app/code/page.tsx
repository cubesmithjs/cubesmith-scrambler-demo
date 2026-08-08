import { CodeBlock } from '@/components/code-block';
import { loadSnippets, SNIPPET_COUNT } from '@/lib/snippets';

/**
 * Statically rendered, so the example files are read at build time and baked
 * into the HTML. See `loadSnippets` for why that matters.
 */
export const dynamic = 'force-static';

export default async function CodePage() {
  const groups = await loadSnippets();

  return (
    <div className="flex flex-col gap-12">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Code</h1>
        <p className="mt-3 leading-relaxed text-neutral-400">
          Every public export of the package, across {SNIPPET_COUNT} files, grouped by the job
          rather than by the module. Each block below is read verbatim from a real file in this repo
          at build time, and those files are covered by{' '}
          <code className="font-mono text-neutral-200">npm run build</code>&rsquo;s type check — so
          nothing here can drift out of date without breaking the build.
        </p>
      </section>

      {groups.map((group) => (
        <section key={group.title} className="flex flex-col gap-8">
          <div className="border-b border-neutral-900 pb-3">
            <h2 className="text-xl font-semibold tracking-tight text-neutral-100">{group.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-neutral-400">{group.blurb}</p>
          </div>

          {group.snippets.map((snippet) => (
            <div key={snippet.file} className="flex flex-col gap-3">
              <div>
                <h3 className="text-lg font-semibold text-neutral-100">{snippet.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-neutral-400">
                  {snippet.description}
                </p>
              </div>
              <CodeBlock code={snippet.source} filename={`src/examples/${snippet.file}`} />
            </div>
          ))}
        </section>
      ))}

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-neutral-100">Installing</h2>
        <CodeBlock code="npm install @cubesmith/scrambler" filename="shell" />
        <p className="text-sm leading-relaxed text-neutral-400">
          ESM only, Node 18 or newer, no dependencies. The package declares{' '}
          <code className="font-mono text-neutral-200">sideEffects: true</code> deliberately —
          importing it registers the puzzles — so do not add bundler config that marks it
          side-effect free. Tree-shaking those registrations away leaves an empty registry where
          every event throws.
        </p>
        <p className="text-sm leading-relaxed text-neutral-400">
          There is one entry point, so the notation layer ships to every consumer whether they parse
          anything or not. It is small — the whole package is around 46 kB gzipped, of which 0.11.0
          added under a kilobyte — but it is not conditional, and that is worth knowing before you
          budget for it.
        </p>
      </section>
    </div>
  );
}
