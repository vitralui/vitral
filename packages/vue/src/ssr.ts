import { escapeStyleText, wrapStyleLayer } from '@vitral/core';
import { colorSchemeScript, type ColorSchemeScriptOptions } from '@vitral/themes';
import { inject, type App } from 'vue';
import { VitralKey, type VitralContext } from './config/config';

// Server-side rendering. In the browser a component puts its stylesheet in the
// head the first time it renders. On a server there is no head to put it in, so
// the styles are collected during the render and the app writes them into the
// document it sends. Without this the page arrives unstyled until the bundle
// has loaded.

/** One stylesheet, split up for a head manager that writes the elements itself. */
export interface CollectedStyleElement {
    /** Stable across renders (`vitral:theme`, `vitral:button`), so each is written once. */
    key: string;
    /** The marker, plus the nonce if there is one. */
    attrs: Record<string, string>;
    /** The stylesheet, already in its cascade layer if one was configured. */
    css: string;
}

export interface CollectedStyles {
    /** The theme's custom properties, then the stylesheet of every component the render used. */
    css: string;
    /** The same as `<style>` elements, theme first so application CSS still wins. */
    tags: string;
    /** One entry per stylesheet, for a head manager that writes its own elements (Unhead, in Nuxt). */
    elements: CollectedStyleElement[];
    /** True when nothing was collected: nothing rendered, or the app is unstyled. */
    empty: boolean;
}

function contextOf(source: App | VitralContext): VitralContext | null {
    if ('styles' in source) return source;
    const app = source as App;
    return (app.config?.globalProperties?.$vitral as VitralContext | undefined) ?? app.runWithContext?.(() => inject(VitralKey, null)) ?? null;
}

/**
 * The CSS one server render needs, for the head of the page it answers with.
 * Call it *after* `renderToString`, once every component has asked for its
 * stylesheet:
 *
 * ```ts
 * const html = await renderToString(app);
 * const { tags } = collectStyles(app);
 * return page.replace('<!--vitral-styles-->', tags);
 * ```
 *
 * The elements carry the same `data-vitral-theme` and `data-vitral-style`
 * markers the browser writes, so hydration finds them and does not inject a
 * second copy. Under a strict Content-Security-Policy they also carry the
 * configured nonce.
 */
export function collectStyles(source: App | VitralContext): CollectedStyles {
    const context = contextOf(source);
    if (!context) return { css: '', tags: '', elements: [], empty: true };

    const { nonce } = context.config.csp;
    const layer = context.config.cssLayer;
    const theme = context.theme?.css() ?? '';

    const elements: CollectedStyleElement[] = [];
    // Theme first: its custom properties are what every stylesheet reads.
    if (theme) elements.push({ key: 'vitral:theme', attrs: { 'data-vitral-theme': '' }, css: theme });
    for (const style of context.styles.entries()) {
        elements.push({ key: `vitral:${style.name}`, attrs: { 'data-vitral-style': style.name }, css: wrapStyleLayer(style.css, layer) });
    }
    if (nonce) for (const element of elements) element.attrs.nonce = nonce;

    const css = elements.map((element) => element.css).join('\n');
    const tags = elements.map((element) => `<style${attributes(element.attrs)}>${escapeStyleText(element.css)}</style>`).join('\n');
    return { css, tags, elements, empty: elements.length === 0 };
}

function attributes(attrs: Record<string, string>): string {
    return Object.entries(attrs)
        .map(([name, value]) => (value === '' ? ` ${name}` : ` ${name}="${value}"`))
        .join('');
}

/**
 * A `<script>` for the head, above the content, for an app that remembers the
 * reader's scheme. It marks `<html>` before the first paint, so a dark page
 * does not flash white while the bundle loads. A server that already knows the
 * scheme (from a cookie, say) can render `colorSchemeAttrs(dark)` on `<html>`
 * instead and skip the script.
 */
export function colorSchemeTag(source: App | VitralContext, options: ColorSchemeScriptOptions = {}): string {
    const context = contextOf(source);
    const theme = context?.theme;
    const body = colorSchemeScript({ darkModeSelector: theme?.options.darkModeSelector, storageKey: theme?.storageKey, ...options });
    if (!body) return '';
    const nonce = context?.config.csp.nonce ? ` nonce="${context.config.csp.nonce}"` : '';
    return `<script${nonce}>${body}</script>`;
}
