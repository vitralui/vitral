import { cn, type ClassValue } from './classNames';
import { isClient } from './dom';

// A component's look as plain data (its stylesheet and the classes each part
// carries) and the one function that puts a stylesheet in the document. They
// live here, with no framework in them, so every renderer shares them: the Vue
// components (through `@vitral/styles`), the framework-free chart, and a React
// or Angular port later.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassEntry = string | ((state: any) => ClassValue);

/**
 * A component's stylesheet and the classes each of its parts carries. Both are
 * plain data with no framework in them: the Vue components read this today, and
 * a React or Angular port reads the same object, so the markup contract (which
 * class goes on which element in which state) is written once.
 */
export interface ComponentStyle<Parts extends string = string> {
    /** Also the token namespace: `--vt-<name>-*`. */
    name: string;
    css: string;
    classes: Record<Parts, ClassEntry>;
}

export function defineStyle<Parts extends string>(style: ComponentStyle<Parts>): ComponentStyle<Parts> {
    return style;
}

/** The class string for one part in one state; empty when the part has none. */
export function classOf(style: ComponentStyle, part: string, state?: unknown): string {
    const entry = (style.classes as Record<string, ClassEntry | undefined>)[part];
    if (entry === undefined) return '';
    return typeof entry === 'function' ? cn(entry(state ?? {})) : entry;
}

export interface LoadStyleOptions {
    nonce?: string;
    cssLayer?: string | false;
    /**
     * Where to record the stylesheet when there is no document, i.e. on a
     * server. The renderer puts the collected CSS in the head it sends.
     */
    registry?: StyleRegistry;
}

/** One component's stylesheet, as recorded. */
export interface CollectedStyle {
    name: string;
    css: string;
}

/**
 * The stylesheets one render asked for, in order. This stands in for
 * `document.head` on a server: `loadStyle` writes here instead of injecting,
 * and the framework adapter turns `tags()` into markup.
 *
 * Use one registry per render, never a module-level one, or two requests
 * served at the same time will see each other's styles.
 */
export interface StyleRegistry {
    /** Records a stylesheet. Returns false if that name was already recorded. */
    add(name: string, css: string): boolean;
    has(name: string): boolean;
    entries(): CollectedStyle[];
    /** Every stylesheet as one string, wrapped in the CSS layer if there is one. */
    css(): string;
    /** Every stylesheet as `<style data-vitral-style="…">` elements. */
    tags(): string;
    clear(): void;
}

/** A stylesheet in its cascade layer, if one was configured. */
export function wrapStyleLayer(css: string, cssLayer: string | false | undefined): string {
    return cssLayer ? `@layer ${cssLayer} {\n${css}\n}` : css;
}

/**
 * Escapes anything that would close the `<style>` element the CSS is written
 * into. `</style` inside a stylesheet is a CSS parse error anyway, so breaking
 * it up costs nothing.
 */
export function escapeStyleText(css: string): string {
    return css.replace(/<\/(style)/gi, '<\\/$1');
}

export function createStyleRegistry(options: Omit<LoadStyleOptions, 'registry'> = {}): StyleRegistry {
    const sheets = new Map<string, string>();
    return {
        add(name, css) {
            if (sheets.has(name)) return false;
            sheets.set(name, css);
            return true;
        },
        has: (name) => sheets.has(name),
        entries: () => Array.from(sheets, ([name, css]) => ({ name, css })),
        css: () =>
            Array.from(sheets.values())
                .map((css) => wrapStyleLayer(css, options.cssLayer))
                .join('\n'),
        tags: () =>
            Array.from(sheets, ([name, css]) => {
                const nonce = options.nonce ? ` nonce="${options.nonce}"` : '';
                return `<style data-vitral-style="${name}"${nonce}>${escapeStyleText(wrapStyleLayer(css, options.cssLayer))}</style>`;
            }).join('\n'),
        clear: () => sheets.clear()
    };
}

/**
 * Puts a component's stylesheet in the document once, the first time any
 * instance of it renders, so nothing has to be imported by hand and a page
 * only carries the CSS of the components it uses.
 */
export function loadStyle(name: string, css: string, options: LoadStyleOptions = {}): void {
    if (!css) return;
    if (!isClient) {
        // No document, so collect it instead of injecting it.
        options.registry?.add(name, css);
        return;
    }
    if (document.head.querySelector(`style[data-vitral-style="${name}"]`)) return;
    const el = document.createElement('style');
    el.setAttribute('data-vitral-style', name);
    if (options.nonce) el.nonce = options.nonce;
    el.textContent = wrapStyleLayer(css, options.cssLayer);
    document.head.appendChild(el);
}
