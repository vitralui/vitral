import { hexToRgb, rgbToHsb } from '../color/color';

/**
 * A text colour and highlight the editor offers. Content stores the `name`;
 * the HTML carries the theme's custom property with `text`/`highlight` as the
 * fallback, so the colour follows the theme inside an app and still shows
 * wherever the HTML is rendered without one.
 */
export interface EditorColor {
    name: string;
    /** Fallback text colour. */
    text: string;
    /** Fallback highlight (background) colour. */
    highlight: string;
    /** Hue in degrees, for mapping pasted colours onto the palette; none for a grey. */
    hue?: number;
}

export const editorPalette: readonly EditorColor[] = [
    { name: 'gray', text: '#52525b', highlight: '#e4e4e7' },
    { name: 'red', text: '#dc2626', highlight: '#fecaca', hue: 0 },
    { name: 'orange', text: '#ea580c', highlight: '#fed7aa', hue: 25 },
    { name: 'yellow', text: '#ca8a04', highlight: '#fef08a', hue: 50 },
    { name: 'green', text: '#16a34a', highlight: '#bbf7d0', hue: 135 },
    { name: 'teal', text: '#0d9488', highlight: '#99f6e4', hue: 175 },
    { name: 'blue', text: '#2563eb', highlight: '#bfdbfe', hue: 220 },
    { name: 'purple', text: '#9333ea', highlight: '#e9d5ff', hue: 275 },
    { name: 'pink', text: '#db2777', highlight: '#fbcfe8', hue: 330 }
];

/** The custom property a palette colour is read from: `--vt-editor-palette-red-color` / `-highlight`. */
export function editorColorVar(name: string, kind: 'color' | 'highlight'): string {
    return `--vt-editor-palette-${name}-${kind}`;
}

export function editorColorStyle(name: string, kind: 'color' | 'highlight', palette: readonly EditorColor[] = editorPalette): string | null {
    const entry = palette.find((c) => c.name === name);
    if (!entry) return null;
    return `${kind === 'color' ? 'color' : 'background-color'}: var(${editorColorVar(name, kind)}, ${kind === 'color' ? entry.text : entry.highlight})`;
}

const NAMED: Record<string, string> = {
    black: '#000000',
    white: '#ffffff',
    red: '#ff0000',
    green: '#008000',
    lime: '#00ff00',
    blue: '#0000ff',
    yellow: '#ffff00',
    orange: '#ffa500',
    purple: '#800080',
    fuchsia: '#ff00ff',
    magenta: '#ff00ff',
    pink: '#ffc0cb',
    teal: '#008080',
    aqua: '#00ffff',
    cyan: '#00ffff',
    navy: '#000080',
    maroon: '#800000',
    olive: '#808000',
    gray: '#808080',
    grey: '#808080',
    silver: '#c0c0c0',
    darkred: '#8b0000',
    darkblue: '#00008b',
    darkgreen: '#006400',
    lightgray: '#d3d3d3',
    gold: '#ffd700'
};

/** `#abc`, `#aabbcc`, `rgb(…)`/`rgba(…)` or a common colour name, as RGB; null otherwise (and for anything mostly transparent). */
function readColor(value: string): { r: number; g: number; b: number } | null {
    const v = value.trim().toLowerCase();
    if (NAMED[v]) return hexToRgb(NAMED[v]);
    if (v.startsWith('#')) return hexToRgb(v);
    const m = v.match(/^rgba?\(\s*(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)[\s,]+(\d+(?:\.\d+)?)(?:[\s,/]+(\d*\.?\d+)(%?))?\s*\)$/);
    if (!m) return null;
    if (m[4] !== undefined) {
        const alpha = Number(m[4]) / (m[5] ? 100 : 1);
        if (alpha < 0.5) return null;
    }
    return { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
}

/**
 * The palette colour a pasted CSS colour is closest to, or null. Greys, black
 * and white are dropped, since they are what word processors paste on every run
 * of text, and so is anything too pale or too dark to have a hue worth keeping.
 */
export function matchPaletteColor(value: string, kind: 'color' | 'highlight', palette: readonly EditorColor[] = editorPalette): string | null {
    const byName = palette.find((c) => c.name === value.trim().toLowerCase());
    if (byName && !NAMED[byName.name]) return byName.name;
    const rgb = readColor(value);
    if (!rgb) return null;
    const hex = `#${[rgb.r, rgb.g, rgb.b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
    const exact = palette.find((c) => (kind === 'color' ? c.text : c.highlight).toLowerCase() === hex);
    if (exact) return exact.name;
    const { h, s, b } = rgbToHsb(rgb);
    if (s < 25 || b < 20 || (kind === 'color' && b > 97 && s < 30)) return null;
    let best: EditorColor | null = null;
    let distance = Infinity;
    for (const c of palette) {
        if (c.hue === undefined) continue;
        const d = Math.min(Math.abs(c.hue - h), 360 - Math.abs(c.hue - h));
        if (d < distance) {
            distance = d;
            best = c;
        }
    }
    return best && distance <= 30 ? best.name : null;
}

const LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);
const IMAGE_SCHEMES = new Set(['http', 'https']);

/**
 * The URL if it is safe to put in content, else null. Relative URLs pass;
 * absolute ones only with a scheme on the allow-list. `javascript:`,
 * `vbscript:`, `data:` (except raster images) and friends never do, however
 * they are disguised with whitespace, control characters or case.
 */
export function sanitizeUrl(url: unknown, kind: 'link' | 'image' = 'link'): string | null {
    if (typeof url !== 'string') return null;
    const trimmed = url.trim();
    if (!trimmed) return null;
    // Browsers ignore these inside a scheme, so an attacker can hide one with them.
    // eslint-disable-next-line no-control-regex
    const compact = trimmed.replace(/[\u0000-\u0020\u007f-\u009f\u00ad\u200b-\u200f\u2028\u2029\ufeff]/g, '');
    const scheme = compact.match(/^([a-z][a-z0-9+.-]*):/i)?.[1]?.toLowerCase();
    if (!scheme) {
        // A colon before any slash, question mark or hash is a scheme the pattern missed (`&#58;` decoded, odd characters).
        const colon = compact.indexOf(':');
        const stop = compact.search(/[/?#]/);
        if (colon >= 0 && (stop < 0 || colon < stop)) return null;
        return trimmed;
    }
    if (kind === 'image') {
        if (scheme === 'data') return /^data:image\/(png|jpe?g|gif|webp|avif);base64,[a-z0-9+/=\s]+$/i.test(compact) ? compact : null;
        return IMAGE_SCHEMES.has(scheme) ? trimmed : null;
    }
    return LINK_SCHEMES.has(scheme) ? trimmed : null;
}

/** A code block's language: letters, digits, `+`, `#`, `-`, `_` and `.`, at most 32 of them. */
export function sanitizeLanguage(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const v = value.trim().toLowerCase();
    return /^[a-z0-9+#._-]{1,32}$/.test(v) ? v : null;
}
