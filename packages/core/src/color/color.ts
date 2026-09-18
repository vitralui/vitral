import { clamp } from '../number/number';

/** Red, green and blue, each 0–255. */
export interface Rgb {
    r: number;
    g: number;
    b: number;
}

/** Hue 0–360, saturation and brightness 0–100: the model a colour picker's area and strip are drawn in. */
export interface Hsb {
    h: number;
    s: number;
    b: number;
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

/** Reads `#rgb`, `rgb`, `#rrggbb` or `rrggbb`; null for anything else. */
export function hexToRgb(hex: string): Rgb | null {
    let digits = hex.trim().replace(/^#/, '');
    if (/^[0-9a-f]{3}$/i.test(digits)) digits = [...digits].map((c) => c + c).join('');
    if (!/^[0-9a-f]{6}$/i.test(digits)) return null;
    const n = parseInt(digits, 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

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

/** An HSB colour in the requested format, with whole numbers throughout. */
export function formatColor(hsb: Hsb, format: ColorFormat = 'hex'): ColorValue {
    if (format === 'rgb') return hsbToRgb(hsb);
    if (format === 'hsb') return { h: Math.round(hsb.h), s: Math.round(hsb.s), b: Math.round(hsb.b) };
    return hsbToHex(hsb);
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
