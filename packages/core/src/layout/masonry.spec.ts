import { describe, expect, it } from 'vitest';
import { masonryLayout } from './masonry';

describe('a masonry layout', () => {
    it('puts each item into the shortest column so far', () => {
        const layout = masonryLayout([100, 50, 80, 30], { width: 320, gap: 10, columns: 2 });
        expect(layout.columnWidth).toBe(155);
        expect(layout.positions).toEqual([
            { x: 0, y: 0 },
            { x: 165, y: 0 },
            { x: 165, y: 60 },
            { x: 0, y: 110 }
        ]);
        expect(layout.height).toBe(140);
    });

    it('fits as many columns of the least width as the width holds', () => {
        expect(masonryLayout([10], { width: 1000, gap: 20, minColumnWidth: 300 }).columns).toBe(3);
        expect(masonryLayout([10], { width: 200, gap: 20, minColumnWidth: 300 }).columns).toBe(1);
        expect(masonryLayout([], { width: 500 }).height).toBe(0);
    });
});
