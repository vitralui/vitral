import { describe, expect, it } from 'vitest';
import { calendarCell, daysBetween, startOfDay } from './calendar';

const day = (iso: string) => new Date(`${iso}T09:30:00`).getTime();

describe('a calendar grid', () => {
    it('counts whole days, whatever the clock says', () => {
        expect(daysBetween(day('2026-03-01'), day('2026-03-31'))).toBe(30);
        expect(daysBetween(new Date('2026-03-01T23:59:00').getTime(), new Date('2026-03-02T00:01:00').getTime())).toBe(1);
        expect(startOfDay(day('2026-03-01'))).toBe(new Date('2026-03-01T00:00:00').getTime());
    });

    it('puts a day in the week it falls in and the row its weekday asks for', () => {
        // 1 March 2026 is a Sunday.
        const first = day('2026-03-01');
        expect(calendarCell(first, first, 0)).toEqual({ column: 0, row: 0 });
        expect(calendarCell(day('2026-03-02'), first, 0)).toEqual({ column: 0, row: 1 });
        // The next Sunday starts a new column.
        expect(calendarCell(day('2026-03-08'), first, 0)).toEqual({ column: 1, row: 0 });
        expect(calendarCell(day('2026-03-31'), first, 0)).toEqual({ column: 4, row: 2 });
    });

    it('moves the rows when the week starts on a Monday', () => {
        const first = day('2026-03-01');
        // A Sunday is then the last row, and the week it ends is column zero.
        expect(calendarCell(first, first, 1)).toEqual({ column: 0, row: 6 });
        expect(calendarCell(day('2026-03-02'), first, 1)).toEqual({ column: 1, row: 0 });
    });
});
