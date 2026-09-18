import { describe, expect, it } from 'vitest';
import { isCompleteRange, isInRange, isRangeEnd, isRangeSelectable, normalizeDateRange, pressRange, previewRange, rangeDays, rangeLength } from './range';

/** A range is two dates and the days between them, so it is checked as that. */
const at = (day: number) => new Date(2026, 8, day);

describe('a date range', () => {
    it('sorts its ends, however they arrived', () => {
        expect(normalizeDateRange({ start: at(10), end: at(3) })).toEqual({ start: at(3), end: at(10) });
        expect(normalizeDateRange({ start: at(3), end: null })).toEqual({ start: at(3), end: null });
        // The time of day is dropped: a range is days, not moments.
        expect(normalizeDateRange({ start: new Date(2026, 8, 3, 18, 30), end: at(4) }).start).toEqual(at(3));
    });

    it('knows what is inside it and what its ends are', () => {
        const range = { start: at(3), end: at(6) };
        expect([2, 3, 4, 6, 7].map((d) => isInRange(at(d), range))).toEqual([false, true, true, true, false]);
        expect(isRangeEnd(at(3), range)).toBe('start');
        expect(isRangeEnd(at(6), range)).toBe('end');
        expect(isRangeEnd(at(4), range)).toBeNull();
        // Half a range contains nothing: it is being chosen, not chosen.
        expect(isInRange(at(4), { start: at(3), end: null })).toBe(false);
        expect(isCompleteRange({ start: at(3), end: null })).toBe(false);
    });

    it('opens on the first press and closes on the second, either way round', () => {
        const first = pressRange({ start: null, end: null }, at(10));
        expect(first).toEqual({ start: at(10), end: null });

        // Backwards closes just as well; the ends sort themselves.
        expect(pressRange(first, at(4))).toEqual({ start: at(4), end: at(10) });
        expect(pressRange(first, at(14))).toEqual({ start: at(10), end: at(14) });

        // A press on a range that is already whole starts a new one.
        expect(pressRange({ start: at(4), end: at(10) }, at(20))).toEqual({ start: at(20), end: null });
    });

    it('previews the other end without committing to it', () => {
        const open = { start: at(10), end: null };
        expect(previewRange(open, at(14))).toEqual({ start: at(10), end: at(14) });
        expect(previewRange(open, at(4))).toEqual({ start: at(4), end: at(10) });
        // Nothing to preview before a start, or once both ends are down.
        expect(previewRange({ start: null, end: null }, at(4))).toEqual({ start: null, end: null });
        const whole = { start: at(4), end: at(10) };
        expect(previewRange(whole, at(20))).toBe(whole);
        expect(previewRange(open, null)).toBe(open);
    });

    it('counts its days, both ends included', () => {
        expect(rangeLength({ start: at(3), end: at(3) })).toBe(1);
        expect(rangeLength({ start: at(3), end: at(6) })).toBe(4);
        expect(rangeLength({ start: at(3), end: null })).toBe(0);
        expect(rangeDays({ start: at(3), end: at(5) })).toEqual([at(3), at(4), at(5)]);
    });

    it('can be asked whether every day in it is open', () => {
        const range = { start: at(3), end: at(6) };
        expect(isRangeSelectable(range)).toBe(true);
        expect(isRangeSelectable(range, { disabledDates: [at(5)] })).toBe(false);
        expect(isRangeSelectable(range, { min: at(4) })).toBe(false);
    });
});
