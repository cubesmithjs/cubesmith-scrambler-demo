import { CodeBlock } from '@/components/code-block';
import { loadSnippets } from '@/lib/snippets';

/**
 * Statically rendered, so the example files are read at build time and baked
 * into the HTML. See `loadSnippets` for why that matters.
 */
export const dynamic = 'force-static';

export default async function CodePage() {
  const snippets = await loadSnippets();

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Code</h1>
        <p className="mt-3 leading-relaxed text-neutral-400">
          The five things you actually need. Each block below is read verbatim from a real file in
          this repo at build time, and those files are covered by{' '}
          <code className="font-mono text-neutral-200">npm run build</code>&rsquo;s type check — so
          nothing here can drift out of date without breaking the build.
        </p>
      </section>

      {snippets.map((snippet) => (
        <section key={snippet.file} className="flex flex-col gap-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-100">{snippet.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-neutral-400">{snippet.description}</p>
          </div>
          <CodeBlock code={snippet.source} filename={`src/examples/${snippet.file}`} />
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
      </section>
    </div>
  );
}
