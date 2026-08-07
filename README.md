# @cubesmith/scrambler demo

A small Next.js reference app for [`@cubesmith/scrambler`](https://www.npmjs.com/package/@cubesmith/scrambler),
the dependency-free WCA scramble generator. It exists to show you how to call the
package, not to be a cubing app: no 3D renderer, no timer, no history, no state
library. Two pages, and you can read all of it in ten minutes.

- **Live** — https://cubesmithjs.github.io/cubesmith-scrambler-demo/ — the static
  build, so browser mode only; see [Deploying](#deploying) for why
- **Package repo** — https://github.com/cubesmithjs/cubesmith-scrambler
- **npm** — https://www.npmjs.com/package/@cubesmith/scrambler

```bash
npm install
npm run dev
```

## What it shows

`/` generates a scramble for any of the seventeen WCA events, either in a Route
Handler or in a Client Component, and times whichever one you pick. There is a
seed field (same seed plus same event always gives the same moves), a badge
showing whether the scramble is `random-state` or `random-moves`, and — for
`333mbf`, the one multi-scramble event — a cube count and a numbered list of the
scrambles that attempt covers.

Every one of the seventeen generates as of `@cubesmith/scrambler` 0.10.0, which
registered `333mbf` last. Nothing in the picker can produce an
`UnimplementedEventError` any more, so the demonstration of a typed failure moved
to one you *can* still hit: passing `count` to an event that does not take one,
which raises `InvalidScrambleCountError` rather than being quietly ignored. The
count help text has a link that does it on purpose.

`/code` has the five snippets worth copying. They are read from the real files in
[`src/examples/`](src/examples) at build time, so they are type-checked by the
same `npm run build` that ships them and cannot silently rot.

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
