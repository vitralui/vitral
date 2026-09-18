/**
 * Star sizing — `'Auto,*,2*,120'`, the track syntax desktop toolkits use — as
 * CSS grid tracks, so a Grid is written the way a layout is usually thought of
 * and every adapter turns it into the same `grid-template-*`.
 */

/** A definition list: the text form, or one entry per track. */
export type GridDefinitions = string | readonly (string | number)[];

/**
 * One track length as a CSS track size:
 * - `Auto` → `auto`
 * - `*` → `1fr`, `2*` → `2fr`, `0.5*` → `0.5fr`
 * - a number (`120`, `'120'`) → pixels
 * - anything else (`20%`, `10rem`, `minmax(8rem, 1fr)`, `min-content`) passes through as CSS.
 */
export function parseGridLength(value: string | number): string {
    if (typeof value === 'number') return Number.isFinite(value) ? `${value}px` : 'auto';
    const text = value.trim();
    if (/^auto$/i.test(text)) return 'auto';
    if (text === '*') return '1fr';
    const star = /^(\d*\.?\d+)\s*\*$/.exec(text);
    if (star) return `${Number(star[1])}fr`;
    if (/^\d*\.?\d+$/.test(text)) return `${Number(text)}px`;
    return text;
}

/**
 * Splits the text form into its entries. Entries are separated by commas or
 * whitespace — both are accepted — and separators inside
 * parentheses belong to a CSS function (`minmax(8rem, 1fr)`) and are kept.
 */
export function splitGridDefinitions(text: string): string[] {
    const out: string[] = [];
    let depth = 0;
    let current = '';
    const flush = () => {
        const entry = current.trim();
        if (entry) out.push(entry);
        current = '';
    };
    for (const char of text) {
        if (char === '(') depth++;
        else if (char === ')') depth = Math.max(0, depth - 1);
        if (depth === 0 && (char === ',' || /\s/.test(char))) flush();
        else current += char;
    }
    flush();
    return out;
}

/** Every track of a definition list as a CSS track size. */
export function parseGridDefinitions(definitions: GridDefinitions | null | undefined): string[] {
    if (definitions === null || definitions === undefined) return [];
    const entries = typeof definitions === 'string' ? splitGridDefinitions(definitions) : definitions.filter((d) => String(d).trim() !== '');
    return entries.map(parseGridLength);
}

/** The value for `grid-template-rows` / `grid-template-columns`; `undefined` when there are no definitions. */
export function gridTemplate(definitions: GridDefinitions | null | undefined): string | undefined {
    const tracks = parseGridDefinitions(definitions);
    return tracks.length ? tracks.join(' ') : undefined;
}

/**
 * A 0-based position and span (`row="1" row-span="2"`) as a CSS placement on
 * 1-based lines: `2 / span 2`. Negative or fractional input is clamped.
 */
export function gridPlacement(index: number | string | null | undefined = 0, span: number | string | null | undefined = 1): string {
    const start = Math.max(0, Math.floor(Number(index) || 0));
    const length = Math.max(1, Math.floor(Number(span) || 1));
    return `${start + 1} / span ${length}`;
}
