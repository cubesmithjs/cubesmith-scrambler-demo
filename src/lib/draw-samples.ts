import type { WcaEventId } from '@cubesmith/scrambler';

/**
 * One real scramble per drawable event, so the draw page has something to show
 * before you touch anything.
 *
 * These are **stored strings, not generated on load**, and that is the point
 * rather than a shortcut. `drawScramble` takes a scramble as *text* — TNoodle's
 * own signature — so drawing needs no scrambler, no pruning table and no cold
 * start. A page that opened by generating a 4x4x4 would freeze for seven seconds
 * to prove the opposite of what this page is about.
 *
 * Each one was produced by `generateScramble(event, { seed })` at the version
 * named below and pasted here, so they are genuine scrambles rather than
 * plausible-looking hand-written ones — including the parts a hand-written
 * sample would forget: `333fm`'s `R' U' F` padding at both ends, and the
 * rotations the blindfolded events append.
 *
 * 🔴 The `clock` entry is fifteen tokens because 0.14.0 emits fifteen. The
 * `/whats-new` page has the old nineteen-token spelling, still accepted and
 * still drawable — deliberately kept somewhere, since "emit narrow, accept wide"
 * is only a claim until something exercises the wide half.
 */
export const DRAW_SAMPLES: Readonly<Record<WcaEventId, string>> = {
  '222': "U2 R U' R2 U' F2 R U2 R2 U' R",
  '333': "U2 B2 U L2 B2 F2 U' F2 R2 U' B2 D L2 D F' R2 L D' R' F U2 L2 D' U'",
  '444':
    "F2 D U2 B2 R2 F2 R2 U' L2 F2 U' B2 L2 U' R' D B' F' L' F L U B U Uw' R' U R L D L' Uw Lw F R' L' F' Lw' Uw2 U2 B U2 B' Uw2 Fw2 D Rw2 R' U Fw2 L F' D' Bw' Dw L D' Fw U' Lw F' Uw2",
  '555':
    "Bw2 L Dw' Rw L' Bw2 U2 B2 Dw' R Lw Rw F' Lw2 Fw Dw2 L B2 Fw' D L Lw2 Rw2 B2 Rw2 L' U2 B Fw2 U Dw L' Dw' Bw' F2 Dw2 B F2 Lw2 Rw2 Uw' F2 U Uw F2 Uw' Dw' Fw U2 Fw2 Lw Dw' Fw2 Uw2 R2 Bw L' Rw U F2",
  '666':
    "3Rw D2 3Bw' D' 3Fw' U' Dw2 Rw' 3Fw' Bw' F' 3Dw Dw2 Lw 3Dw Rw2 Fw2 3Uw L2 B2 3Uw' U2 F Uw' D Lw2 Dw 3Rw' Lw Uw' Fw 3Rw Rw' Bw' D2 3Fw2 3Bw2 Lw' Rw' 3Dw2 Fw D2 3Lw' Fw Dw 3Uw 3Bw' 3Lw Rw 3Rw2 Fw2 R B Lw2 3Fw' B 3Uw2 Dw2 Rw Bw2 Rw R2 3Fw2 B2 Fw2 L2 R 3Dw F Rw 3Lw2 L2 F' Lw L' 3Lw2 Dw' 3Uw2 L' Bw",
  '777':
    "3Dw' 3Bw2 Lw2 R2 L2 U Lw L2 B F D Uw' Rw2 3Bw Lw2 Fw Dw D Fw2 Rw2 3Dw' Dw Fw' 3Lw' R' D Rw2 3Lw2 U' Dw' Bw2 3Dw Fw2 Lw' 3Rw2 R2 U2 B' 3Bw' 3Lw' 3Rw' Uw Fw' Uw 3Bw2 D2 3Fw D2 Uw Bw D2 U2 R2 D' Rw2 D L2 D 3Dw Dw 3Uw2 B' 3Uw' R' Dw2 3Bw 3Uw' Bw2 F' 3Uw D' Fw2 Dw2 F' Dw 3Fw D' 3Dw U2 Dw' Fw' 3Fw' 3Rw' Bw' 3Rw2 Bw2 F2 Rw Fw' 3Bw Bw2 Lw2 3Rw Uw Fw2 B' 3Rw2 3Bw2 Rw2 3Rw",
  '333bf': "U2 B2 U L2 B2 F2 U' F2 R2 U' B2 D L2 D F' R2 L D' R' F U2 L2 D' U' Fw2",
  '333fm':
    "R' U' F U2 B2 U L2 B2 F2 U' F2 R2 U' B2 D L2 D F' R2 L D' R' F U2 L2 D' U' R' U' F",
  '333oh': "U2 B2 U L2 B2 F2 U' F2 R2 U' B2 D L2 D F' R2 L D' R' F U2 L2 D' U'",
  '333mbf': "U2 B2 U L2 B2 F2 U' F2 R2 U' B2 D L2 D F' R2 L D' R' F U2 L2 D' U' Fw2",
  '444bf':
    "F2 D U2 B2 R2 F2 R2 U' L2 F2 U' B2 L2 U' R' D B' F' L' F L U B U Uw' R' U R L D L' Uw Lw F R' L' F' Lw' Uw2 U2 B U2 B' Uw2 Fw2 D Rw2 R' U Fw2 L F' D' Bw' Dw L D' Fw U' Lw F' Uw2 x2 y",
  '555bf':
    "R2 F2 L Bw2 Fw2 U F Uw2 Fw' B2 D2 U L Dw2 F' Rw' D Bw B2 F2 Fw R Dw' Rw Fw Rw U2 Rw2 Lw' L' B Lw F' D2 F' R Rw Dw2 F L' Uw' R' Fw2 R F2 Fw' D2 U' B' Uw' D Dw Bw' B' R2 U2 D R' Bw' B' 3Uw2 3Fw'",
  clock: 'UR0+ DR2+ DL5+ UL5+ U1+ R1+ D3+ L6+ ALL5+ y2 U5- R2+ D4+ L3- ALL2+',
  minx:
    "R++ D++ R++ D-- R-- D++ R++ D++ R++ D-- U' R++ D++ R-- D-- R++ D++ R-- D++ R++ D++ U R++ D-- R++ D-- R++ D-- R-- D++ R++ D-- U R-- D++ R++ D++ R-- D-- R++ D-- R-- D-- U' R-- D-- R-- D-- R-- D-- R++ D++ R-- D-- U R++ D++ R-- D++ R++ D++ R-- D-- R-- D-- U R-- D-- R-- D-- R-- D-- R-- D-- R++ D++ U'",
  pyram: "L U' R U' L' R B U R B R u' l b'",
  skewb: "U' L B L' U' R L' U' R' B R'",
  sq1: '(6,2) / (3,-3) / (-3,6) / (-2,-5) / (-1,-4) / (0,-3) / (-2,1) / (-3,-1) / (-3,0) / (-3,-2) / (-2,-1) / (0,-2) / (-2,-3) / (0,1)',
};

/**
 * The nineteen-token Clock spelling this package emitted up to and including
 * `0.13.0`, kept because 0.14.0's compatibility promise is about *this string*.
 *
 * It ends in two bare pin names describing the final pins-up state. 0.14.0 stopped
 * writing them — TNoodle never did — but the parser was deliberately not narrowed,
 * because a scramble already sitting in a consumer's database was written this way
 * and rejecting it later would turn a cosmetic change into data loss.
 */
export const LEGACY_CLOCK_SCRAMBLE =
  'UR1- DR5- DL5- UL2+ U5+ R6+ D6+ L0+ ALL1+ y2 U6+ R5- D1- L4+ ALL5+ DL UL';

/** The same draw, in the spelling 0.14.0 emits. Byte-identical up to the pins. */
export const MODERN_CLOCK_SCRAMBLE =
  'UR1- DR5- DL5- UL2+ U5+ R6+ D6+ L0+ ALL1+ y2 U6+ R5- D1- L4+ ALL5+';
