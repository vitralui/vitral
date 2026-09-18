import { defaultThemeOptions } from './types';

// Three places decide which scheme is showing and they have to agree: the
// server that renders the markup, a script that runs before the first paint so
// a remembered dark scheme is not a white flash, and the theme manager once the
// app is running. All three read the selector through this file.

/** The requested variant: light, dark, or whatever the system says. */
export type ColorScheme = 'light' | 'dark' | 'system';

/** A dark mode selector taken apart: a class, an attribute, or neither. */
export type DarkModeTarget = { kind: 'class'; name: string } | { kind: 'attribute'; name: string; value: string } | null;

const ATTRIBUTE = /^\[([^=\]]+)(?:=["']?([^"'\]]*)["']?)?\]$/;

/**
 * What `darkModeSelector` asks the document for. `'system'` and `false` return
 * null, since the media query does the work and nothing is set on the element.
 */
export function parseDarkModeSelector(selector: string | false | undefined = defaultThemeOptions.darkModeSelector): DarkModeTarget {
    if (!selector || selector === 'system') return null;
    if (selector.startsWith('.')) return { kind: 'class', name: selector.slice(1) };
    const attribute = ATTRIBUTE.exec(selector);
    return attribute ? { kind: 'attribute', name: attribute[1]!, value: attribute[2] ?? '' } : null;
}

/** Puts the dark scheme on an element, or takes it off. */
export function applyDarkModeTo(root: Element, dark: boolean, selector?: string | false): void {
    const target = parseDarkModeSelector(selector);
    if (!target) return;
    if (target.kind === 'class') root.classList.toggle(target.name, dark);
    else if (dark) root.setAttribute(target.name, target.value);
    else root.removeAttribute(target.name);
}

/**
 * The attributes `<html>` needs for this scheme, for a server that already
 * knows which one to send (from a cookie, a session, the user's account).
 * Spread them onto the element: `<html {...colorSchemeAttrs(dark)}>`.
 */
export function colorSchemeAttrs(dark: boolean, selector?: string | false): Record<string, string> {
    const target = parseDarkModeSelector(selector);
    if (!target || !dark) return {};
    return target.kind === 'class' ? { class: target.name } : { [target.name]: target.value };
}

export interface ColorSchemeScriptOptions {
    /** The localStorage key the theme manager was given, if it remembers the choice at all. */
    storageKey?: string | false;
    darkModeSelector?: string | false;
    /** The scheme to fall back on when nothing is stored. Defaults to `'system'`. */
    colorScheme?: ColorScheme;
}

/**
 * A script for the `<head>`, above the content. It reads the remembered scheme
 * and the system preference and marks `<html>` before the first paint, so a
 * dark page does not flash white while the app loads.
 *
 * Only the body of the script: the caller wraps it in a `<script>` and, under a
 * strict Content-Security-Policy, puts the nonce on that element.
 */
export function colorSchemeScript(options: ColorSchemeScriptOptions = {}): string {
    const target = parseDarkModeSelector(options.darkModeSelector);
    if (!target) return '';
    const fallback = JSON.stringify(options.colorScheme ?? 'system');
    const stored = options.storageKey ? `localStorage.getItem(${JSON.stringify(options.storageKey)})||` : '';
    const apply =
        target.kind === 'class'
            ? `r.classList.toggle(${JSON.stringify(target.name)},d)`
            : `d?r.setAttribute(${JSON.stringify(target.name)},${JSON.stringify(target.value)}):r.removeAttribute(${JSON.stringify(target.name)})`;
    return (
        `(function(){try{var s=${stored}${fallback};` +
        `var d=s==="dark"||(s!=="light"&&matchMedia("(prefers-color-scheme: dark)").matches);` +
        `var r=document.documentElement;${apply}}catch(e){}})()`
    );
}
