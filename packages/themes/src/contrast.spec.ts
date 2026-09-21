import { describe, expect, it } from 'vitest';
import { contrastRatio, parseColor, toHex } from './engine/color';
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

/** Follows `var(--x)` until a colour turns up. */
function resolve(vars: Record<string, string>, name: string, depth = 0): string | null {
    const value = vars[name];
    if (!value || depth > 12) return null;
    const indirect = value.match(/^var\((--[a-z0-9-]+)\)$/i);
    if (indirect) return resolve(vars, indirect[1]!, depth + 1);
    return /^(#|rgb|hsl)/i.test(value) ? value : null;
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

/** The one boundary still below the bar; see the test that records it. */
const EDGES: Pair[] = [{ fg: '--vt-form-field-border-color', bg: '--vt-form-field-background', need: 3, what: "a field's own edge" }];

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
    }

    /**
     * The edge of a field is still below 3:1 in every preset — between 1.14 and
     * 2.07 depending on the one. Reaching it means a border two or three shades
     * darker in all six, which changes how each of them looks, so it is a
     * decision rather than a fix. This records where they stand until that
     * decision is made, and fails the moment one gets worse.
     */
    it('records how far a field edge still is from 1.4.11', () => {
        const worst = Object.fromEntries(
            Object.entries(presets).map(([name, preset]) => [name, Math.min(...ratios(preset, EDGES).map((r) => Number(r.ratio.toFixed(2))))])
        );
        expect(worst).toEqual({ Base: 1.48, Prism: 1.48, Ink: 1.27, Avalonia: 1.14, Simple: 2.07, Astra: 1.23 });
    });
});
