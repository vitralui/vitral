import { addDays, isDateSelectable, isSameDay, startOfDay, type DateConstraints } from './calendar';

/**
 * A span of days, and the few rules a range picker needs: which way round it
 * goes, what is inside it, and what it would become if the day under the
 * pointer were chosen. No DOM here, and no notion of a calendar grid — a range
 * is two dates and the days between them.
 */

export interface DateRange {
    start: Date | null;
    end: Date | null;
}

export const emptyRange: DateRange = { start: null, end: null };

/** A range with its ends the right way round, and both at the start of their day. */
export function normalizeDateRange(range: DateRange): DateRange {
    const start = range.start ? startOfDay(range.start) : null;
    const end = range.end ? startOfDay(range.end) : null;
    if (start && end && end.getTime() < start.getTime()) return { start: end, end: start };
    return { start, end };
}

/** Whether the range has both ends. A range with only a start is being chosen, not chosen. */
export const isCompleteRange = (range: DateRange): boolean => !!range.start && !!range.end;

/** Whether a day falls within the range, ends included. */
export function isInRange(date: Date, range: DateRange): boolean {
    const { start, end } = normalizeDateRange(range);
    if (!start || !end) return false;
    const day = startOfDay(date).getTime();
    return day >= start.getTime() && day <= end.getTime();
}

/** Whether a day is one of the range's ends. */
export function isRangeEnd(date: Date, range: DateRange): 'start' | 'end' | null {
    const { start, end } = normalizeDateRange(range);
    if (start && isSameDay(date, start)) return 'start';
    if (end && isSameDay(date, end)) return 'end';
    return null;
}

/**
 * The range after pressing `date`. A press with nothing chosen, or with a
 * complete range, starts a new one; a press with only a start closes it. The
 * ends sort themselves, so dragging backwards works without thinking about it.
 */
export function pressRange(range: DateRange, date: Date): DateRange {
    const day = startOfDay(date);
    if (!range.start || isCompleteRange(range)) return { start: day, end: null };
    return normalizeDateRange({ start: range.start, end: day });
}

/**
 * What the range would look like with `date` as its other end: what to draw
 * while the pointer is over a day, or while the keyboard is moving with a start
 * already chosen. The range itself when there is nothing to preview.
 */
export function previewRange(range: DateRange, date: Date | null): DateRange {
    if (!date || !range.start || isCompleteRange(range)) return range;
    return normalizeDateRange({ start: range.start, end: date });
}

/** The days in a range, both ends included; empty while it is incomplete. */
export function rangeDays(range: DateRange): Date[] {
    const { start, end } = normalizeDateRange(range);
    if (!start || !end) return [];
    const days: Date[] = [];
    for (let day = start; day.getTime() <= end.getTime(); day = addDays(day, 1)) days.push(day);
    return days;
}

/** How many days the range covers, both ends included. Zero while it is incomplete. */
export function rangeLength(range: DateRange): number {
    const { start, end } = normalizeDateRange(range);
    if (!start || !end) return 0;
    return Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
}

/**
 * Whether every day in the range may be chosen. A range that steps over a
 * closed day is usually still legal — a holiday in the middle of a booking —
 * so this is for the callers that need it rather than a rule imposed here.
 */
export function isRangeSelectable(range: DateRange, constraints: DateConstraints = {}): boolean {
    return rangeDays(range).every((day) => isDateSelectable(day, constraints));
}
