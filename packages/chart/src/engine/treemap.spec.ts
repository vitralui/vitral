import { describe, expect, it } from 'vitest';
import { squarify } from './treemap';

const area = (b: { width: number; height: number }) => b.width * b.height;
const ratio = (b: { width: number; height: number }) => Math.max(b.width / b.height, b.height / b.width);

describe('a squarified treemap', () => {
    const rect = { x: 0, y: 0, width: 600, height: 400 };

    it('gives every box the share of the rectangle its value asks for', () => {
        const values = [6, 6, 4, 3, 2, 2, 1];
        const boxes = squarify(values, rect);
        const total = values.reduce((a, b) => a + b, 0);
        boxes.forEach((b, i) => expect(area(b)).toBeCloseTo((values[i]! / total) * area(rect), 4));
        // And they fill it: the areas add up to the whole rectangle.
        expect(boxes.reduce((sum, b) => sum + area(b), 0)).toBeCloseTo(area(rect), 4);
    });

    it('keeps the boxes square rather than leaving slivers', () => {
        const boxes = squarify([6, 6, 4, 3, 2, 2, 1], rect);
        // A row-by-row layout would put a 600×4 sliver at the bottom; none of
        // these is worse than three to one.
        expect(Math.max(...boxes.map(ratio))).toBeLessThan(3);
    });

    it('stays inside the rectangle it was given', () => {
        for (const b of squarify([10, 7, 5, 5, 3, 1, 1, 1], { x: 20, y: 30, width: 200, height: 500 })) {
            expect(b.x).toBeGreaterThanOrEqual(20 - 1e-6);
            expect(b.y).toBeGreaterThanOrEqual(30 - 1e-6);
            expect(b.x + b.width).toBeLessThanOrEqual(220 + 1e-6);
            expect(b.y + b.height).toBeLessThanOrEqual(530 + 1e-6);
        }
    });

    it('survives one box, no boxes and a rectangle of nothing', () => {
        expect(squarify([5], rect)[0]).toMatchObject({ x: 0, y: 0, width: 600, height: 400 });
        expect(squarify([], rect)).toEqual([]);
        expect(squarify([1, 2], { x: 0, y: 0, width: 0, height: 10 }).every((b) => b.width === 0)).toBe(true);
        expect(squarify([0, 0], rect).every((b) => b.width === 0)).toBe(true);
    });
});
