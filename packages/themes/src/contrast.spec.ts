import { describe, expect, it } from 'vitest';
import { contrastRatio, mix, parseColor, toHex } from './engine/color';
import { compileTheme } from './engine/compile';
import { Astra, Avalonia, Base, Ink, Prism, Simple } from './index';
import type { Preset } from './engine/types';

/**
 * WCAG contrast, which is the one criterion axe cannot check for us: it needs
 * computed colours, and the component specs run in jsdom, which paints
 * nothing. Here the colours come from the compiled theme instead, so every
 * preset is checked in both schemes without a browser.
 *
 * Two things make it harder than dividing two numbers:
 *
 * - a token's value is a chain of `var()`s, so it has to be followed to a
 *   real colour;
 * - a surface may be translucent (Avalonia's are), and a translucent colour
 *   has no contrast of its own — it has to be composited over what is behind
 *   it first, which is the application background.
 */

const presets: Record<string, Preset> = { Base, Prism, Ink, Avalonia, Simple, Astra };

/** A single `color-mix(in srgb, A p%, B)`, worked out the way a browser would. */
function evaluateMix(value: string, vars: Record<string, string>, depth: number): string | null {
    const m = value.match(/^color-mix\(\s*in\s+srgb\s*,\s*(.+?)\s+([\d.]+)%\s*,\s*(.+?)\s*\)$/i);
    if (!m) return null;
    const a = resolveValue(m[1]!, vars, depth + 1);
    const b = resolveValue(m[3]!, vars, depth + 1);
    return a && b ? mix(a, b, Number(m[2]) / 100) : null;
}

function resolveValue(value: string, vars: Record<string, string>, depth: number): string | null {
    if (!value || depth > 12) return null;
    const indirect = value.match(/^var\((--[a-z0-9-]+)\)$/i);
    if (indirect) return resolve(vars, indirect[1]!, depth + 1);
    if (/^color-mix\(/i.test(value)) return evaluateMix(value, vars, depth);
    return /^(#|rgb|hsl)/i.test(value) ? value : null;
}

/** Follows `var(--x)` — and any `color-mix` on the way — until a colour turns up. */
function resolve(vars: Record<string, string>, name: string, depth = 0): string | null {
    return resolveValue(vars[name] ?? '', vars, depth);
}

/** A translucent colour laid over an opaque one, which is what the eye is given. */
function composite(over: string, base: string): string {
    const top = parseColor(over);
    const bottom = parseColor(base);
    if (!top || !bottom) return over;
    const a = top.a ?? 1;
    if (a >= 1) return over;
    return toHex({
        r: Math.round(top.r * a + bottom.r * (1 - a)),
        g: Math.round(top.g * a + bottom.g * (1 - a)),
        b: Math.round(top.b * a + bottom.b * (1 - a)),
        a: 1
    });
}

interface Pair {
    fg: string;
    bg: string;
    need: number;
    what: string;
}

/** 1.4.3 Contrast (Minimum): anything that is words. */
const TEXT: Pair[] = [
    { fg: '--vt-text-color', bg: '--vt-content-background', need: 4.5, what: 'body text on a surface' },
    { fg: '--vt-text-muted-color', bg: '--vt-content-background', need: 4.5, what: 'muted text on a surface' },
    { fg: '--vt-text-color', bg: '--vt-app-background', need: 4.5, what: 'body text on the page' },
    { fg: '--vt-primary-contrast-color', bg: '--vt-primary-color', need: 4.5, what: "a primary button's label" },
    { fg: '--vt-text-color', bg: '--vt-form-field-background', need: 4.5, what: 'what is typed in a field' }
];

/**
 * 1.4.11 Non-text Contrast: the boundary that says where a control is, and the
 * ring that says what has focus. Decorative rules — the hairline between two
 * cards — are deliberately not here; the criterion is about identifying a
 * control, not about every line on the page.
 */
const FOCUS: Pair[] = [{ fg: '--vt-focus-ring-color', bg: '--vt-content-background', need: 3, what: 'the focus ring against a surface' }];

/** The boundary that says where a control is. */
const EDGES: Pair[] = [{ fg: '--vt-form-field-border-color', bg: '--vt-form-field-background', need: 3, what: "a field's own edge" }];

/**
 * A surface's edge is not a control's. 1.4.11 does not ask a card to reach 3:1,
 * and holding it there would make every container shout as loudly as the fields
 * inside it — but leaving it at the hairline it used to be, once the fields were
 * darkened, read as one of them having been forgotten. It sits between: quieter
 * than a control, loud enough to belong to the same drawing.
 */
const SURFACES: Pair[] = [
    { fg: '--vt-content-border-color', bg: '--vt-content-background', need: 1.7, what: "a card's edge" },
    { fg: '--vt-overlay-popover-border-color', bg: '--vt-overlay-popover-background', need: 1.7, what: "a popover's edge" }
];

function ratios(preset: Preset, pairs: Pair[]) {
    const { light, dark } = compileTheme(preset);
    // The dark map holds only what dark changes, so it is read over the light one.
    const schemes = { light, dark: { ...light, ...dark } };
    const out: { scheme: string; what: string; ratio: number; need: number }[] = [];
    for (const [scheme, vars] of Object.entries(schemes)) {
        const page = resolve(vars, '--vt-app-background') ?? '#ffffff';
        for (const pair of pairs) {
            const fg = resolve(vars, pair.fg);
            const bg = resolve(vars, pair.bg);
            expect(fg, `${scheme} ${pair.fg}`).toBeTruthy();
            expect(bg, `${scheme} ${pair.bg}`).toBeTruthy();
            // Both may be translucent; the page is what is behind everything.
            const base = composite(bg!, page);
            out.push({ scheme, what: pair.what, ratio: contrastRatio(composite(fg!, base), base), need: pair.need });
        }
    }
    return out;
}

const failing = (preset: Preset, pairs: Pair[]) =>
    ratios(preset, pairs)
        .filter((r) => r.ratio < r.need)
        .map((r) => `${r.scheme}: ${r.what} is ${r.ratio.toFixed(2)}:1, needs ${r.need}:1`);

describe('WCAG contrast, over every preset and both schemes', () => {
    for (const [name, preset] of Object.entries(presets)) {
        it(`${name} reads words at the ratio 1.4.3 asks for`, () => {
            expect(failing(preset, TEXT)).toEqual([]);
        });

        // A focus ring is not decoration: it is how someone working from the
        // keyboard knows where they are, so 1.4.11 applies to it plainly.
        it(`${name} shows focus at the ratio 1.4.11 asks for`, () => {
            expect(failing(preset, FOCUS)).toEqual([]);
        });

        // 1.4.11 again: the boundary that says where the control is. These sat
        // between 1.14 and 2.07 until the borders were darkened by the least
        // that clears the bar — the palette's next shade would have been 4.8,
        // heavier than the criterion asks for.
        it(`${name} draws a field edge at the ratio 1.4.11 asks for`, () => {
            expect(failing(preset, EDGES)).toEqual([]);
        });

        // Not a WCAG rule — a house one. The two kinds of edge have to stay on
        // speaking terms, or the darker fields look like a change nobody
        // finished.
        it(`${name} keeps a surface edge quieter than a control's, but in the same drawing`, () => {
            expect(failing(preset, SURFACES)).toEqual([]);
            for (const surface of ratios(preset, SURFACES)) {
                const control = ratios(preset, EDGES).find((e) => e.scheme === surface.scheme)!;
                expect(surface.ratio, `${surface.scheme} ${surface.what}`).toBeLessThan(control.ratio + 0.6);
            }
        });
    }
});
