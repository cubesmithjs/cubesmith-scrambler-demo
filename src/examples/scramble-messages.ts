import type { ScrambleErrorReason, ScrambleSyntaxError } from '@cubesmith/scrambler';

import type { MessageLocale } from './syntax-messages';

/**
 * The same job `syntax-messages.ts` does, for the *other* union — and the
 * friction of it being a second file is the point, not an accident.
 *
 * 0.12.0 added `ScrambleErrorReason`, thirteen codes covering the five bespoke
 * notations, as a **separate** union from `SyntaxErrorReason` rather than as new
 * members of it. That decision is why this file exists instead of eleven more
 * rows in the existing table, and the trade is worth stating from the consumer
 * side, since this repo is the consumer:
 *
 * **What it cost:** a second `Record`, a second `describe…` function, and a call
 * site that has to know which of the two it is holding. Handling all six
 * grammars means writing two switches.
 *
 * **What it bought:** upgrading from 0.11.0 to 0.12.0 did not break
 * `syntax-messages.ts`. That table is an exhaustive `Record<SyntaxErrorReason,
 * Template>` — deliberately, so a new cube code is a compile error rather than a
 * vague message in production — and if the thirteen codes below had been added
 * to `SyntaxErrorReason`, it would have stopped compiling on upgrade even though
 * nothing about cube notation changed. Thirteen sentences it does not need would
 * have been the price of a release it does not use.
 *
 * That is the honest shape of the thing: they are two grammars. A `clock-*` code
 * cannot happen to a cube algorithm, so a table that had to handle both would be
 * carrying arms that can never fire.
 *
 * 🔴 As with 0.11.0, the package ships **no message strings** for these codes and
 * never will. Every sentence below is this repo's.
 */

/** Takes the error, so each template reads only the fields its own code populates. */
type Template = (error: ScrambleSyntaxError) => string;

/**
 * All thirteen codes, in both languages.
 *
 * Exhaustive `Record` for the same reason the cube table is: adding a code is
 * not breaking for the package, so the release that adds one should stop this
 * file compiling rather than ship a shrug to users.
 *
 * The prefix on every code is what makes this table readable — `clock-…` rows
 * sit together and are about pins and hours, `square1-…` rows about pairs and
 * slices. Nothing here has to disambiguate against a cube code.
 */
