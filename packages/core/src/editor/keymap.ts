/** A keyboard event, or anything shaped like one. */
export interface EditorKeyEvent {
    key: string;
    code?: string;
    ctrlKey?: boolean;
    metaKey?: boolean;
    altKey?: boolean;
    shiftKey?: boolean;
}

export const isMacPlatform = (): boolean =>
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test((navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform ?? '');

/**
 * A key as a keymap names it: modifiers in the order `Mod-Ctrl-Alt-Shift-`
 * (`Mod` being Cmd on a Mac and Ctrl elsewhere), then the key: a lower-case
 * letter, a digit read from the physical key (so Shift+7 is `Shift-7` on
 * every layout), or the key's name (`Enter`, `Tab`, `F10`).
 */
export function keyName(event: EditorKeyEvent, mac = isMacPlatform()): string {
    let key = event.key;
    if (event.code && /^Digit\d$/.test(event.code) && (event.shiftKey || event.altKey)) key = event.code.slice(5);
    else if (event.code && /^Key[A-Z]$/.test(event.code) && (event.altKey || !/^[a-z]$/i.test(key))) key = event.code.slice(3).toLowerCase();
    else if (key.length === 1) key = key.toLowerCase();
    if (key === ' ') key = 'Space';
    const parts: string[] = [];
    const mod = mac ? event.metaKey : event.ctrlKey;
    if (mod) parts.push('Mod');
    if (mac && event.ctrlKey) parts.push('Ctrl');
    if (!mac && event.metaKey) parts.push('Meta');
    if (event.altKey) parts.push('Alt');
    if (event.shiftKey) parts.push('Shift');
    parts.push(key);
    return parts.join('-');
}

/** What a key does: a command name and its arguments. */
export type EditorKeyBinding = readonly [command: string, ...args: unknown[]];

/**
 * The editor's shortcuts. `link` and `toolbar` are not commands but requests
 * to the interface: open the link editor, move focus to the toolbar.
 */
export const editorKeymap: Readonly<Record<string, EditorKeyBinding>> = {
    'Mod-b': ['toggleBold'],
    'Mod-i': ['toggleItalic'],
    'Mod-u': ['toggleUnderline'],
    'Mod-Shift-s': ['toggleStrike'],
    'Mod-Shift-x': ['toggleStrike'],
    'Mod-e': ['toggleCode'],
    'Mod-k': ['link'],
    'Mod-z': ['undo'],
    'Mod-Shift-z': ['redo'],
    'Mod-y': ['redo'],
    'Mod-a': ['selectAll'],
    'Mod-Alt-0': ['setParagraph'],
    'Mod-Alt-1': ['toggleHeading', 1],
    'Mod-Alt-2': ['toggleHeading', 2],
    'Mod-Alt-3': ['toggleHeading', 3],
    'Mod-Alt-c': ['toggleCodeBlock'],
    'Mod-Shift-7': ['toggleOrderedList'],
    'Mod-Shift-8': ['toggleBulletList'],
    'Mod-Shift-9': ['toggleTaskList'],
    'Mod-Shift-b': ['toggleBlockquote'],
    'Mod-\\': ['clearFormatting'],
    'Shift-Enter': ['insertHardBreak'],
    'Mod-Enter': ['insertHardBreak'],
    Enter: ['enter'],
    Tab: ['indent'],
    'Shift-Tab': ['outdent'],
    'Alt-F10': ['toolbar']
};

/** A shortcut for people: `Ctrl+Shift+7`, or `⌘⇧7` on a Mac. */
export function formatShortcut(name: string, mac = isMacPlatform()): string {
    const parts = name.split('-');
    const key = parts.pop()!;
    const label = key.length === 1 ? key.toUpperCase() : key;
    if (mac) {
        const symbols: Record<string, string> = { Mod: '⌘', Ctrl: '⌃', Alt: '⌥', Shift: '⇧', Meta: '⌘' };
        return parts.map((p) => symbols[p] ?? p).join('') + label;
    }
    const names: Record<string, string> = { Mod: 'Ctrl', Ctrl: 'Ctrl', Alt: 'Alt', Shift: 'Shift', Meta: 'Win' };
    return [...parts.map((p) => names[p] ?? p), label].join('+');
}

/** The same shortcut for `aria-keyshortcuts`: `Control+Shift+7` (`Meta+…` on a Mac). */
export function ariaShortcut(name: string, mac = isMacPlatform()): string {
    const parts = name.split('-');
    const key = parts.pop()!;
    const names: Record<string, string> = { Mod: mac ? 'Meta' : 'Control', Ctrl: 'Control', Alt: 'Alt', Shift: 'Shift', Meta: 'Meta' };
    return [...parts.map((p) => names[p] ?? p), key.length === 1 ? key.toUpperCase() : key].join('+');
}

/** The first shortcut bound to a command (with these arguments), if any. */
export function shortcutFor(command: string, args: readonly unknown[] = [], keymap: Readonly<Record<string, EditorKeyBinding>> = editorKeymap): string | undefined {
    return Object.keys(keymap).find((k) => {
        const [name, ...rest] = keymap[k]!;
        return name === command && rest.length === args.length && rest.every((a, i) => a === args[i]);
    });
}
