# @cubesmith/scrambler demo

A small Next.js reference app for [`@cubesmith/scrambler`](https://www.npmjs.com/package/@cubesmith/scrambler),
the dependency-free WCA scramble generator. It exists to show you how to call the
package — every public export of it, on 0.11.0 — not to be a cubing app: no 3D
renderer, no timer, no history, no state library. Three pages, and you can read
all of it in fifteen minutes.

- **Live** — https://cubesmithjs.github.io/cubesmith-scrambler-demo/ — the static
  build, so scramble generation is browser-only there; see [Deploying](#deploying)
  for why. `/notation` is unaffected, since a parser needs no server
- **Package repo** — https://github.com/cubesmithjs/cubesmith-scrambler
- **npm** — https://www.npmjs.com/package/@cubesmith/scrambler

```bash
npm install
npm run dev
```

## What it shows

The package has two halves that never touch each other, and the demo is laid out
that way.

**`/` — generating scrambles.** Any of the seventeen WCA events, either in a Route
Handler or in a Client Component, timed whichever one you pick. There is a seed
field (same seed plus same event always gives the same moves), a badge showing
whether the scramble is `random-state` or `random-moves`, and — for `333mbf`, the
one multi-scramble event — a cube count and a numbered list of the scrambles that
attempt covers.

Every one of the seventeen generates since 0.10.0, which registered `333mbf` last.
Nothing in the picker can produce an `UnimplementedEventError` any more, so the
demonstration of a typed failure moved to one you *can* still hit: passing `count`
to an event that does not take one, which raises `InvalidScrambleCountError`
rather than being quietly ignored. The count help text has a link that does it on
purpose.

**`/notation` — reading it.** A live workbench over the other half:
`parseAlgorithm` into a typed tree (rendered as a tree, so you can see that
`[R: (U Rw U')2]` is one conjugate and not five tokens), `serializeAlgorithm` back
out, `invertAlgorithm`, and `validateAlgorithm` on every keystroke. It carries a
row per construct the grammar accepts, a row per way it can fail — nineteen of the
twenty documented `reason` codes, the twentieth being a residual nothing reaches —
and the three foreign notations it refuses on purpose.

That page is where 0.11.0 shows up. A syntax error now carries a stable `reason`
code, a `length` so you can underline the offending *token* rather than pointing
at its first character, and whatever a message would interpolate (`char`,
`family`, `outer`/`inner`, `count`). The page renders a compiler-style caret line
from `offset` and `length`, and writes the sentence in **English or French from a
switch you can toggle** — because the package ships no message strings beyond the
English `.message` and never will. Both wordings live in one table in
[`src/examples/syntax-messages.ts`](src/examples/syntax-messages.ts), which the
page imports rather than duplicates.

Nothing on `/notation` builds a pruning table, so it is instant everywhere and the
server-or-browser question below does not arise for it.

**`/code` — the eleven files worth copying,** grouped by job: generating,
reading notation, validating input, and the two primitive surfaces (`FaceMove`
helpers, and `createRandomSource` for seeding your own draws off the same value as
the scramble). Between them they touch every public export. They are read from the
real files in [`src/examples/`](src/examples) at build time, so they are
type-checked by the same `npm run build` that ships them and cannot silently rot —
and two of them are the code `/notation` actually runs, not illustrations of it.

## Server or browser?

Most events build a pruning table on first use, in memory, on the calling thread —
the package runs no Web Worker, by design. That table then lives in whichever
process built it, which is the whole trade-off. **On the server**, one process
serves everybody: a single visitor pays the cold start and every request after
that is milliseconds, with nothing added to the client bundle. The caveat is that
serverless instances warm up individually, so scaling out or redeploying starts
the clock again. **In the browser** there is no network and no server cost, and it
keeps working on bad venue wifi — but the cold build blocks the main thread, so a
first 3x3x3 freezes the tab for several seconds, for every visitor, once per tab.
No spinner can animate through it, which is why this demo says so instead of
showing one. The demo defaults to the server for that reason; generate one
scramble early if you go client-side.

Measured on one laptop under Node 22, so treat these as orders of magnitude — the
page shows you the real numbers for your own machine:

| Event | First call | Afterwards |
| --- | --- | --- |
| `333` | ~8 s | 1–300 ms |
| `222` | ~4 s | under 1 ms |
| `444` | ~7 s | 110 ms – 1.3 s |
| `sq1` | ~4 s | 1 ms – 2 s |
| `pyram`, `skewb` | 0.2–0.6 s | under 1 ms |
| `333mbf` | shares `333` | 40 ms – 1 s **per cube** |
| `clock`, `555`, `666`, `777`, `minx` | no table | under 1 ms |

Steady-state cost is a range rather than an average because these are randomised
searches. Events also *share* tables: once a `333` is warm, `333bf`, `333fm`,
`333oh` and `333mbf` are warm too.

`333mbf` is the one row measured **per cube**, because one Multi-Blind attempt
covers many: a `count` of 10 costs ten of those draws, not one. That makes it the
sharpest example of the trade-off above — at the top of the range, a large attempt
is a browser tab frozen for the better part of a minute.

`random-moves` is not a weaker result. WCA Regulation 4b3e requires it for 5x5x5,
6x6x6, 7x7x7 and Megaminx, so for those events a random-state scramble would be
the non-conforming one.

## Deploying

One source tree, two builds.

**Anywhere with compute** (Vercel, or any Node host) — `npm run build`, the
default. The Route Handler runs, both call sites work, nothing to configure.

**GitHub Pages** — Pages serves files and runs no code, so that build ships
browser mode only and says so on the page. `.github/workflows/pages.yml` does
it on every push to `main`: delete `src/app/api` (a dynamic Route Handler makes
`output: export` fail outright), build with `STATIC_EXPORT=1`, and write
`.nojekyll` so Pages stops stripping Next's `_next/` directory. Set Pages
**Source** to **GitHub Actions** once; nothing else.

Reproduce that build locally with:

```bash
rm -rf src/app/api && STATIC_EXPORT=1 npm run build   # writes ./out
```

Two things about the static build worth knowing before you fork it. `basePath`
is hardcoded to `/cubesmith-scrambler-demo` for the project-site subpath, so a
different repo name or a custom domain means editing `next.config.ts` or every
asset 404s. And link prefetching is switched off there, because Next's segment
prefetch requests `__next.code.__PAGE__.txt` while the export writes
`__next.code/__PAGE__.txt` — navigation falls back and still works, but every
hover would otherwise 404.

## Licence

MIT. Not affiliated with or endorsed by the World Cube Association.
