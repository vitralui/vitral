import type { IconDef } from './types';

/**
 * Which icons are flipped horizontally where the page reads right to left.
 *
 * The test is what the drawing *means*, not which way it points. A chevron on
 * a "next" button means the direction the reader is travelling, so in Arabic it
 * has to point the other way; `alignLeft` means the left of the paragraph and
 * points there in every language. Get this wrong in either direction and the
 * icon lies, so the set is kept as one reviewable list rather than a flag
 * sprinkled over twenty-five files.
 *
 * Deliberately absent, because the convention is that they do not flip:
 * - media transport (`play`, `rewind`, `fastForward`, `skipBack`, `skipForward`) —
 *   a timeline runs left to right in every locale, and every RTL player keeps
 *   the play button pointing right;
 * - `alignLeft`, `alignRight`, `toggleLeft`, `toggleRight` — the name is the
 *   meaning;
 * - `rotateLeft`, `rotateRight`, `refresh` — rotation is clockwise or it is
 *   not, and reading direction has no say;
 * - `trendingUp`, `trendingDown` — a chart's time axis is not mirrored either;
 * - anything symmetric (`arrowLeftRight`, `chevronsUpDown`, `arrowsSwap`),
 *   where flipping is a no-op.
 */
export const mirroredIcons: ReadonlySet<string> = new Set([
    // Travel along the line: back and forward, first and last.
    'chevronLeft', 'chevronRight', 'chevronsLeft', 'chevronsRight', 'caretLeft', 'caretRight',
    'arrowLeft', 'arrowRight', 'arrowBigLeft', 'arrowBigRight', 'arrowCircleLeft', 'arrowCircleRight',
    'arrowLeftToLine', 'arrowRightToLine', 'arrowUpLeft', 'arrowUpRight', 'arrowDownLeft', 'arrowDownRight',
    'cornerUpLeft', 'cornerUpRight', 'cornerDownLeft', 'cornerDownRight',
    // Going back over what was done, or sending it on.
    'undo', 'redo', 'history', 'reply', 'replyAll', 'forward', 'send', 'productReturn',
    // Leaving the page, or the application.
    'externalLink', 'shareBox', 'logIn', 'logOut',
    // A margin, a panel or a speaker on the starting side.
    'indent', 'quote', 'sidebar', 'sidebarRight', 'flag', 'flagTriangle',
    'list', 'listOrdered', 'listChecks', 'layoutList',
    'volume', 'volumeLow', 'volumeHigh', 'volumeX'
]);

/**
 * Whether this icon is drawn the other way round in right-to-left. An icon of
 * your own answers for itself through `mirrored`; a built-in one falls back to
 * {@link mirroredIcons}, which `mirrored: false` overrides.
 */
export function isMirrored(def: IconDef): boolean {
    return def.mirrored ?? mirroredIcons.has(def.name);
}
