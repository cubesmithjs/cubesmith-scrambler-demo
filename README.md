# @cubesmith/scrambler demo

A small Next.js reference app for [`@cubesmith/scrambler`](https://www.npmjs.com/package/@cubesmith/scrambler),
the dependency-free WCA scramble generator. It exists to show you how to call the
package — every public export of it, across both entry points, on 0.14.0 — not to
be a cubing app: no 3D renderer, no timer, no history, no state library. Five
pages, and you can read all of it in twenty minutes.

- **Live** — https://cubesmithjs.github.io/cubesmith-scrambler-demo/ — the static
  build, so scramble generation is browser-only there; see [Deploying](#deploying)
  for why. `/notation` and `/draw` are unaffected, since neither a parser nor a
  drawing needs a server
- **Package repo** — https://github.com/cubesmithjs/cubesmith-scrambler
- **npm** — https://www.npmjs.com/package/@cubesmith/scrambler

```bash
npm install
npm run dev
```

## What it shows

The package has parts that never touch each other, and the demo is laid out that
way — one page per part, so you can skip the ones you will not call.

**`/whats-new` — everything that changed between 0.12.0 and 0.14.0,** which is
the page to start on if you are upgrading. 0.13.0 added two public surfaces (a
batch draw and 2D drawing) plus `prepareEvent`; 0.14.0 added no API at all and
instead changed what two events emit. The compatibility claims on it are
**checked in your browser as the page renders** rather than asserted: the old
nineteen-token Clock string and the new fifteen-token one are both validated and
both drawn, and the page compares the two serialized SVGs to show they reach the
same state.

The one thing to plan for when upgrading: seeded output for `clock`, `sq1`,
`444` and `444bf` differs from 0.12.0, so a snapshot test or fixture file
pinning those by seed needs re-recording. The other thirteen events emit exactly
what they did, and nothing that *parsed* before stops parsing — the rule across
all three changes is **emit narrow, accept wide**.

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

Each result also reports its **length in tokens**, which is where 0.14.0 shows up
without you going looking: a 4x4x4 that used to average 137 now averages 74.

**`/batch` — drawing a whole round (0.13.0).** `generateScrambles(event, count,
options)`, which is *not* sugar over a loop and does not pretend to be. It draws
from **one** random source; the caller-side loop it replaces rebuilds its source
from the seed on every call and therefore returns the same scramble N times.
The page runs that old loop for real, next to the batch, so the bug is visible
rather than described.

There is a **checkbox that breaks the progress bar on purpose**, and it is the
most useful control on the page. `onProgress` is awaited, which makes yielding
*possible* and not automatic: awaiting an already-resolved promise schedules a
microtask, and the browser paints between macrotasks. Switch the yield off and
watch a correct-looking progress bar sit at zero until the batch finishes.
Cancelling throws from `onProgress` — the package's entire cancel path, and why
there is no `AbortSignal` in the signature.

Also here: `prepareEvent`, with the cost it moves shown as a real measurement,
and `cubesPerAttempt`, the second Multi-Blind axis that deliberately does not
share a meaning — or a cap — with `count`.

**`/draw` — the picture (0.13.0).** The flat sticker net that appears beside
every scramble on an official WCA sheet, for all **seventeen** events, from the
separate `@cubesmith/scrambler/draw` entry point. Type or paste a scramble and it
redraws as you type, because `drawScramble` takes the scramble as **text** — so a
stored scramble draws exactly as a generated one does, and the page needs no
pruning table to open.

The picture is React elements mapped straight off `image.shapes`, which is why
the package returns **data** rather than an SVG string; `scrambleImageToSvg` is
shown too, for the print route that does want the string. There is a live colour
editor over `defaultColorScheme(event)` — note the Clock's twelve keys are not
faces — and buttons for four of the five error classes, including the one you
would not hit by accident: `UnsupportedScrambleError`, for notation that is
perfectly valid and still has no picture, like a slice move or a commutator.

**`/notation` — reading it.** A live workbench with a **six-way notation
selector**, because the package has six grammars and only one of them is cube
notation.

On the **Cube** tab: `parseAlgorithm` into a typed tree (rendered as a tree, so
you can see that `[R: (U Rw U')2]` is one conjugate and not five tokens),
`serializeAlgorithm` back out, `invertAlgorithm`, and validation on every
keystroke — plus a row per construct the grammar accepts, a row per way it can
fail (nineteen of the twenty `reason` codes; the twentieth is a residual nothing
reaches), and the three foreign notations it refuses on purpose.

On the other five tabs — **Megaminx, Clock, Pyraminx, Skewb, Square-1** — the same
field answers for that grammar instead, via `validateScramble(event, text)`. Each
carries its own accepted-forms list and its own failure table, covering twelve of
the thirteen `ScrambleErrorReason` codes (the thirteenth is that union's
residual). Every code, offset, span and payload in both tables is read from the
package as the page renders; this repo stores only the input and a sentence about
it.

That page is where 0.11.0 and 0.12.0 both show up. An error carries a stable
`reason` code, a `length` so you can underline the offending *token* rather than
pointing at its first character, and whatever a message would interpolate. The
page renders a compiler-style caret line from `offset` and `length` — one function
for both error classes, since the two agree on what those mean — and writes the
sentence itself, because the package ships no message strings beyond the English
`.message` and never will. One language ships here; a second would be another
table keyed the same way, and the codes being stable is exactly what makes that
uninteresting.

There are **two** message tables, not one, and that is worth a look rather than a
shrug: [`syntax-messages.ts`](src/examples/syntax-messages.ts) for the cube codes
and [`scramble-messages.ts`](src/examples/scramble-messages.ts) for the other
thirteen. The package kept `ScrambleErrorReason` as a separate union from
`SyntaxErrorReason` on purpose, and the second file opens with what that cost this
repo and what it bought — in short: a second table and a call site that has to
know which class it holds, in exchange for the cube table not breaking on upgrade,
which it would have, since it is an exhaustive `Record` over every code by design.

The **Square-1** tab is the one to click carefully: its "load a real scramble"
button generates one, which builds a pruning table (~4 s, main thread). The page
says so before you click. Validation itself is free on every tab — parsing is the
half of the package that has no tables.

Nothing on `/notation` builds a pruning table, so it is instant everywhere and the
server-or-browser question below does not arise for it.

**`/code` — the nineteen files worth copying,** grouped by job: generating,
drawing a round, drawing the picture, reading notation, validating input, and the
two primitive surfaces (`FaceMove` helpers, and `createRandomSource` for seeding
your own draws off the same value as the scramble). Between them they touch every
public export of both entry points. They are read from the real files in
[`src/examples/`](src/examples) at build time, so they are type-checked by the
same `npm run build` that ships them and cannot silently rot — and three of them
are the code `/notation` actually runs, not illustrations of it.

The six drawing and batch files added for 0.13.0 lean on that type check harder
than the rest: the two drawing ones import from `@cubesmith/scrambler/draw`, and
since the main entry re-exports nothing from there, a snippet that reached for the
short path would fail the build rather than teach the wrong import.

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
| `444` | ~15 s | 110 ms – 1.3 s |
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

Since 0.13.0 you can move the "first call" column somewhere you have chosen, with
`prepareEvent(event)`. It builds the same tables at a moment you pick — server
boot, or behind an explicit "preparing scrambles" screen — rather than charging
them to whoever asks first. It does not make the cost go away, and for `444` it
does not even make the first scramble cheap: the per-group wing-pair tables and
the centre-generator library stay lazy on purpose, because building them costs
more than the one scramble that needs them. `sq1` leaves about 1.5 s for the same
reason.

Neither of the two pages added in 0.13.0 changes the table above. Drawing needs no
table at all, and a batch pays each cold start exactly once and then multiplies
only the "afterwards" column — which is what makes the browser-versus-server
question sharper there than anywhere else in this demo.

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
