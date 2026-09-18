import { describe, expect, it } from 'vitest';
import { expandEvents, fractionOf, isBusinessTime, layoutDaySpans, layoutLanes, layoutTimedEvents, parseTime, snapMinutes, stepViewDate, timeGridKeyTarget, viewRange } from './schedule';

const d = (m: number, day: number, h = 0, min = 0) => new Date(2026, m - 1, day, h, min);

describe('schedule ranges', () => {
    it('gives each view its range', () => {
        expect(viewRange('month', d(9, 16))).toEqual({ start: d(8, 30), end: d(10, 11) });
        expect(viewRange('week', d(9, 16), { firstDayOfWeek: 1 })).toEqual({ start: d(9, 14), end: d(9, 21) });
        expect(viewRange('day', d(9, 16, 15))).toEqual({ start: d(9, 16), end: d(9, 17) });
        expect(viewRange('agenda', d(9, 16), { days: 3 }).end).toEqual(d(9, 19));
        expect(stepViewDate('month', d(1, 31), 1)).toEqual(d(2, 1));
        expect(stepViewDate('week', d(9, 16), -1)).toEqual(d(9, 9));
    });

    it('reads times and snaps', () => {
        expect(parseTime('08:30')).toBe(510);
        expect(parseTime('24:00')).toBe(1440);
        expect(parseTime(undefined, 5)).toBe(5);
        expect(snapMinutes(52, 15)).toBe(45);
        expect(snapMinutes(53, 15)).toBe(60);
    });
});

describe('expandEvents', () => {
    it('keeps events that overlap the range, defaulting ends, and unfolds recurring ones', () => {
        const events = [
            { id: 'a', start: d(9, 14, 9), end: d(9, 14, 10) },
            { id: 'b', start: '2026-09-15', allDay: true },
            { id: 'c', start: d(9, 1, 9), recurrence: 'FREQ=WEEKLY;BYDAY=TU', exdate: ['2026-09-15'] },
            { id: 'd', start: d(9, 13, 23), end: d(9, 14, 1) },
            { id: 'e', start: d(10, 1, 9) }
        ];
        const out = expandEvents(events, d(9, 14), d(9, 21));
        expect(out.map((o) => o.key)).toEqual(['d', 'a', 'b']);
        expect(out[2]!.end).toEqual(d(9, 16));
        const later = expandEvents(events, d(9, 21), d(9, 28));
        expect(later.map((o) => o.key)).toEqual([`c@${d(9, 22, 9).getTime()}`]);
        expect(later[0]!.end).toEqual(d(9, 22, 10));
        expect(later[0]!.recurring).toBe(true);
    });

    it('treats a midnight end of an all-day event as exclusive', () => {
        const [o] = expandEvents([{ start: '2026-09-14', end: '2026-09-16', allDay: true }], d(9, 1), d(10, 1));
        expect(o!.end).toEqual(d(9, 16));
        const [p] = expandEvents([{ start: d(9, 14, 10), end: d(9, 15, 10), allDay: true }], d(9, 1), d(10, 1));
        expect(p!.end).toEqual(d(9, 16));
    });
});

