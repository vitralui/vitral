import { describe, expect, it } from 'vitest';
import { centredCrop, clampCrop, cropKeyAction, moveCrop, parseAspect, resizeCrop, turn, turnedBounds, zoomCrop, type CropLimits } from './cropper';

/**
 * The crop is arithmetic, so it is checked as arithmetic: every rule the
 * component leans on — it stays inside the image, it keeps its ratio, it never
 * goes below its minimum — asserted here rather than inferred from a drag.
 */

const bounds = { width: 1000, height: 500 };
const free: CropLimits = { bounds };
const square: CropLimits = { bounds, aspect: 1 };
const wide: CropLimits = { bounds, aspect: 16 / 9 };

const inside = (rect: { x: number; y: number; width: number; height: number }, limits: CropLimits = free) =>
    rect.x >= 0 && rect.y >= 0 && rect.x + rect.width <= limits.bounds.width + 1e-6 && rect.y + rect.height <= limits.bounds.height + 1e-6;

describe('an aspect', () => {
    it('reads a ratio however it was written, and treats anything else as free', () => {
        expect(parseAspect('16:9')).toBeCloseTo(16 / 9);
        expect(parseAspect('4/3')).toBeCloseTo(4 / 3);
        expect(parseAspect('1:1')).toBe(1);
        expect(parseAspect(1.5)).toBe(1.5);
        expect(parseAspect('1.5')).toBe(1.5);
        for (const value of ['free', '', null, undefined, 'nonsense', 0, -2, '0:0', NaN]) expect(parseAspect(value as never), String(value)).toBeNull();
    });
});

describe('clamping a crop', () => {
    it('keeps it inside the image', () => {
        expect(clampCrop({ x: -50, y: -50, width: 200, height: 100 }, free)).toEqual({ x: 0, y: 0, width: 200, height: 100 });
        expect(clampCrop({ x: 900, y: 450, width: 200, height: 100 }, free)).toEqual({ x: 800, y: 400, width: 200, height: 100 });
    });

    it('never lets it exceed the image, in either direction', () => {
        const huge = clampCrop({ x: 0, y: 0, width: 5000, height: 5000 }, free);
        expect(huge).toEqual({ x: 0, y: 0, width: 1000, height: 500 });
        expect(inside(huge)).toBe(true);
    });

    it('holds the ratio, shrinking the side that does not fit', () => {
        const box = clampCrop({ x: 0, y: 0, width: 900, height: 900 }, square);
        expect(box.width).toBeCloseTo(box.height);
        expect(box.height).toBeLessThanOrEqual(bounds.height);
        const banner = clampCrop({ x: 0, y: 0, width: 1000, height: 1000 }, wide);
        expect(banner.width / banner.height).toBeCloseTo(16 / 9);
        expect(inside(banner, wide)).toBe(true);
    });

    it('honours a minimum, and a minimum that the ratio makes bigger', () => {
        expect(clampCrop({ x: 0, y: 0, width: 5, height: 5 }, { bounds, minWidth: 100 }).width).toBe(100);
        const box = clampCrop({ x: 0, y: 0, width: 5, height: 5 }, { bounds, aspect: 2, minHeight: 100 });
        expect(box.height).toBeGreaterThanOrEqual(100);
        expect(box.width / box.height).toBeCloseTo(2);
    });
});

describe('moving a crop', () => {
    it('stops at the edge rather than shrinking', () => {
        const rect = { x: 100, y: 100, width: 200, height: 100 };
        expect(moveCrop(rect, -500, 0, free)).toMatchObject({ x: 0, width: 200 });
        expect(moveCrop(rect, 5000, 5000, free)).toMatchObject({ x: 800, y: 400, width: 200, height: 100 });
    });
});

