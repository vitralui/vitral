import { describe, expect, it } from 'vitest';
import { calendarKeyTarget, clampDate, endOfWeek, findSelectableDate, isSameMonth, nearestSelectableDate, startOfWeek } from './datepicker';

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe('calendar navigation', () => {
    it('finds the ends of a week for any first day', () => {
        // 2026-03-11 is a Wednesday.
        expect(startOfWeek(d(2026, 3, 11), 0)).toEqual(d(2026, 3, 8));
        expect(endOfWeek(d(2026, 3, 11), 0)).toEqual(d(2026, 3, 14));
        expect(startOfWeek(d(2026, 3, 11), 1)).toEqual(d(2026, 3, 9));
        expect(startOfWeek(d(2026, 3, 8), 1)).toEqual(d(2026, 3, 2));
        expect(endOfWeek(d(2026, 3, 8), 1)).toEqual(d(2026, 3, 8));
    });

    it('clamps into range and compares months', () => {
        expect(clampDate(d(2026, 1, 1), d(2026, 2, 1), d(2026, 3, 1))).toEqual(d(2026, 2, 1));
        expect(clampDate(new Date(2026, 3, 1, 15, 30), null, d(2026, 3, 1))).toEqual(d(2026, 3, 1));
        expect(isSameMonth(d(2026, 3, 1), d(2026, 3, 31))).toBe(true);
        expect(isSameMonth(d(2026, 3, 1), d(2025, 3, 1))).toBe(false);
    });

    it('moves by day, week, month and year', () => {
        const from = d(2026, 1, 31);
        expect(calendarKeyTarget(from, 'ArrowRight')).toEqual(d(2026, 2, 1));
        expect(calendarKeyTarget(from, 'ArrowLeft')).toEqual(d(2026, 1, 30));
        expect(calendarKeyTarget(from, 'ArrowDown')).toEqual(d(2026, 2, 7));
        expect(calendarKeyTarget(from, 'ArrowUp')).toEqual(d(2026, 1, 24));
        expect(calendarKeyTarget(from, 'PageDown')).toEqual(d(2026, 2, 28));
        expect(calendarKeyTarget(from, 'PageUp')).toEqual(d(2025, 12, 31));
        expect(calendarKeyTarget(from, 'PageDown', { shiftKey: true })).toEqual(d(2027, 1, 31));
        expect(calendarKeyTarget(d(2024, 2, 29), 'PageUp', { shiftKey: true })).toEqual(d(2023, 2, 28));
        expect(calendarKeyTarget(from, 'Home', { firstDayOfWeek: 1 })).toEqual(d(2026, 1, 26));
        expect(calendarKeyTarget(from, 'End', { firstDayOfWeek: 1 })).toEqual(d(2026, 2, 1));
        expect(calendarKeyTarget(from, 'a')).toBeNull();
    });

    it('skips unselectable days along the move and stays inside the range', () => {
        const weekdays = { disabledDays: [0, 6] };
        // Friday 2026-03-13 → the weekend is skipped.
        expect(calendarKeyTarget(d(2026, 3, 13), 'ArrowRight', { constraints: weekdays })).toEqual(d(2026, 3, 16));
        expect(calendarKeyTarget(d(2026, 3, 16), 'ArrowLeft', { constraints: weekdays })).toEqual(d(2026, 3, 13));
        // Home lands on Sunday, which is off, so it walks forward to Monday.
        expect(calendarKeyTarget(d(2026, 3, 11), 'Home', { constraints: weekdays })).toEqual(d(2026, 3, 9));
        expect(calendarKeyTarget(d(2026, 3, 11), 'End', { constraints: weekdays })).toEqual(d(2026, 3, 13));
        const range = { min: d(2026, 3, 5), max: d(2026, 3, 20) };
        expect(calendarKeyTarget(d(2026, 3, 18), 'PageDown', { constraints: range })).toEqual(d(2026, 3, 20));
        expect(calendarKeyTarget(d(2026, 3, 7), 'ArrowUp', { constraints: range })).toEqual(d(2026, 3, 5));
        expect(calendarKeyTarget(d(2026, 3, 5), 'ArrowLeft', { constraints: range })).toEqual(d(2026, 3, 5));
    });

    it('finds the nearest selectable day, or none', () => {
        expect(findSelectableDate(d(2026, 3, 14), 1, { disabledDates: [d(2026, 3, 14), d(2026, 3, 15)] })).toEqual(d(2026, 3, 16));
        expect(findSelectableDate(d(2026, 3, 14), 1, { max: d(2026, 3, 14), disabledDays: [6] })).toBeNull();
        expect(nearestSelectableDate(d(2026, 3, 31), 1, { max: d(2026, 3, 20), disabledDays: [5] })).toEqual(d(2026, 3, 19));
        expect(nearestSelectableDate(d(2026, 3, 1), 1, { disabledDays: [0, 1, 2, 3, 4, 5, 6] })).toBeNull();
    });
});