describe('layouts', () => {
    const range = (x: { s: Date; e: Date }) => ({ start: x.s, end: x.e });

    it('puts overlapping timed events side by side, widening where it can', () => {
        const a = { s: d(9, 14, 9), e: d(9, 14, 11) };
        const b = { s: d(9, 14, 9, 30), e: d(9, 14, 10) };
        const c = { s: d(9, 14, 10, 30), e: d(9, 14, 11, 30) };
        const e = { s: d(9, 14, 13), e: d(9, 14, 14) };
        const out = layoutTimedEvents([a, b, c, e], range, d(9, 14, 8), d(9, 14, 16));
        const by = (x: object) => out.find((p) => p.item === x)!;
        expect(by(a)).toMatchObject({ column: 0, columns: 2, span: 1, top: 1 / 8, height: 2 / 8 });
        expect(by(b)).toMatchObject({ column: 1, columns: 2, span: 1 });
        expect(by(c)).toMatchObject({ column: 1, columns: 2, span: 1 });
        expect(by(e)).toMatchObject({ column: 0, columns: 1, span: 1 });
        const lone = layoutTimedEvents([a, { s: d(9, 14, 9), e: d(9, 14, 9, 30) }, { s: d(9, 14, 9, 30), e: d(9, 14, 10) }], range, d(9, 14, 8), d(9, 14, 16));
        expect(lone.map((p) => [p.column, p.span])).toEqual([
            [0, 1],
            [1, 1],
            [1, 1]
        ]);
    });

    it('clips to the visible hours and gives short events a minimum height', () => {
        const [p] = layoutTimedEvents([{ s: d(9, 14, 7), e: d(9, 14, 9) }], range, d(9, 14, 8), d(9, 14, 16));
        expect(p).toMatchObject({ top: 0, height: 1 / 8, clippedStart: true, clippedEnd: false });
        const [q] = layoutTimedEvents([{ s: d(9, 14, 9), e: d(9, 14, 9, 5) }], range, d(9, 14, 8), d(9, 14, 16), 30);
        expect(q!.height).toBeCloseTo(0.5 / 8);
    });

    it('packs day spans into rows, longest first, marking what runs past the week', () => {
        const long = { s: d(9, 12), e: d(9, 16) };
        const one = { s: d(9, 14), e: d(9, 15) };
        const other = { s: d(9, 16, 9), e: d(9, 16, 10) };
        const out = layoutDaySpans([one, long, other], range, d(9, 13), 7);
        expect(out.find((p) => p.item === long)).toMatchObject({ first: 0, last: 2, row: 0, continuesBefore: true, continuesAfter: false });
        expect(out.find((p) => p.item === one)).toMatchObject({ first: 1, last: 1, row: 1 });
        expect(out.find((p) => p.item === other)).toMatchObject({ first: 3, last: 3, row: 0 });
    });

    it('packs a timeline row into lanes', () => {
        const out = layoutLanes(
            [
                { s: d(9, 14, 8), e: d(9, 14, 10) },
                { s: d(9, 14, 9), e: d(9, 14, 11) },
                { s: d(9, 14, 10), e: d(9, 14, 12) }
            ],
            range,
            d(9, 14),
            d(9, 15)
        );
        expect(out.map((p) => p.lane)).toEqual([0, 1, 0]);
        expect(out[0]!.left).toBeCloseTo(8 / 24);
        expect(out[0]!.width).toBeCloseTo(2 / 24);
    });

    it('knows business hours and where now is', () => {
        expect(isBusinessTime(d(9, 14, 9), d(9, 14, 9, 30), {})).toBe(true);
        expect(isBusinessTime(d(9, 14, 8, 30), d(9, 14, 9), {})).toBe(false);
        expect(isBusinessTime(d(9, 13, 10), d(9, 13, 11), {})).toBe(false);
        expect(isBusinessTime(d(9, 13, 10), d(9, 13, 11), false)).toBe(true);
        expect(fractionOf(d(9, 14, 12), d(9, 14), d(9, 15))).toBe(0.5);
        expect(fractionOf(d(9, 15, 12), d(9, 14), d(9, 15))).toBeNull();
    });

    it('moves the focused slot with the keys', () => {
        const bounds = { minMinutes: 8 * 60, maxMinutes: 18 * 60 };
        expect(timeGridKeyTarget(d(9, 14, 9), 'ArrowDown', 30, bounds)).toEqual(d(9, 14, 9, 30));
        expect(timeGridKeyTarget(d(9, 14, 8), 'ArrowUp', 30, bounds)).toEqual(d(9, 14, 8));
        expect(timeGridKeyTarget(d(9, 14, 9), 'ArrowRight', 30, bounds)).toEqual(d(9, 15, 9));
        expect(timeGridKeyTarget(d(9, 14, 9), 'End', 30, bounds)).toEqual(d(9, 14, 17, 30));
        expect(timeGridKeyTarget(d(9, 14, 17, 30), 'ArrowRight', 30, bounds, { horizontal: true })).toEqual(d(9, 15, 8));
        expect(timeGridKeyTarget(d(9, 14, 9), 'x', 30, bounds)).toBeNull();
    });
});
