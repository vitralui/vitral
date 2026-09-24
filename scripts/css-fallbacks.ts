import { readFileSync } from 'node:fs';
import type { Plugin } from 'vite';

/**
 * Three fallbacks the stylesheets cannot write for themselves, added at build
 * time so the source keeps one copy of every rule.
 *
 * A phone that is three years old is still a phone people read on: an iPhone 7
 * stops at iOS 15, whose Safari has neither container queries (16.0) nor
 * `color-mix()` (16.2). Without the first, a template laid out for its frame
 * falls back to its desktop shape and runs off the screen; without the second,
 * every declaration that mixes a colour is invalid, and a translucent bar
 * becomes a bar with no background at all.
 *
 * - each `@container <name> (<condition>)` block is repeated as a media query
 *   of the same condition, inside `@supports not (container-type: inline-size)`
 *   so browsers that have containers never see it. On a phone the container is
 *   the window, which is what makes the substitution honest;
 * - each declaration whose value contains `color-mix(in srgb, X …)` gets a
 *   plain `X` in front of it. A browser that knows `color-mix` overwrites it;
 *   one that does not keeps a solid colour instead of dropping the rule;
 * - a handful of properties get their `-webkit-` twin. Safari wanted the prefix
 *   for `user-select` until 16.4, and a component's stylesheet is shipped as
 *   the text it was written as — the bundler never sees it, so nothing else
 *   would add them. Without `-webkit-user-select`, dragging a slider on a phone
 *   selects the text around it instead of moving the thumb.
 */
export function cssFallbacks(): Plugin {
    return {
        name: 'vitral:css-fallbacks',
        // Before Vite's own CSS handling, and by reading the file rather than
        // transforming what comes back: a stylesheet imported as `?raw` — which
        // is how every component ships its own — has already become a JavaScript
        // module by the time a transform would see it.
        enforce: 'pre',
        load(id) {
            const [file, query] = id.split('?');
            if (!file?.endsWith('.css') || file.includes('node_modules') || file.startsWith('\0')) return null;
            let css: string;
            try {
                css = readFileSync(file, 'utf8');
            } catch {
                return null;
            }
            // A file loaded here rather than by Vite is not watched by it when it
            // lies outside the app — every component's stylesheet does — so an
            // edit to one was never picked up until the server restarted.
            this.addWatchFile(file);
            if (!css.includes('@container') && !css.includes('color-mix(') && !PREFIXED.some((name) => css.includes(`${name}:`))) return null;
            const out = webkitPrefixes(colorMixFallbacks(containerFallbacks(css)));
            return query?.split('&').includes('raw') ? `export default ${JSON.stringify(out)};` : out;
        }
    };
}

/** The end of the block whose `{` is at `open`, counting braces outside quotes. */
function blockEnd(css: string, open: number): number {
    let depth = 0;
    let quote = '';
    for (let i = open; i < css.length; i++) {
        const c = css[i]!;
        if (quote) {
            if (c === '\\') i++;
            else if (c === quote) quote = '';
            continue;
        }
        if (c === '"' || c === "'") quote = c;
        else if (c === '{') depth++;
        else if (c === '}' && --depth === 0) return i;
    }
    return css.length;
}

export function containerFallbacks(css: string): string {
    const pattern = /@container\s+[\w-]*\s*\(([^()]*(?:\([^()]*\)[^()]*)*)\)\s*\{/g;
    const copies: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(css))) {
        const open = css.indexOf('{', match.index);
        const end = blockEnd(css, open);
        const body = css.slice(open + 1, end);
        copies.push(`@supports not (container-type: inline-size) {\n@media (${match[1]!.trim()}) {${body}}\n}`);
        pattern.lastIndex = end;
    }
    return copies.length ? `${css}\n\n/* Container queries, as media queries, for browsers without them. */\n${copies.join('\n')}\n` : css;
}

export function colorMixFallbacks(css: string): string {
    // A declaration whose value holds one `color-mix(in srgb, <colour> …)` is
    // repeated with that first colour in the mix's place: a border, a shadow or
    // a background then keeps its shape, at full strength instead of a shade of
    // it. A value with several mixes is left alone — a gradient of two washes
    // would come back as two solid colours, which is worse than no gradient.
    return css.replace(/(^|[;{]\s*)([-\w]+)\s*:\s*([^;{}]+)/g, (whole, lead: string, property: string, value: string) => {
        const mixes = [...value.matchAll(/color-mix\(/g)];
        if (mixes.length !== 1) return whole;
        const open = mixes[0]!.index!;
        const end = closing(value, open + 'color-mix('.length - 1);
        if (end < 0) return whole;
        const inside = value.slice(open + 'color-mix('.length, end);
        const first = firstColour(inside);
        if (!first) return whole;
        const plain = value.slice(0, open) + first + value.slice(end + 1);
        return `${lead}${property}: ${plain.trim()}; ${property}: ${value}`;
    });
}

/** The index of the `)` closing the `(` at `open`. */
function closing(value: string, open: number): number {
    let depth = 0;
    for (let i = open; i < value.length; i++) {
        if (value[i] === '(') depth++;
        else if (value[i] === ')' && --depth === 0) return i;
    }
    return -1;
}

/** The colour a mix is a shade of: what follows the colour space, without its percentage. */
function firstColour(inside: string): string | null {
    const parts: string[] = [];
    let depth = 0;
    let from = 0;
    for (let i = 0; i < inside.length; i++) {
        if (inside[i] === '(') depth++;
        else if (inside[i] === ')') depth--;
        else if (inside[i] === ',' && depth === 0) {
            parts.push(inside.slice(from, i));
            from = i + 1;
        }
    }
    parts.push(inside.slice(from));
    // The percentage is the share of the mix, not part of the colour — and a
    // colour of its own can hold one, as `rgb(1 2 3 / 50%)` does.
    const colour = parts[1]
        ?.trim()
        .replace(/\s+[\d.]+%$/, '')
        .trim();
    return colour && !/^[\d.]+%$/.test(colour) ? colour : null;
}

/**
 * Properties Safari asked for by another name for longer than the phones
 * people still read on have been supported: `user-select` until 16.4,
 * `backdrop-filter` until 18, `mask` until 15.4, `appearance` until 15.4.
 */
export const PREFIXED = ['user-select', 'backdrop-filter', 'appearance', 'mask-image', 'mask-size', 'mask-repeat', 'mask-position', 'hyphens', 'text-size-adjust'];

export function webkitPrefixes(css: string): string {
    return css.replace(/(^|[;{]\s*)([-\w]+)\s*:\s*([^;{}]+)/g, (whole: string, lead: string, property: string, value: string, offset: number) => {
        if (!PREFIXED.includes(property)) return whole;
        // Already written out by hand, in this same rule.
        const ruleStart = Math.max(css.lastIndexOf('{', offset), 0);
        if (css.slice(ruleStart, offset).includes(`-webkit-${property}:`)) return whole;
        return `${lead}-webkit-${property}: ${value.trim()}; ${property}: ${value}`;
    });
}
