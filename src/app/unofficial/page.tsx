import { UnofficialWorkbench } from '@/components/unofficial-workbench';

const DESIGN_DOC = 'https://github.com/cubesmithjs/cubesmith-scrambler/blob/main/docs/unofficial-design.md';

export const metadata = {
  title: 'Unofficial events — @cubesmith/scrambler demo',
  description:
    'New in 0.15.0: scrambles and drawings for sixteen puzzles the WCA does not hold, from the @cubesmith/scrambler/unofficial and /unofficial/draw entry points.',
};

export default function UnofficialPage() {
  return (
    <div className="flex flex-col gap-12">
      <section>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight text-neutral-50">Unofficial events</h1>
          <span className="rounded-full border border-emerald-500/50 px-2.5 py-0.5 font-mono text-xs text-emerald-300">
            new in 0.15.0
          </span>
        </div>
        <p className="mt-3 leading-relaxed text-neutral-400">
          Sixteen puzzles the WCA does not hold: big cubes up to 12x12x12, blindfolded variants, and
          six shape mods of the 3x3x3. They live behind two entry points of their own,{' '}
          <code className="font-mono text-neutral-200">@cubesmith/scrambler/unofficial</code> and{' '}
          <code className="font-mono text-neutral-200">/unofficial/draw</code>, so nothing on the other
          pages changes: <code className="font-mono text-neutral-200">isImplementedEvent(&apos;888&apos;)</code>{' '}
          is still <code className="font-mono text-neutral-200">false</code>, and a WCA-only app bundles
          none of this code.
        </p>
        <p className="mt-3 leading-relaxed text-neutral-400">
          No regulation exists for these events, so every scramble length, orientation rule and
          notation choice is either cited or labelled a convention in the package&apos;s{' '}
          <a href={DESIGN_DOC} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline underline-offset-2 hover:text-emerald-300">
            design document
          </a>
          . Generation runs in this tab, so the page works on the static build too.
        </p>
      </section>

      <UnofficialWorkbench />
    </div>
  );
}
