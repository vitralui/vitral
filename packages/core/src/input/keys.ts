import { isMacPlatform } from '../editor/keymap';

/** One key of a shortcut: what is drawn on the cap, and what it is called when that is a symbol. */
export interface KeyCap {
    label: string;
    /** The key's name, when `label` is a symbol a screen reader would read as something else. */
    spoken?: string;
}

/**
 * What the keys with a name are called, in the reader's language: the
 * `keys` group of a locale. A key drawn as a symbol is read by its name here,
 * and one drawn as a word (Space, Esc) is drawn with it.
 */
export type KeyNames = Partial<Record<'command' | 'control' | 'option' | 'shift' | 'enter' | 'escape' | 'tab' | 'space' | 'backspace' | 'delete' | 'up' | 'down' | 'left' | 'right' | 'pageUp' | 'pageDown', string>>;

type NamedCap = KeyCap & { name?: keyof KeyNames };

// `mod` is the platform's command key: ⌘ on a Mac, Ctrl everywhere else.
const MAC: Record<string, NamedCap> = {
    mod: { label: '⌘', spoken: 'Command', name: 'command' },
    meta: { label: '⌘', spoken: 'Command', name: 'command' },
    cmd: { label: '⌘', spoken: 'Command', name: 'command' },
    command: { label: '⌘', spoken: 'Command', name: 'command' },
    ctrl: { label: '⌃', spoken: 'Control', name: 'control' },
    control: { label: '⌃', spoken: 'Control', name: 'control' },
    alt: { label: '⌥', spoken: 'Option', name: 'option' },
    option: { label: '⌥', spoken: 'Option', name: 'option' },
    shift: { label: '⇧', spoken: 'Shift', name: 'shift' }
};

const OTHER: Record<string, NamedCap> = {
    mod: { label: 'Ctrl' },
    meta: { label: 'Win' },
    cmd: { label: 'Ctrl' },
    command: { label: 'Ctrl' },
    ctrl: { label: 'Ctrl' },
    control: { label: 'Ctrl' },
    alt: { label: 'Alt' },
    option: { label: 'Alt' },
    shift: { label: 'Shift', name: 'shift' }
};

// Keys every platform draws the same way.
const COMMON: Record<string, NamedCap> = {
    enter: { label: '↵', spoken: 'Enter', name: 'enter' },
    return: { label: '↵', spoken: 'Enter', name: 'enter' },
    esc: { label: 'Esc', name: 'escape' },
    escape: { label: 'Esc', name: 'escape' },
    tab: { label: 'Tab', name: 'tab' },
    space: { label: 'Space', name: 'space' },
    backspace: { label: '⌫', spoken: 'Backspace', name: 'backspace' },
    delete: { label: 'Del', name: 'delete' },
    up: { label: '↑', spoken: 'Up', name: 'up' },
    arrowup: { label: '↑', spoken: 'Up', name: 'up' },
    down: { label: '↓', spoken: 'Down', name: 'down' },
    arrowdown: { label: '↓', spoken: 'Down', name: 'down' },
    left: { label: '←', spoken: 'Left', name: 'left' },
    arrowleft: { label: '←', spoken: 'Left', name: 'left' },
    right: { label: '→', spoken: 'Right', name: 'right' },
    arrowright: { label: '→', spoken: 'Right', name: 'right' },
    pageup: { label: 'PgUp', spoken: 'Page Up', name: 'pageUp' },
    pagedown: { label: 'PgDn', spoken: 'Page Down', name: 'pageDown' }
};

/**
 * The caps of a shortcut, as a person reads them on this platform:
 * `'mod+shift+p'` is ⌘ ⇧ P on a Mac and Ctrl Shift P elsewhere. A string is
 * split on `+` (a lone `+` is the plus key); an array is taken as the keys
 * already split. Anything not recognised is drawn as written, a single
 * letter in capitals. `names` is what the keys are called in the reader's
 * language (a locale's `keys`); English where it says nothing.
 */
export function keyCaps(keys: string | readonly string[], mac = isMacPlatform(), names: KeyNames = {}): KeyCap[] {
    const list = typeof keys === 'string' ? splitShortcut(keys) : keys;
    const named = mac ? MAC : OTHER;
    return list.map((key) => {
        const lower = key.toLowerCase();
        const known = named[lower] ?? COMMON[lower];
        if (!known) return { label: key.length === 1 ? key.toUpperCase() : key };
        const { name, ...cap } = known;
        const called = name ? names[name] : undefined;
        if (!called) return cap;
        // A symbol keeps its drawing and is read by its name; a word is the name.
        return cap.spoken ? { ...cap, spoken: called } : { ...cap, label: called };
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
