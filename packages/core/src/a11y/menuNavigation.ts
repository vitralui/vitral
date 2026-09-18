import { firstIndex, lastIndex, stepIndex } from './listNavigation';

/**
 * Keyboard movement through nested menus (a tiered menu, a menu bar, a cascade
 * select) as the WAI-ARIA menu and menubar patterns describe it.
 *
 * Where the reader is is a path of indices, one per level, into the lists the
 * menu shows. A submenu is open exactly when it is on that path, or when the
 * focused item is `expanded`: shown with focus still on its parent, as a menu
 * bar does after the arrows move along it with a submenu open.
 */
export interface MenuNavState {
    path: number[];
    expanded: boolean;
}

export interface MenuTreeAccess<T> {
    /** An item's submenu; empty or absent for a leaf. */
    children: (item: T) => readonly T[] | null | undefined;
    /** Items the keyboard passes over: disabled ones, separators. */
    skip?: (item: T) => boolean;
}

export interface MenuNavOptions {
    /** The top level is a horizontal bar: the menubar pattern. */
    horizontal?: boolean;
    /** Right-to-left text, where Left goes forward. */
    rtl?: boolean;
    /** Wrap at either end of a level. Defaults to true. */
    loop?: boolean;
}

export type MenuKeyResult =
    | { type: 'move'; state: MenuNavState }
    /** Enter or Space on an item without a submenu: run it. */
    | { type: 'activate'; state: MenuNavState }
    /** Leave the whole menu: Escape at the top. */
    | { type: 'close' }
    | { type: 'none' };

/** The list shown at `level` along `path`: the roots at 0, then each open item's children. */
export function menuLevel<T>(roots: readonly T[], path: readonly number[], level: number, access: MenuTreeAccess<T>): readonly T[] {
    let list = roots;
    for (let i = 0; i < level; i++) {
        const item = list[path[i] ?? -1];
        list = (item && access.children(item)) || [];
    }
    return list;
}

/** The item a path ends on. */
export function menuItemAt<T>(roots: readonly T[], path: readonly number[], access: MenuTreeAccess<T>): T | undefined {
    if (path.length === 0) return undefined;
    return menuLevel(roots, path, path.length - 1, access)[path[path.length - 1]!];
}

/** Whether an item opens a submenu with at least one item the keyboard can reach. */
export function hasSubmenu<T>(item: T | undefined, access: MenuTreeAccess<T>): boolean {
    if (!item) return false;
    const children = access.children(item) ?? [];
    return firstIndex(children.length, (i) => !!access.skip?.(children[i]!)) >= 0;
}

/** The paths of the submenus open in a state: every ancestor of the focused item, and the item itself when expanded. */
export function openMenuPaths(state: MenuNavState): number[][] {
    const out: number[][] = [];
    for (let i = 1; i < state.path.length; i++) out.push(state.path.slice(0, i));
    if (state.expanded && state.path.length > 0) out.push([...state.path]);
    return out;
}

/** Whether the submenu of the item at `path` is open in `state`. */
export function isMenuOpen(state: MenuNavState, path: readonly number[]): boolean {
    const n = path.length;
    if (n === 0 || n > state.path.length) return false;
    for (let i = 0; i < n; i++) if (state.path[i] !== path[i]) return false;
    return n < state.path.length || state.expanded;
}

/**
 * What a key does from `state`. Up and Down move within a vertical level
 * (and, on a bar, open the submenu at its first or last item); Left and Right
 * move along a bar, or enter and leave submenus; from a submenu of a bar, they
 * move to the neighbouring bar item and show its submenu. Home and End go to
 * the ends of the level; Enter and Space open a submenu or run an item;
 * Escape closes one level. Typeahead and Tab are the component's.
 */
export function menuKeyAction<T>(roots: readonly T[], state: MenuNavState, key: string, access: MenuTreeAccess<T>, options: MenuNavOptions = {}): MenuKeyResult {
    const { horizontal = false, rtl = false, loop = true } = options;
    const path = state.path.length > 0 ? state.path : [-1];
    const level = path.length - 1;
    const siblings = menuLevel(roots, path, level, access);
    const index = path[level]!;
    const item = siblings[index];
    const skipAt = (list: readonly T[]) => (i: number) => !!access.skip?.(list[i]!);
    const at = (p: number[], expanded = false): MenuKeyResult => ({ type: 'move', state: { path: p, expanded } });
    const parent = path.slice(0, -1);
    const bar = horizontal && level === 0;
    const forward = rtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = rtl ? 'ArrowRight' : 'ArrowLeft';

    const step = (direction: 1 | -1): number => {
        if (index < 0 || index >= siblings.length) return direction > 0 ? firstIndex(siblings.length, skipAt(siblings)) : lastIndex(siblings.length, skipAt(siblings));
        return stepIndex(siblings.length, index, direction, skipAt(siblings), loop);
    };
    const enter = (last = false): MenuKeyResult => {
        const children = (item && access.children(item)) || [];
        const target = last ? lastIndex(children.length, skipAt(children)) : firstIndex(children.length, skipAt(children));
        return target >= 0 ? at([...path, target]) : { type: 'none' };
    };
    /** From a bar's submenu, the neighbouring bar item, with its submenu shown. */
    const alongBar = (direction: 1 | -1): MenuKeyResult => {
        const root = stepIndex(roots.length, path[0]!, direction, skipAt(roots), loop);
        return at([root], hasSubmenu(roots[root], access));
    };

    switch (key) {
        case 'ArrowDown':
            if (bar) return hasSubmenu(item, access) ? enter() : { type: 'none' };
            return at([...parent, step(1)]);
        case 'ArrowUp':
            if (bar) return hasSubmenu(item, access) ? enter(true) : { type: 'none' };
            return at([...parent, step(-1)]);
        case forward:
            if (bar) return at([step(1)], state.expanded && hasSubmenu(siblings[step(1)], access));
            if (hasSubmenu(item, access)) return enter();
            if (horizontal) return alongBar(1);
            return { type: 'none' };
        case backward:
            if (bar) return at([step(-1)], state.expanded && hasSubmenu(siblings[step(-1)], access));
            if (horizontal && level === 1) return alongBar(-1);
            if (level > 0) return at(parent);
            return { type: 'none' };
        case 'Home':
            return at([...parent, firstIndex(siblings.length, skipAt(siblings))], bar && state.expanded);
        case 'End':
            return at([...parent, lastIndex(siblings.length, skipAt(siblings))], bar && state.expanded);
        case 'Enter':
        case ' ':
            if (!item || access.skip?.(item)) return { type: 'none' };
            if (hasSubmenu(item, access)) return enter();
            return { type: 'activate', state: { path: [...path], expanded: false } };
        case 'Escape':
            if (level > 0) return at(parent);
            if (state.expanded) return at([...path]);
            return { type: 'close' };
        default:
            return { type: 'none' };
    }
}