const MESSAGES: Record<MessageLocale, Record<ScrambleErrorReason, Template>> = {
  en: {
    'megaminx-not-a-move': (error) =>
      `"${error.char}" is not a Megaminx move. The whole notation is U, U', R++, R--, D++ and D--.`,
    'megaminx-bad-direction': (error) =>
      `"${error.token}" names a move but not a direction. U takes a prime; R and D take ++ or --.`,
    'pyraminx-not-a-vertex': (error) =>
      `"${error.char}" is not a Pyraminx vertex. Uppercase U L R B turns a layer, lowercase turns just that tip.`,
    'pyraminx-bad-amount': (error) =>
      `"${error.token}" has no valid amount. A Pyraminx turn has order 3, so there is no half turn — counterclockwise is written '.`,
    'skewb-not-a-corner': (error) =>
      `"${error.char}" is not a Skewb corner. Fixed Corner Notation uses U R L B, uppercase only.`,
    'skewb-bad-amount': (error) =>
      `"${error.token}" has no valid amount. A Skewb turn has order 3, so R2 is not a move — counterclockwise is R'.`,
    'clock-not-a-token': (error) =>
      `"${error.token}" is not shaped like a Clock token. Write a pin group and an amount together, as in UR4+, or y2 for the flip.`,
    'clock-not-a-pin-set': (error) =>
      `"${error.pins}" is not a pin group. The nine are UR DR DL UL, U R D L, and ALL.`,
    'clock-hour-out-of-range': (error) =>
      `${error.hours} is past the hour range. Twelve amounts are spelled 0+ to 6+ and 1- to 5-, so 7 hours is written 5-.`,
    'clock-pin-not-a-corner': (error) =>
      `"${error.pins}" can turn a wheel but cannot close a scramble. Only a single corner — UR, DR, DL or UL — declares a pin left up.`,
    'square1-stray-character': (error) =>
      `"${error.char}" does not belong here. A Square-1 scramble is (top, bottom) pairs and / slices, as in (1, 0) / (0, -2) /.`,
    'square1-zero-turn': (error) =>
      `${error.token} turns nothing, so it is a spelling rather than a move — and it would still cost a move.`,
    // The residual, spelled exactly as the cube union spells it, and with the
    // same meaning. Nothing any of the five parsers currently produces reaches
    // it; it is what an error built without a detail reports.
    'unexpected-token': () => 'This is not valid notation for this event.',
  },
  fr: {
    'megaminx-not-a-move': (error) =>
      `« ${error.char} » n'est pas un mouvement Megaminx. Toute la notation tient en U, U', R++, R--, D++ et D--.`,
    'megaminx-bad-direction': (error) =>
      `« ${error.token} » nomme un mouvement mais pas une direction. U prend un prime ; R et D prennent ++ ou --.`,
    'pyraminx-not-a-vertex': (error) =>
      `« ${error.char} » n'est pas un sommet du Pyraminx. En majuscule, U L R B tourne une couche ; en minuscule, seulement la pointe.`,
    'pyraminx-bad-amount': (error) =>
      `« ${error.token} » n'a pas de quantité valide. Un tour de Pyraminx est d'ordre 3 : pas de demi-tour, le sens antihoraire s'écrit '.`,
    'skewb-not-a-corner': (error) =>
      `« ${error.char} » n'est pas un coin du Skewb. La notation à coin fixe utilise U R L B, en majuscules uniquement.`,
    'skewb-bad-amount': (error) =>
      `« ${error.token} » n'a pas de quantité valide. Un tour de Skewb est d'ordre 3 : R2 n'existe pas, l'antihoraire s'écrit R'.`,
    'clock-not-a-token': (error) =>
      `« ${error.token} » n'a pas la forme d'un jeton Clock. Écrivez un groupe de pions suivi d'une quantité, comme UR4+, ou y2 pour le retournement.`,
    'clock-not-a-pin-set': (error) =>
      `« ${error.pins} » n'est pas un groupe de pions. Les neuf sont UR DR DL UL, U R D L et ALL.`,
    'clock-hour-out-of-range': (error) =>
      `${error.hours} dépasse la plage horaire. Les douze quantités s'écrivent de 0+ à 6+ et de 1- à 5- : 7 heures s'écrit donc 5-.`,
    'clock-pin-not-a-corner': (error) =>
      `« ${error.pins} » peut tourner une roue mais ne peut pas clore un mélange. Seul un coin isolé — UR, DR, DL ou UL — déclare un pion resté levé.`,
    'square1-stray-character': (error) =>
      `« ${error.char} » n'a pas sa place ici. Un mélange Square-1 est fait de paires (haut, bas) et de tranches /, comme (1, 0) / (0, -2) /.`,
    'square1-zero-turn': (error) =>
      `${error.token} ne tourne rien : c'est une écriture, pas un mouvement — et cela coûterait quand même un mouvement.`,
    'unexpected-token': () => "Cette notation n'est pas valide pour cet événement.",
  },
};

/** The sentence to show a user, for a bespoke-notation error. */
export function describeScrambleError(
  error: ScrambleSyntaxError,
  locale: MessageLocale,
): string {
  return MESSAGES[locale][error.reason](error);
}

/**
 * The fields this error carries, as `key: value` pairs, skipping the ones its
 * code does not populate.
 *
 * Read off the instance rather than looked up by code, so a release that starts
 * carrying an extra field on an existing code shows it here without this repo
 * being edited.
 */
export function scramblePayloadOf(
  error: ScrambleSyntaxError,
): readonly (readonly [string, string])[] {
  const entries: (readonly [string, string])[] = [];
  if (error.token !== undefined) entries.push(['token', `"${error.token}"`]);
  if (error.char !== undefined) entries.push(['char', `"${error.char}"`]);
  if (error.pins !== undefined) entries.push(['pins', error.pins]);
  if (error.hours !== undefined) entries.push(['hours', String(error.hours)]);
  return entries;
}
