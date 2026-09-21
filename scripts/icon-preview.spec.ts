import { describe, expect, it } from 'vitest';
// @ts-expect-error — a plain .mjs script, imported for its one exported function.
import { preview } from './icon-preview.mjs';

/**
 * The preview is the only check the icon set has that looks at the *shape*.
 * Everything else — does it parse, is it inside the box, is the name
 * registered — can pass while the drawing is a scribble. So the drawing of the
 * drawing has to be right, or it would quietly stop telling anyone anything.
 */
const ink = (art: string) => art.split('').filter((c) => c !== ' ' && c !== '\n').length;
const rows = (art: string) => art.split('\n');

describe('the icon preview', () => {
    it('draws a straight line where the line is', () => {
        const art = preview('<path d="M2 12h20"/>', 24);
        expect(rows(art)).toHaveLength(24);
        // One row of ink, across the middle.
        const inked = rows(art).map((r, i) => [i, ink(r)] as const).filter(([, n]) => n > 0);
        expect(inked).toHaveLength(1);
        expect(inked[0]![0]).toBe(12);
        expect(inked[0]![1]).toBeGreaterThan(18);
    });

    it('follows a curve rather than cutting the corner', () => {
        // A quarter circle from (12,2) to (22,12): its middle must be off the
        // straight line between the ends, or arcs are being drawn as chords.
        const art = preview('<path d="M12 2A10 10 0 0 1 22 12"/>', 24);
        const middle = rows(art)[5]!;
        expect(ink(middle)).toBeGreaterThan(0);
        expect(middle.lastIndexOf('█')).toBeGreaterThan(17);
    });

    it('draws the shapes that are not paths', () => {
        const circle = preview('<circle cx="12" cy="12" r="10"/>', 24);
        const rect = preview('<rect x="2" y="2" width="20" height="20"/>', 24);
        expect(ink(circle)).toBeGreaterThan(40);
        expect(ink(rect)).toBeGreaterThan(40);
        // Both start at y=2; along that row a rectangle is a full edge and a
        // circle is only the short arc over its top.
        expect(ink(rows(circle)[2]!)).toBeLessThan(ink(rows(rect)[2]!) / 2);
    });

    it('keeps what it draws inside the grid it was given', () => {
        const art = preview('<path d="M-40 -40L80 80"/>', 16);
        expect(rows(art)).toHaveLength(16);
        expect(rows(art).every((r) => r.length === 16)).toBe(true);
    });

    it('says nothing about a body with nothing in it', () => {
        expect(ink(preview('', 12))).toBe(0);
    });

    it('reflects a smooth curve off the command before it, not off an older one', () => {
        // `s` takes its first control point from the previous curve; after a
        // line or an arc there is none, and the spec says to use the current
        // point. Keeping a stale one from further back sends the curve
        // somewhere the path never goes — which is how a good icon looked
        // broken until this was fixed.
        const straight = preview('<path d="M4 20C8 4 16 4 20 20"/>', 24);
        const afterLine = preview('<path d="M2 12h2M4 20S12 4 20 20"/>', 24);
        const rows = (a: string) => a.split('\n');
        // The smooth curve must stay in the lower half, where its own points
        // are; reflecting an old control point threw it to the top.
        const top = rows(afterLine).slice(0, 8).join('');
        expect(top.replace(/ /g, '')).toBe('');
        expect(rows(straight)).toHaveLength(24);
    });
});
