import { describe, expect, it } from 'vitest';
import { swipeStep } from './carousel';

describe('swipeStep', () => {
    it('pages forward on a swipe towards the start and back on one towards the end', () => {
        expect(swipeStep(-80, 5)).toBe(1);
        expect(swipeStep(80, -5)).toBe(-1);
    });

    it('ignores short drags and drags that are mostly across the axis', () => {
        expect(swipeStep(-20, 0)).toBe(0);
        expect(swipeStep(-60, 90)).toBe(0);
    });

    it('reads the vertical axis, and mirrors a horizontal swipe right to left', () => {
        expect(swipeStep(3, -70, { vertical: true })).toBe(1);
        expect(swipeStep(-80, 0, { rtl: true })).toBe(-1);
        expect(swipeStep(0, -80, { vertical: true, rtl: true })).toBe(1);
    });
});
