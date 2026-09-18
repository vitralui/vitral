import { clamp } from '../number/number';

/** Red, green and blue, each 0–255, and an opacity 0–1 when the picker is set to carry one. */
export interface Rgb {
    r: number;
    g: number;
    b: number;
    a?: number;
}

/**
 * Hue 0–360, saturation and brightness 0–100: the model a colour picker's area
 * and strip are drawn in. `a` rides along where a value carries an opacity; the
 * area and the strip never read it, because a hue has no opacity.
 */
export interface Hsb {
    h: number;
    s: number;
    b: number;
    a?: number;
}

/** How a colour picker hands its value over: `'ff0000'`, `{ r, g, b }` or `{ h, s, b }`. */
export type ColorFormat = 'hex' | 'rgb' | 'hsb';

export type ColorValue = string | Rgb | Hsb;

const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

export function hsbToRgb(hsb: Hsb): Rgb {
    const h = (((hsb.h % 360) + 360) % 360) / 60;
    const s = clamp(hsb.s, 0, 100) / 100;
    const v = clamp(hsb.b, 0, 100) / 100;
    // The standard hexcone: `k` walks each channel round the six sectors.
    const channel = (n: number) => {
        const k = (n + h) % 6;
        return Math.round((v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255);
    };
    return { r: channel(5), g: channel(3), b: channel(1) };
}

/**
 * Rounded to whole degrees and percents unless `round` is false. An editor
 * keeps the exact values, so a colour read in and written back is unchanged.
 * A grey has no hue; it comes back as 0.
 */
export function rgbToHsb(rgb: Rgb, round = true): Hsb {
    const r = clamp(rgb.r, 0, 255) / 255;
    const g = clamp(rgb.g, 0, 255) / 255;
    const b = clamp(rgb.b, 0, 255) / 255;
    const max = Math.max(r, g, b);
    const delta = max - Math.min(r, g, b);
    let h = 0;
    if (delta > 0) {
        if (max === r) h = ((g - b) / delta) % 6;
        else if (max === g) h = (b - r) / delta + 2;
        else h = (r - g) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
    }
    const r0 = (n: number) => (round ? Math.round(n) : n);
    return { h: r0(h) % 360, s: r0(max === 0 ? 0 : (delta / max) * 100), b: r0(max * 100) };
}

/** Six lower-case hex digits, without `#`. */
export function rgbToHex(rgb: Rgb): string {
    return [rgb.r, rgb.g, rgb.b].map((c) => Math.round(clamp(c, 0, 255)).toString(16).padStart(2, '0')).join('');
}

/** Reads `#rgb`, `rgb`, `#rrggbb` or `rrggbb`, and the four- and eight-digit forms that carry an alpha; null for anything else. */
export function hexToRgb(hex: string): Rgb | null {
    let digits = hex.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3,4}$/i.test(digits)) digits = [...digits].map((c) => c + c).join('');
    if (!/^(?:[0-9a-f]{6}|[0-9a-f]{8})$/i.test(digits)) return null;
    const n = parseInt(digits.slice(0, 6), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/**
 * The alpha a value carries, 0 to 1, or 1 when it carries none. Alpha travels
 * beside the colour rather than inside `Hsb`, because a hue has no opacity —
 * it is a property of the paint, not of the colour.
 */
export function alphaOf(value: unknown): number {
    if (typeof value === 'string') {
        const digits = value.trim().replace(/^#/, '');
        if (/^[0-9a-f]{4}$/i.test(digits)) return parseInt(digits[3]! + digits[3]!, 16) / 255;
        if (/^[0-9a-f]{8}$/i.test(digits)) return parseInt(digits.slice(6, 8), 16) / 255;
        const fn = /^rgba?\(([^)]+)\)$/i.exec(value.trim());
        if (fn) {
            const parts = fn[1]!.split(/[,/]/).map((p) => p.trim());
            if (parts.length > 3) return clamp(parts[3]!.endsWith('%') ? Number.parseFloat(parts[3]!) / 100 : Number(parts[3]), 0, 1);
        }
        return 1;
    }
    if (value && typeof value === 'object' && isNumber((value as Record<string, unknown>).a)) return clamp((value as { a: number }).a, 0, 1);
    return 1;
}

/** Two hex digits for an alpha, as CSS writes them. */
export const alphaToHex = (alpha: number): string => Math.round(clamp(alpha, 0, 1) * 255).toString(16).padStart(2, '0');

export const hsbToHex = (hsb: Hsb): string => rgbToHex(hsbToRgb(hsb));

export function hexToHsb(hex: string, round = true): Hsb | null {
    const rgb = hexToRgb(hex);
    return rgb ? rgbToHsb(rgb, round) : null;
}

/** Any value a colour picker may be bound to (a hex string, an `{ r, g, b }` or an `{ h, s, b }`) as HSB. Null when it is none of those. */
export function parseColor(value: unknown, round = true): Hsb | null {
    if (typeof value === 'string') return hexToHsb(value, round);
    if (value && typeof value === 'object') {
        const v = value as Record<string, unknown>;
        if (isNumber(v.h) && isNumber(v.s) && isNumber(v.b)) return { h: clamp(v.h, 0, 360), s: clamp(v.s, 0, 100), b: clamp(v.b, 0, 100) };
        if (isNumber(v.r) && isNumber(v.g) && isNumber(v.b)) return rgbToHsb({ r: v.r, g: v.g, b: v.b }, round);
    }
    return null;
}

/**
 * An HSB colour in the requested format, with whole numbers throughout. Pass an
 * `alpha` and it comes back carrying it: eight hex digits, or an `a` beside the
 * channels. Leave it out and the value is exactly what it always was.
 */
export function formatColor(hsb: Hsb, format: ColorFormat = 'hex', alpha?: number): ColorValue {
    const a = alpha === undefined ? undefined : clamp(alpha, 0, 1);
    if (format === 'rgb') return a === undefined ? hsbToRgb(hsb) : { ...hsbToRgb(hsb), a: Math.round(a * 100) / 100 };
    if (format === 'hsb') {
        const rounded = { h: Math.round(hsb.h), s: Math.round(hsb.s), b: Math.round(hsb.b) };
        return a === undefined ? rounded : { ...rounded, a: Math.round(a * 100) / 100 };
    }
    return a === undefined ? hsbToHex(hsb) : hsbToHex(hsb) + alphaToHex(a);
}

/** The colour as CSS, with its alpha: what a swatch is painted with. */
export function colorToCss(hsb: Hsb, alpha = 1): string {
    const { r, g, b } = hsbToRgb(hsb);
    return alpha >= 1 ? `#${hsbToHex(hsb)}` : `rgba(${r}, ${g}, ${b}, ${Math.round(alpha * 1000) / 1000})`;
}

/**
 * What a key does on the saturation/brightness area, which works as a slider
 * in two directions: Left/Right change saturation, Up/Down brightness, Page
 * Up/Down brightness in tens, Home/End saturation to its ends. `large` (Shift
 * held) makes the arrows move in tens too. Null for a key the area ignores.
 */
export function colorAreaKeyValue(key: string, hsb: Hsb, large = false): Hsb | null {
    const step = large ? 10 : 1;
    const s = (value: number): Hsb => ({ ...hsb, s: clamp(Math.round(value), 0, 100) });
    const b = (value: number): Hsb => ({ ...hsb, b: clamp(Math.round(value), 0, 100) });
    switch (key) {
        case 'ArrowRight':
            return s(hsb.s + step);
        case 'ArrowLeft':
            return s(hsb.s - step);
        case 'ArrowUp':
            return b(hsb.b + step);
        case 'ArrowDown':
            return b(hsb.b - step);
        case 'PageUp':
            return b(hsb.b + 10);
        case 'PageDown':
            return b(hsb.b - 10);
        case 'Home':
            return s(0);
        case 'End':
            return s(100);
        default:
            return null;
    }
}

/** The saturation and brightness at a point of the area, given as fractions of its width and height from the top-left. */
export function colorAreaAt(x: number, y: number, hue: number): Hsb {
    return { h: hue, s: Math.round(clamp(x, 0, 1) * 100), b: Math.round((1 - clamp(y, 0, 1)) * 100) };
}
