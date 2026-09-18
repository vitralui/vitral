import { describe, expect, it } from 'vitest';
import { scrollOffsetAt, scrollThumb } from './scrollbar';

describe('scrollThumb', () => {
    it('hides the bar when everything fits', () => {
        expect(scrollThumb({ viewport: 200, content: 200, offset: 0 })).toEqual({ visible: false, size: 0, position: 0 });
        expect(scrollThumb({ viewport: 0, content: 100, offset: 0 }).visible).toBe(false);
    });

    it('sizes the thumb by the visible share and places it by the scroll', () => {
        expect(scrollThumb({ viewport: 200, content: 800, offset: 0 })).toEqual({ visible: true, size: 50, position: 0 });
        expect(scrollThumb({ viewport: 200, content: 800, offset: 600 })).toEqual({ visible: true, size: 50, position: 150 });
        expect(scrollThumb({ viewport: 200, content: 800, offset: 300 }).position).toBe(75);
        expect(scrollThumb({ viewport: 100, content: 100000, offset: 0 }).size).toBe(20);
        expect(scrollThumb({ viewport: 200, content: 800, offset: 9999 }).position).toBe(150);
    });

    it('turns a thumb position back into a scroll offset', () => {
        expect(scrollOffsetAt(75, 50, { viewport: 200, content: 800 })).toBe(300);
        expect(scrollOffsetAt(-10, 50, { viewport: 200, content: 800 })).toBe(0);
        expect(scrollOffsetAt(500, 50, { viewport: 200, content: 800 })).toBe(600);
        expect(scrollOffsetAt(10, 200, { viewport: 200, content: 800 })).toBe(0);
    });
});
