import { describe, expect, it } from 'vitest';
import { hasSubmenu, isMenuOpen, menuItemAt, menuKeyAction, menuLevel, openMenuPaths, type MenuNavState } from './menuNavigation';

interface Item {
    label: string;
    disabled?: boolean;
    items?: Item[];
}

const model: Item[] = [
    { label: 'File', items: [{ label: 'New', items: [{ label: 'Doc' }, { label: 'Sheet' }] }, { label: 'Open' }, { label: 'Quit', disabled: true }] },
    { label: 'Edit', items: [{ label: 'Cut' }, { label: 'Copy' }] },
    { label: 'Help' }
];
const access = { children: (i: Item) => i.items, skip: (i: Item) => !!i.disabled };
const s = (path: number[], expanded = false): MenuNavState => ({ path, expanded });
const key = (state: MenuNavState, k: string, horizontal = false, rtl = false) => menuKeyAction(model, state, k, access, { horizontal, rtl });

describe('menu tree access', () => {
    it('reads levels and items along a path', () => {
        expect(menuLevel(model, [0, 0], 1, access).map((i) => i.label)).toEqual(['New', 'Open', 'Quit']);
        expect(menuItemAt(model, [0, 0, 1], access)?.label).toBe('Sheet');
        expect(menuItemAt(model, [], access)).toBeUndefined();
        expect(hasSubmenu(model[0], access)).toBe(true);
        expect(hasSubmenu(model[2], access)).toBe(false);
        expect(hasSubmenu({ label: 'x', items: [{ label: 'y', disabled: true }] }, access)).toBe(false);
    });

    it('knows which submenus a state shows', () => {
        expect(openMenuPaths(s([0, 0, 1]))).toEqual([[0], [0, 0]]);
        expect(openMenuPaths(s([1], true))).toEqual([[1]]);
        expect(isMenuOpen(s([0, 0, 1]), [0, 0])).toBe(true);
        expect(isMenuOpen(s([0, 0, 1]), [0, 1])).toBe(false);
        expect(isMenuOpen(s([0, 0]), [0, 0])).toBe(false);
        expect(isMenuOpen(s([0, 0], true), [0, 0])).toBe(true);
    });
});

describe('vertical menus', () => {
    it('steps within a level, wrapping and skipping disabled items', () => {
        expect(key(s([0, 1]), 'ArrowDown')).toEqual({ type: 'move', state: s([0, 0]) });
        expect(key(s([0, 0]), 'ArrowUp')).toEqual({ type: 'move', state: s([0, 1]) });
        expect(key(s([0, 0]), 'End')).toEqual({ type: 'move', state: s([0, 1]) });
        expect(key(s([2]), 'Home')).toEqual({ type: 'move', state: s([0]) });
        expect(key(s([]), 'ArrowDown')).toEqual({ type: 'move', state: s([0]) });
        expect(key(s([]), 'ArrowUp')).toEqual({ type: 'move', state: s([2]) });
    });

    it('enters submenus with Right, Enter or Space and leaves them with Left or Escape', () => {
        expect(key(s([0]), 'ArrowRight')).toEqual({ type: 'move', state: s([0, 0]) });
        expect(key(s([0, 0]), 'Enter')).toEqual({ type: 'move', state: s([0, 0, 0]) });
        expect(key(s([0, 0, 1]), 'ArrowLeft')).toEqual({ type: 'move', state: s([0, 0]) });
        expect(key(s([0, 0, 1]), 'Escape')).toEqual({ type: 'move', state: s([0, 0]) });
        expect(key(s([2]), 'ArrowRight')).toEqual({ type: 'none' });
        expect(key(s([0]), 'ArrowLeft')).toEqual({ type: 'none' });
        expect(key(s([0]), 'ArrowLeft', false, true)).toEqual({ type: 'move', state: s([0, 0]) });
        expect(key(s([0]), 'Escape')).toEqual({ type: 'close' });
    });

    it('runs a leaf with Enter or Space, and ignores disabled ones', () => {
        expect(key(s([0, 1]), ' ')).toEqual({ type: 'activate', state: s([0, 1]) });
        expect(key(s([0, 2]), 'Enter')).toEqual({ type: 'none' });
        expect(key(s([0]), 'x')).toEqual({ type: 'none' });
    });
});

describe('menu bars', () => {
    it('moves along the bar, keeping a shown submenu shown', () => {
        expect(key(s([0]), 'ArrowRight', true)).toEqual({ type: 'move', state: s([1]) });
        expect(key(s([0], true), 'ArrowRight', true)).toEqual({ type: 'move', state: s([1], true) });
        expect(key(s([1], true), 'ArrowRight', true)).toEqual({ type: 'move', state: s([2], false) });
        expect(key(s([0]), 'ArrowLeft', true)).toEqual({ type: 'move', state: s([2]) });
        expect(key(s([1], true), 'End', true)).toEqual({ type: 'move', state: s([2], true) });
    });

    it('opens a submenu at its first or last item with Down or Up', () => {
        expect(key(s([1]), 'ArrowDown', true)).toEqual({ type: 'move', state: s([1, 0]) });
        expect(key(s([1]), 'ArrowUp', true)).toEqual({ type: 'move', state: s([1, 1]) });
        expect(key(s([2]), 'ArrowDown', true)).toEqual({ type: 'none' });
    });

    it('goes from a submenu to the neighbouring bar item, showing its submenu', () => {
        expect(key(s([0, 1]), 'ArrowRight', true)).toEqual({ type: 'move', state: s([1], true) });
        expect(key(s([1, 0]), 'ArrowRight', true)).toEqual({ type: 'move', state: s([2], false) });
        expect(key(s([1, 0]), 'ArrowLeft', true)).toEqual({ type: 'move', state: s([0], true) });
        expect(key(s([0, 0, 0]), 'ArrowLeft', true)).toEqual({ type: 'move', state: s([0, 0]) });
        expect(key(s([0, 0]), 'ArrowRight', true)).toEqual({ type: 'move', state: s([0, 0, 0]) });
    });

    it('closes one level on Escape, then the shown submenu, then leaves', () => {
        expect(key(s([1, 0]), 'Escape', true)).toEqual({ type: 'move', state: s([1]) });
        expect(key(s([1], true), 'Escape', true)).toEqual({ type: 'move', state: s([1]) });
        expect(key(s([1]), 'Escape', true)).toEqual({ type: 'close' });
    });
});
