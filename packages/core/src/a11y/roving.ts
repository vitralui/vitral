import { firstIndex, lastIndex, stepIndex, type IsDisabled } from './listNavigation';

export type RovingOrientation = 'horizontal' | 'vertical';

/** Where a key sends focus inside a composite widget: tabs, a toolbar, a menu, accordion headers. */
export type RovingMove = 'next' | 'previous' | 'first' | 'last';

export interface RovingKeyOptions {
    /** Which arrows move: Left/Right, Up/Down, or all four. Defaults to both. */
    orientation?: RovingOrientation | 'both';
    /** Right-to-left reading order, where Left means next. */
    rtl?: boolean;
    /** Whether Home and End jump to the ends. Defaults to true. */
    homeEnd?: boolean;
}

/**
 * The move a keydown asks for in a widget with a single tab stop, the
 * "roving tabindex" composites of the WAI-ARIA APG. Null for any other key, so
 * the caller knows to leave the event alone.
 */
export function rovingMove(key: string, options: RovingKeyOptions = {}): RovingMove | null {
    const { orientation = 'both', rtl = false, homeEnd = true } = options;
    const horizontal = orientation !== 'vertical';
    const vertical = orientation !== 'horizontal';
    switch (key) {
        case 'ArrowRight':
            return horizontal ? (rtl ? 'previous' : 'next') : null;
        case 'ArrowLeft':
            return horizontal ? (rtl ? 'next' : 'previous') : null;
        case 'ArrowDown':
            return vertical ? 'next' : null;
        case 'ArrowUp':
            return vertical ? 'previous' : null;
        case 'Home':
            return homeEnd ? 'first' : null;
        case 'End':
            return homeEnd ? 'last' : null;
        default:
            return null;
    }
}

/**
 * The index a move lands on among `count` items, skipping disabled ones. A
 * `from` of -1 means nothing has focus yet: next starts at the first item,
 * previous at the last. Wraps at the ends unless `loop` is false.
 */
export function rovingIndex(move: RovingMove, count: number, from: number, isDisabled?: IsDisabled, loop = true): number {
    if (move === 'first') return firstIndex(count, isDisabled);
    if (move === 'last') return lastIndex(count, isDisabled);
    if (from < 0 || from >= count) return move === 'next' ? firstIndex(count, isDisabled) : lastIndex(count, isDisabled);
    return stepIndex(count, from, move === 'next' ? 1 : -1, isDisabled, loop);
}
