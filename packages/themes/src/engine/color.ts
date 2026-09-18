export interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
}

/** Reads `#rgb`, `#rgba`, `#rrggbb`, `#rrggbbaa`, `rgb()` and `rgba()`; null for anything else. */
export function parseColor(input: string): RGBA | null {
    const value = input.trim().toLowerCase();
    const hex = /^#([0-9a-f]{3,8})$/.exec(value);
    if (hex) {
        let digits = hex[1]!;
        if (digits.length === 3 || digits.length === 4) digits = [...digits].map((d) => d + d).join('');
        if (digits.length !== 6 && digits.length !== 8) return null;
        const n = (i: number) => parseInt(digits.slice(i, i + 2), 16);
        return { r: n(0), g: n(2), b: n(4), a: digits.length === 8 ? n(6) / 255 : 1 };
    }
    const fn = /^rgba?\(([^)]+)\)$/.exec(value);
    if (fn) {
        const parts = fn[1]!.split(/[\s,/]+/).filter(Boolean).map(Number);
        if (parts.length < 3 || parts.some(Number.isNaN)) return null;
        return { r: parts[0]!, g: parts[1]!, b: parts[2]!, a: parts[3] ?? 1 };
    }
    return null;
}

export function toHex({ r, g, b, a }: RGBA): string {
    const h = (n: number) => Math.round(Math.min(255, Math.max(0, n))).toString(16).padStart(2, '0');
    return `#${h(r)}${h(g)}${h(b)}${a < 1 ? h(a * 255) : ''}`;
}

/** `a` and `b` blended, with `weight` of `a` (0–1). */
export function mix(a: string, b: string, weight: number): string {
    const x = parseColor(a);
    const y = parseColor(b);
    if (!x || !y) throw new Error(`[vitral] cannot mix "${a}" and "${b}"`);
    const w = Math.min(1, Math.max(0, weight));
    return toHex({ r: x.r * w + y.r * (1 - w), g: x.g * w + y.g * (1 - w), b: x.b * w + y.b * (1 - w), a: x.a * w + y.a * (1 - w) });
}

/** WCAG relative luminance. */
export function luminance(color: string): number {
    const c = parseColor(color);
    if (!c) return 0;
    const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);
}

export function contrastRatio(a: string, b: string): number {
    const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
    return (hi + 0.05) / (lo + 0.05);
}

/** Whichever candidate reads best on `background`. */
export function readableOn(background: string, candidates: string[] = ['#ffffff', '#000000']): string {
    return candidates.reduce((best, c) => (contrastRatio(background, c) > contrastRatio(background, best) ? c : best), candidates[0]!);
}
