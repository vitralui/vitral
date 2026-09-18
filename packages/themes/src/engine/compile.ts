import { isObject, toKebab } from '@vitral/core';
import { defaultThemeOptions, type Preset, type ThemeOptions, type TokenTree } from './types';

type Entry = [name: string, value: string];

/**
 * The custom property a token path compiles to. A `root` segment is dropped, so
 * `button.root.borderRadius` and `button.borderRadius` both name
 * `--vt-button-border-radius`.
 */
export function varName(path: string | readonly string[], prefix = defaultThemeOptions.prefix): string {
    const parts = typeof path === 'string' ? path.split('.') : path;
    return `--${prefix}-${parts
        .filter((p) => p !== 'root')
        .map((p) => toKebab(p))
        .join('-')}`;
}

/** Turns every `{group.token}` reference in a value into a `var()`. */
export function resolveRefs(value: string, prefix = defaultThemeOptions.prefix): string {
    return value.replace(/\{([^{}]+)\}/g, (_, ref: string) => `var(${varName(ref.trim(), prefix)})`);
}

/** A token as a `var()` — for inline styles and for code that wants a theme value without hard-coding it. */
export function dt(path: string, prefix = defaultThemeOptions.prefix): string {
    return `var(${varName(path, prefix)})`;
}

/** Flattens a token tree into custom properties; used for per-instance overrides as well as whole themes. */
export function flattenTokens(tree: TokenTree | undefined, path: string[] = [], prefix = defaultThemeOptions.prefix): Record<string, string> {
    const out: Entry[] = [];
    walk(tree, path, prefix, out, out, out);
    return Object.fromEntries(out);
}

function walk(tree: TokenTree | undefined, path: string[], prefix: string, base: Entry[], light: Entry[], dark: Entry[]): void {
    if (!tree) return;
    for (const key of Object.keys(tree)) {
        const value = tree[key];
        if (value === undefined) continue;
        if (key === 'colorScheme' && isObject(value)) {
            walk(value.light as TokenTree | undefined, path, prefix, light, light, light);
            walk(value.dark as TokenTree | undefined, path, prefix, dark, dark, dark);
        } else if (isObject(value)) {
            walk(value as TokenTree, [...path, key], prefix, base, light, dark);
        } else {
            base.push([varName([...path, key], prefix), resolveRefs(String(value), prefix)]);
        }
    }
}

export interface TokenCollision {
    variable: string;
    /** The layers that declare it: `primitive`, `semantic`, or `components.<name>`. */
    layers: string[];
}

/**
 * Custom properties declared by more than one layer. A component's tokens are
 * named after it, so a component whose name is also a semantic group — the
 * `chart` component beside the semantic `chart.1…8` palette — must not use a
 * key the group uses: `components.chart[1]` would compile to `--vt-chart-1`
 * and silently replace a palette colour. Component token trees therefore keep
 * to named (non-numeric) keys, and this check proves it for a preset.
 */
export function tokenCollisions(preset: Preset, options: ThemeOptions = {}): TokenCollision[] {
    const { prefix } = { ...defaultThemeOptions, ...options };
    const owners = new Map<string, Set<string>>();
    const add = (layer: string, tree: TokenTree | undefined, path: string[]) => {
        const entries: Entry[] = [];
        walk(tree, path, prefix, entries, entries, entries);
        for (const [name] of entries) {
            if (!owners.has(name)) owners.set(name, new Set());
            owners.get(name)!.add(layer);
        }
    };
    add('primitive', preset.primitive, []);
    add('semantic', preset.semantic, []);
    for (const [name, tokens] of Object.entries(preset.components ?? {})) add(`components.${name}`, tokens, [name]);
    return [...owners].filter(([, layers]) => layers.size > 1).map(([variable, layers]) => ({ variable, layers: [...layers] }));
}

export interface CompiledTheme {
    css: string;
    /** Every custom property of the light scheme (and the scheme-independent ones), with references left as `var()`. */
    light: Record<string, string>;
    /** The properties the dark scheme overrides. */
    dark: Record<string, string>;
}

function darkBlock(selector: string, body: string): string {
    if (selector === 'system') return `@media (prefers-color-scheme: dark) {\n:root {${body}\n  color-scheme: dark;\n}\n}\n`;
    const scoped = selector.startsWith('.') || selector.startsWith('[') ? `:root${selector}` : selector;
    return `${scoped} {${body}\n  color-scheme: dark;\n}\n`;
}

/**
 * Compiles a preset to CSS. Everything is declared on `:root`, and the dark
 * scheme on `:root` plus the dark selector — the same element — because a
 * custom property that refers to another resolves where it is declared: a dark
 * block on some inner element would leave every derived token still light.
 */
export function compileTheme(preset: Preset, options: ThemeOptions = {}): CompiledTheme {
    const { prefix, darkModeSelector, cssLayer } = { ...defaultThemeOptions, ...options };
    const base: Entry[] = [];
    const light: Entry[] = [];
    const dark: Entry[] = [];
    walk(preset.primitive, [], prefix, base, light, dark);
    walk(preset.semantic, [], prefix, base, light, dark);
    for (const [name, tokens] of Object.entries(preset.components ?? {})) walk(tokens, [name], prefix, base, light, dark);

    const body = (entries: Entry[]) => entries.map(([n, v]) => `\n  ${n}: ${v};`).join('');
    let css = `:root {${body(base)}${body(light)}\n  color-scheme: light;\n}\n`;
    if (darkModeSelector && dark.length > 0) css += darkBlock(darkModeSelector, body(dark));
    if (cssLayer) css = `@layer ${cssLayer} {\n${css}}\n`;
    return { css, light: Object.fromEntries([...base, ...light]), dark: Object.fromEntries(dark) };
}