describe('resizing a crop', () => {
    const rect = { x: 200, y: 100, width: 400, height: 200 };

    it('leaves the opposite edge where it was', () => {
        expect(resizeCrop(rect, 'e', 100, 0, free)).toMatchObject({ x: 200, width: 500 });
        expect(resizeCrop(rect, 'w', -100, 0, free)).toMatchObject({ x: 100, width: 500 });
        expect(resizeCrop(rect, 's', 0, 50, free)).toMatchObject({ y: 100, height: 250 });
        expect(resizeCrop(rect, 'n', 0, -50, free)).toMatchObject({ y: 50, height: 250 });
    });

    it('never turns the crop inside out', () => {
        for (const handle of ['e', 'w', 'n', 's', 'nw', 'ne', 'se', 'sw'] as const) {
            const out = resizeCrop(rect, handle, -5000, -5000, free);
            expect(out.width, handle).toBeGreaterThan(0);
            expect(out.height, handle).toBeGreaterThan(0);
            expect(inside(out), handle).toBe(true);
        }
    });

    it('keeps the ratio from a corner, anchored to the corner opposite', () => {
        const out = resizeCrop({ x: 100, y: 100, width: 200, height: 200 }, 'se', 100, 0, square);
        expect(out.width / out.height).toBeCloseTo(1);
        expect(out.x).toBe(100);
        expect(out.y).toBe(100);
    });

    it('grows a side handle about the centre, so the crop does not walk', () => {
        const start = { x: 200, y: 150, width: 200, height: 200 };
        const out = resizeCrop(start, 'e', 100, 0, square);
        expect(out.width / out.height).toBeCloseTo(1);
        expect(out.y + out.height / 2).toBeCloseTo(start.y + start.height / 2);
    });

    it('stays inside the image however hard it is pulled', () => {
        for (const handle of ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const) {
            for (const limits of [free, square, wide]) {
                const out = resizeCrop(rect, handle, 4000, 4000, limits);
                expect(inside(out, limits), `${handle} ${limits.aspect ?? 'free'}`).toBe(true);
            }
        }
    });
});

describe('zooming', () => {
    it('keeps the centre still, and stops at the image', () => {
        const rect = { x: 400, y: 150, width: 200, height: 200 };
        const closer = zoomCrop(rect, 0.5, free);
        expect(closer.x + closer.width / 2).toBeCloseTo(500);
        expect(closer.y + closer.height / 2).toBeCloseTo(250);
        expect(closer.width).toBe(100);
        const out = zoomCrop(rect, 100, free);
        expect(inside(out)).toBe(true);
        expect(out.height).toBe(500);
    });
});

describe('a centred crop', () => {
    it('is centred, at the ratio, and inside', () => {
        for (const limits of [free, square, wide]) {
            const rect = centredCrop(limits);
            expect(rect.x + rect.width / 2, String(limits.aspect)).toBeCloseTo(bounds.width / 2);
            expect(rect.y + rect.height / 2, String(limits.aspect)).toBeCloseTo(bounds.height / 2);
            expect(inside(rect, limits)).toBe(true);
            if (limits.aspect) expect(rect.width / rect.height).toBeCloseTo(limits.aspect);
        }
    });
});

describe('the keyboard', () => {
    const rect = { x: 200, y: 100, width: 400, height: 200 };

    it('moves with the arrows, and in tens with Shift', () => {
        expect(cropKeyAction('ArrowRight', rect, free)).toMatchObject({ x: 201 });
        expect(cropKeyAction('ArrowRight', rect, free, { large: true })).toMatchObject({ x: 210 });
        expect(cropKeyAction('ArrowUp', rect, free, { step: 5 })).toMatchObject({ y: 95 });
    });

    it('goes the other way when the page reads right to left', () => {
        expect(cropKeyAction('ArrowRight', rect, free, { rtl: true })).toMatchObject({ x: 199 });
        expect(cropKeyAction('ArrowLeft', rect, free, { rtl: true })).toMatchObject({ x: 201 });
    });

    it('resizes instead when asked, from the far corner', () => {
        expect(cropKeyAction('ArrowRight', rect, free, { resize: true })).toMatchObject({ x: 200, width: 401 });
        expect(cropKeyAction('ArrowDown', rect, free, { resize: true })).toMatchObject({ y: 100, height: 201 });
    });

    it('takes Home and End to the corners, and ignores the rest', () => {
        expect(cropKeyAction('Home', rect, free)).toMatchObject({ x: 0, y: 0 });
        expect(cropKeyAction('End', rect, free)).toMatchObject({ x: 600, y: 300 });
        for (const key of ['Enter', 'a', 'Tab', 'Escape']) expect(cropKeyAction(key, rect, free), key).toBeNull();
    });
});

describe('quarter turns', () => {
    it('swaps the bounds on the quarter, and not on the half', () => {
        expect(turnedBounds(1000, 500, 0)).toEqual({ width: 1000, height: 500 });
        expect(turnedBounds(1000, 500, 90)).toEqual({ width: 500, height: 1000 });
        expect(turnedBounds(1000, 500, 180)).toEqual({ width: 1000, height: 500 });
        expect(turnedBounds(1000, 500, 270)).toEqual({ width: 500, height: 1000 });
    });

    it('goes round in both directions without leaving 0–270', () => {
        expect(turn(0, -1)).toBe(270);
        expect(turn(270, 1)).toBe(0);
        expect([turn(0, 1), turn(90, 1), turn(180, 1)]).toEqual([90, 180, 270]);
    });
});
