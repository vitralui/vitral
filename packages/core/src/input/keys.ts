import { isMacPlatform } from '../editor/keymap';

/** One key of a shortcut: what is drawn on the cap, and what it is called when that is a symbol. */
export interface KeyCap {
    label: string;
    /** The key's name, when `label` is a symbol a screen reader would read as something else. */
    spoken?: string;
}

// `mod` is the platform's command key: ⌘ on a Mac, Ctrl everywhere else.
const MAC: Record<string, KeyCap> = {
    mod: { label: '⌘', spoken: 'Command' },
    meta: { label: '⌘', spoken: 'Command' },
    cmd: { label: '⌘', spoken: 'Command' },
    command: { label: '⌘', spoken: 'Command' },
    ctrl: { label: '⌃', spoken: 'Control' },
    control: { label: '⌃', spoken: 'Control' },
    alt: { label: '⌥', spoken: 'Option' },
    option: { label: '⌥', spoken: 'Option' },
    shift: { label: '⇧', spoken: 'Shift' }
};

const OTHER: Record<string, KeyCap> = {
    mod: { label: 'Ctrl' },
    meta: { label: 'Win' },
    cmd: { label: 'Ctrl' },
    command: { label: 'Ctrl' },
    ctrl: { label: 'Ctrl' },
    control: { label: 'Ctrl' },
    alt: { label: 'Alt' },
    option: { label: 'Alt' },
    shift: { label: 'Shift' }
};

// Keys every platform draws the same way.
const COMMON: Record<string, KeyCap> = {
    enter: { label: '↵', spoken: 'Enter' },
    return: { label: '↵', spoken: 'Enter' },
    esc: { label: 'Esc' },
    escape: { label: 'Esc' },
    tab: { label: 'Tab' },
    space: { label: 'Space' },
    backspace: { label: '⌫', spoken: 'Backspace' },
    delete: { label: 'Del' },
    up: { label: '↑', spoken: 'Up' },
    arrowup: { label: '↑', spoken: 'Up' },
    down: { label: '↓', spoken: 'Down' },
    arrowdown: { label: '↓', spoken: 'Down' },
    left: { label: '←', spoken: 'Left' },
    arrowleft: { label: '←', spoken: 'Left' },
    right: { label: '→', spoken: 'Right' },
    arrowright: { label: '→', spoken: 'Right' },
    pageup: { label: 'PgUp', spoken: 'Page Up' },
    pagedown: { label: 'PgDn', spoken: 'Page Down' }
};

/**
 * The caps of a shortcut, as a person reads them on this platform:
 * `'mod+shift+p'` is ⌘ ⇧ P on a Mac and Ctrl Shift P elsewhere. A string is
 * split on `+` (a lone `+` is the plus key); an array is taken as the keys
 * already split. Anything not recognised is drawn as written, a single
 * letter in capitals.
 */
export function keyCaps(keys: string | readonly string[], mac = isMacPlatform()): KeyCap[] {
    const list = typeof keys === 'string' ? splitShortcut(keys) : keys;
    const named = mac ? MAC : OTHER;
    return list.map((key) => {
        const lower = key.toLowerCase();
        return named[lower] ?? COMMON[lower] ?? { label: key.length === 1 ? key.toUpperCase() : key };
    });
}

function splitShortcut(value: string): string[] {
    const trimmed = value.trim();
    if (trimmed === '+') return ['+'];
    const parts = trimmed.split('+').map((p) => p.trim());
    // `ctrl++`: the trailing empty pair was the plus key itself.
    if (parts.length > 1 && parts.at(-1) === '' && parts.at(-2) === '') return [...parts.slice(0, -2), '+'];
    return parts.filter(Boolean);
}
