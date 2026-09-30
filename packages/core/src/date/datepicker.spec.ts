import { describe, expect, it } from 'vitest';
import { calendarKeyTarget, clampDate, endOfWeek, findSelectableDate, isMonthInRange, isSameMonth, isYearInRange, monthIndex, nearestSelectableDate, pickerKeyTarget, startOfWeek, yearPageStart } from './datepicker';

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

    it('pages years in aligned blocks and keeps months and years inside the range', () => {
        expect(yearPageStart(2026)).toBe(2020);
        expect(yearPageStart(2039)).toBe(2020);
        expect(yearPageStart(2040)).toBe(2040);
        expect(yearPageStart(1999, 10)).toBe(1990);
        const range = { min: d(2024, 11, 20), max: d(2026, 3, 5) };
        expect(isMonthInRange(2024, 9, range)).toBe(false);
        // A month counts from its first day in range to its last.
        expect(isMonthInRange(2024, 10, range)).toBe(true);
        expect(isMonthInRange(2026, 2, range)).toBe(true);
        expect(isMonthInRange(2026, 3, range)).toBe(false);
        expect(isMonthInRange(1900, 0)).toBe(true);
        expect(isYearInRange(2023, range)).toBe(false);
        expect(isYearInRange(2024, range)).toBe(true);
        expect(isYearInRange(2027, range)).toBe(false);
    });

    it('moves through the month and the year grid', () => {
        const months = { columns: 3, page: 12 };
        const march = monthIndex(2026, 2);
        expect(pickerKeyTarget(march, 'ArrowLeft', months)).toBe(monthIndex(2026, 1));
        expect(pickerKeyTarget(march, 'ArrowDown', months)).toBe(monthIndex(2026, 5));
        expect(pickerKeyTarget(march, 'Home', months)).toBe(monthIndex(2026, 0));
        expect(pickerKeyTarget(monthIndex(2026, 4), 'End', months)).toBe(monthIndex(2026, 5));
        // Off the end of the year is the next one.
        expect(pickerKeyTarget(monthIndex(2026, 11), 'ArrowRight', months)).toBe(monthIndex(2027, 0));
        expect(pickerKeyTarget(monthIndex(2026, 1), 'ArrowUp', months)).toBe(monthIndex(2025, 10));
        expect(pickerKeyTarget(march, 'PageDown', months)).toBe(monthIndex(2027, 2));
        expect(pickerKeyTarget(march, 'PageUp', { ...months, min: monthIndex(2025, 8) })).toBe(monthIndex(2025, 8));
        expect(pickerKeyTarget(march, 'ArrowRight', { ...months, max: march })).toBe(march);
        const years = { columns: 4, page: 20 };
        expect(pickerKeyTarget(2026, 'ArrowUp', years)).toBe(2022);
        expect(pickerKeyTarget(2026, 'Home', years)).toBe(2024);
        expect(pickerKeyTarget(2026, 'End', years)).toBe(2027);
        expect(pickerKeyTarget(2026, 'PageUp', years)).toBe(2006);
        expect(pickerKeyTarget(2026, 'a', years)).toBeNull();
    });
});
