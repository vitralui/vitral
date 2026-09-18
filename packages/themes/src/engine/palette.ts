import { mix, parseColor, toHex } from './color';

export const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

export type Shade = (typeof SHADES)[number];
export type Palette = Record<Shade, string>;

/**
 * Eleven shades from one colour: 500 is the colour itself, lighter shades mix
 * toward white and darker ones toward black.
 *
 * Passing a reference such as `'{emerald}'` instead returns references to that
 * palette's shades (`{emerald.50}` … `{emerald.950}`), which is how a preset
 * says "primary is emerald" without copying eleven values.
 */
export function palette(color: string): Palette {
    const ref = /^\{(.+)\}$/.exec(color.trim());
    if (ref) return Object.fromEntries(SHADES.map((shade) => [shade, `{${ref[1]}.${shade}}`])) as Palette;
    const parsed = parseColor(color);
    if (!parsed) throw new Error(`[vitral] palette() needs a hex or rgb colour, got "${color}"`);
    const base = toHex(parsed);
    return Object.fromEntries(
        SHADES.map((shade, i) => {
            if (i < 5) return [shade, mix('#ffffff', base, (5 - i) * 0.19)];
            if (i === 5) return [shade, base];
            return [shade, mix('#000000', base, (i - 5) * 0.15)];
        })
    ) as Palette;
}
