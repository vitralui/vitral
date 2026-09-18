import { describe, expect, it } from 'vitest';
import { expandRecurrence, formatRecurrence, parseRecurrence } from './recurrence';

const d = (y: number, m: number, day: number, h = 9, min = 0) => new Date(y, m - 1, day, h, min);
const days = (list: Date[]) => list.map((x) => `${x.getFullYear()}-${x.getMonth() + 1}-${x.getDate()}`);
const rule = (text: string) => parseRecurrence(text)!.rule;

describe('RRULE', () => {
    it('parses and writes the subset, with DTSTART and EXDATE lines', () => {
        const parsed = parseRecurrence('DTSTART:20260914T090000\nRRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,-1FR;COUNT=4\nEXDATE:20260928T090000,20261012')!;
        expect(parsed.rule).toEqual({ freq: 'WEEKLY', interval: 2, count: 4, byDay: [{ day: 1 }, { day: 5, nth: -1 }] });
        expect(parsed.start).toEqual(d(2026, 9, 14));
        expect(parsed.exdates).toEqual([d(2026, 9, 28), d(2026, 10, 12, 0)]);
        expect(formatRecurrence(parsed.rule)).toBe('FREQ=WEEKLY;INTERVAL=2;COUNT=4;BYDAY=MO,-1FR');
        expect(parseRecurrence('FREQ=HOURLY')).toBeNull();
        expect(parseRecurrence('RRULE:FREQ=MONTHLY;UNTIL=20261231T235959Z;BYMONTHDAY=-1')!.rule).toEqual({ freq: 'MONTHLY', until: new Date(2026, 11, 31, 23, 59, 59), byMonthDay: [-1] });
    });

    it('repeats daily with an interval and a count', () => {
        expect(days(expandRecurrence(d(2026, 9, 29), rule('FREQ=DAILY;INTERVAL=2;COUNT=3')))).toEqual(['2026-9-29', '2026-10-1', '2026-10-3']);
    });

    it('repeats daily on weekdays only, until a date', () => {
        const out = expandRecurrence(d(2026, 9, 18), rule('FREQ=DAILY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20260923T090000'));
        expect(days(out)).toEqual(['2026-9-18', '2026-9-21', '2026-9-22', '2026-9-23']);
        expect(out[0]!.getHours()).toBe(9);
    });

    it('repeats weekly on several days, every other week, counting from the start', () => {
        // 16 September 2026 is a Wednesday: the Monday of that week is before the start and is skipped.
        const out = expandRecurrence(d(2026, 9, 16), rule('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;COUNT=4'));
        expect(days(out)).toEqual(['2026-9-16', '2026-9-28', '2026-9-30', '2026-10-12']);
    });

    it('repeats monthly by day of month, skipping months without it, and from the end', () => {
        expect(days(expandRecurrence(d(2026, 1, 31), rule('FREQ=MONTHLY;COUNT=3')))).toEqual(['2026-1-31', '2026-3-31', '2026-5-31']);
        expect(days(expandRecurrence(d(2026, 1, 31), rule('FREQ=MONTHLY;BYMONTHDAY=-1;COUNT=3')))).toEqual(['2026-1-31', '2026-2-28', '2026-3-31']);
    });

    it('repeats monthly on the nth weekday', () => {
        expect(days(expandRecurrence(d(2026, 9, 1), rule('FREQ=MONTHLY;BYDAY=2TU;COUNT=3')))).toEqual(['2026-9-8', '2026-10-13', '2026-11-10']);
        expect(days(expandRecurrence(d(2026, 9, 1), rule('FREQ=MONTHLY;BYDAY=-1FR;COUNT=2')))).toEqual(['2026-9-25', '2026-10-30']);
        // Friday the 13th.
        expect(days(expandRecurrence(d(2026, 1, 1), rule('FREQ=MONTHLY;BYDAY=FR;BYMONTHDAY=13;COUNT=2')))).toEqual(['2026-2-13', '2026-3-13']);
    });

    it('repeats yearly, including 29 February and the nth weekday of a month', () => {
        expect(days(expandRecurrence(d(2024, 2, 29), rule('FREQ=YEARLY;COUNT=2')))).toEqual(['2024-2-29', '2028-2-29']);
        expect(days(expandRecurrence(d(2026, 1, 1), rule('FREQ=YEARLY;BYMONTH=11;BYDAY=4TH;COUNT=2')))).toEqual(['2026-11-26', '2027-11-25']);
    });

    it('leaves out exceptions, by instant or by day, and windows the output without losing the count', () => {
        const r = rule('FREQ=DAILY;COUNT=5');
        expect(days(expandRecurrence(d(2026, 9, 1), r, { exdates: [d(2026, 9, 2), d(2026, 9, 4, 0)] }))).toEqual(['2026-9-1', '2026-9-3', '2026-9-5']);
        expect(days(expandRecurrence(d(2026, 9, 1), r, { from: d(2026, 9, 3, 0), to: d(2026, 9, 5, 0) }))).toEqual(['2026-9-3', '2026-9-4']);
    });

    it('stops on a rule nothing matches, and on the limit of an endless one', () => {
        expect(expandRecurrence(d(2026, 1, 1), rule('FREQ=MONTHLY;BYMONTH=2;BYMONTHDAY=30'))).toEqual([]);
        expect(expandRecurrence(d(2026, 1, 1), rule('FREQ=DAILY'), { limit: 10 })).toHaveLength(10);
    });
});
