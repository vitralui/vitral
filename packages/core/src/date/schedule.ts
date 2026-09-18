import { addDays, addMonths, isSameDay, startOfDay } from './calendar';
import { startOfWeek } from './datepicker';
import { expandRecurrence, parseRecurrence, type RecurrenceRule } from './recurrence';

/**
 * The arithmetic behind a scheduler: which range a view shows, where an event
 * sits in it, how overlapping events share a column, how multi-day events
 * stack in a week, and how recurring events unfold. Dates are local `Date`s
 * throughout; time zones are the application's business.
 */

export type ScheduleView = 'month' | 'week' | 'day' | 'agenda' | 'timeline';

export interface ScheduleEventLike {
    id?: string | number;
    start: Date | string;
    end?: Date | string | null;
    allDay?: boolean;
    resourceId?: string | number | null;
    /** An RRULE (`FREQ=WEEKLY;BYDAY=MO`), or the rule as an object. */
    recurrence?: string | RecurrenceRule | null;
    /** Occurrences to leave out, by start (or by day, for a bare date). */
    exdate?: (Date | string)[];
}

export interface ScheduleOccurrence<E extends ScheduleEventLike = ScheduleEventLike> {
    event: E;
    /** Unique per occurrence: the event's id, plus the start for a recurring one. */
    key: string;
    start: Date;
    /** Exclusive. */
    end: Date;
    allDay: boolean;
    resourceId?: string | number | null;
    recurring: boolean;
    /** The event's position in the input. */
    index: number;
}

const MINUTE = 60_000;
const DAY = 86_400_000;

export function toDate(value: Date | string | null | undefined): Date | null {
    if (value === null || value === undefined || value === '') return null;
    const date = value instanceof Date ? new Date(value) : /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
}

/** Minutes since midnight from `'08:30'`; `'24:00'` is 1440. */
export function parseTime(value: string | number | undefined, fallback = 0): number {
    if (typeof value === 'number') return value;
    const m = /^(\d{1,2}):(\d{2})/.exec(value ?? '');
    return m ? Number(m[1]) * 60 + Number(m[2]) : fallback;
}

export function minutesOfDay(date: Date): number {
    return date.getHours() * 60 + date.getMinutes() + date.getSeconds() / 60;
}

export function atMinutes(day: Date, minutes: number): Date {
    const d = startOfDay(day);
    d.setMinutes(Math.round(minutes));
    return d;
}

/** Rounds to the nearest `step` minutes. */
export function snapMinutes(minutes: number, step: number): number {
    return step > 0 ? Math.round(minutes / step) * step : minutes;
}

/** Whole calendar days from `a` to `b`, immune to daylight-saving shifts. */
export function dayDiff(a: Date, b: Date): number {
    return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY);
}

export function addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * MINUTE);
}

/** Moves a date by whole days, keeping its wall-clock time across a daylight-saving change. */
export function shiftDays(date: Date, days: number): Date {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

/** The half-open range `[start, end)` a view shows around `date`. */
export function viewRange(view: ScheduleView, date: Date, options: { firstDayOfWeek?: number; days?: number } = {}): { start: Date; end: Date } {
    const { firstDayOfWeek = 0, days } = options;
    const day = startOfDay(date);
    switch (view) {
        case 'month': {
            const first = new Date(day.getFullYear(), day.getMonth(), 1);
            const start = startOfWeek(first, firstDayOfWeek);
            return { start, end: addDays(start, 42) };
        }
        case 'week': {
            const start = startOfWeek(day, firstDayOfWeek);
            return { start, end: addDays(start, days ?? 7) };
        }
        case 'day':
        case 'timeline':
            return { start: day, end: addDays(day, days ?? 1) };
        case 'agenda':
            return { start: day, end: addDays(day, days ?? 7) };
    }
}

/** The date a view lands on after paging once forward (1) or back (-1). */
export function stepViewDate(view: ScheduleView, date: Date, step: number, options: { days?: number } = {}): Date {
    switch (view) {
        case 'month':
            return addMonths(new Date(date.getFullYear(), date.getMonth(), 1), step);
        case 'week':
            return addDays(startOfDay(date), step * (options.days ?? 7));
        case 'day':
        case 'timeline':
            return addDays(startOfDay(date), step * (options.days ?? 1));
        case 'agenda':
            return addDays(startOfDay(date), step * (options.days ?? 7));
    }
}

function ruleOf(event: ScheduleEventLike): { rule: RecurrenceRule; exdates: Date[] } | null {
    const exdates = (event.exdate ?? []).map((d) => toDate(d)).filter((d): d is Date => !!d);
    if (!event.recurrence) return null;
    if (typeof event.recurrence !== 'string') return { rule: event.recurrence, exdates };
    const parsed = parseRecurrence(event.recurrence);
    return parsed ? { rule: parsed.rule, exdates: [...exdates, ...parsed.exdates] } : null;
}

/**
 * Every occurrence that overlaps `[from, to)`, sorted by start (all-day first
 * on a tie, then longer first). An event with no end lasts a day when all-day
 * and `defaultMinutes` otherwise; an all-day event's end is exclusive and
 * snapped to midnight.
 */
export function expandEvents<E extends ScheduleEventLike>(events: readonly E[], from: Date, to: Date, defaultMinutes = 60): ScheduleOccurrence<E>[] {
    const out: ScheduleOccurrence<E>[] = [];
    events.forEach((event, index) => {
        const rawStart = toDate(event.start);
        if (!rawStart) return;
        const allDay = !!event.allDay;
        const start = allDay ? startOfDay(rawStart) : rawStart;
        let end = toDate(event.end);
        if (allDay && end) end = end.getTime() === startOfDay(end).getTime() ? end : addDays(startOfDay(end), 1);
        if (!end || end <= start) end = allDay ? addDays(start, 1) : addMinutes(start, defaultMinutes);
        const duration = end.getTime() - start.getTime();
        const days = allDay ? dayDiff(start, end) : 0;
        const id = String(event.id ?? index);
        const recurrence = ruleOf(event);
        const push = (s: Date, recurring: boolean) => {
            const e = allDay ? addDays(s, days) : new Date(s.getTime() + duration);
            if (e > from && s < to) out.push({ event, key: recurring ? `${id}@${s.getTime()}` : id, start: s, end: e, allDay, resourceId: event.resourceId, recurring, index });
        };
        if (!recurrence) return push(start, false);
        // Start early enough to catch an occurrence that began before `from` and is still running.
        const lookBack = new Date(from.getTime() - duration);
        for (const s of expandRecurrence(start, recurrence.rule, { from: lookBack, to, exdates: recurrence.exdates })) push(s, true);
    });
    return out.sort(compareOccurrences);
}

export function compareOccurrences(a: ScheduleOccurrence, b: ScheduleOccurrence): number {
    return (
        a.start.getTime() - b.start.getTime() ||
        Number(b.allDay) - Number(a.allDay) ||
        b.end.getTime() - b.start.getTime() - (a.end.getTime() - a.start.getTime()) ||
        a.index - b.index
    );
}

export interface TimedPlacement<T> {
    item: T;
    /** Fractions of the visible time span. */
    top: number;
    height: number;
    /** The column inside its cluster, and how many columns the cluster has. */
    column: number;
    columns: number;
    /** How many columns it may stretch over to its right without covering another event. */
    span: number;
    /** It starts before the visible span, or ends after it. */
    clippedStart: boolean;
    clippedEnd: boolean;
}

/**
 * Lays out timed events in one day column: overlapping events share the width
 * side by side. Events are clustered by overlap, each takes the first column
 * free at its start, and then widens to the right over columns that stay free
 * for its whole length. `from`/`to` are the column's visible bounds.
 */
export function layoutTimedEvents<T>(items: readonly T[], range: (item: T) => { start: Date; end: Date }, from: Date, to: Date, minMinutes = 0): TimedPlacement<T>[] {
    const total = to.getTime() - from.getTime();
    if (total <= 0) return [];
    const rows = items
        .map((item) => {
            const r = range(item);
            const s = Math.max(r.start.getTime(), from.getTime());
            // A very short event still gets a readable height, and overlaps as tall as it is drawn.
            const e = Math.min(Math.max(r.end.getTime(), s + minMinutes * MINUTE), to.getTime());
            return { item, s, e, clippedStart: r.start < from, clippedEnd: r.end > to };
        })
        .filter((r) => r.e > r.s)
        .sort((a, b) => a.s - b.s || b.e - a.e);

    const out: TimedPlacement<T>[] = [];
    let cluster: { row: (typeof rows)[number]; column: number }[] = [];
    let columnsEnd: number[] = [];
    let clusterEnd = -Infinity;

    const flush = () => {
        const columns = columnsEnd.length;
        for (const { row, column } of cluster) {
            let span = 1;
            for (let c = column + 1; c < columns; c++) {
                const blocked = cluster.some((o) => o.column === c && o.row.s < row.e && o.row.e > row.s);
                if (blocked) break;
                span++;
            }
            out.push({
                item: row.item,
                top: (row.s - from.getTime()) / total,
                height: (row.e - row.s) / total,
                column,
                columns,
                span,
                clippedStart: row.clippedStart,
                clippedEnd: row.clippedEnd
            });
        }
        cluster = [];
        columnsEnd = [];
    };

    for (const row of rows) {
        if (row.s >= clusterEnd && cluster.length) flush();
        let column = columnsEnd.findIndex((end) => end <= row.s);
        if (column < 0) {
            column = columnsEnd.length;
            columnsEnd.push(row.e);
        } else columnsEnd[column] = row.e;
        cluster.push({ row, column });
        clusterEnd = cluster.length === 1 ? row.e : Math.max(clusterEnd, row.e);
    }
    if (cluster.length) flush();
    return out;
}

export interface SpanPlacement<T> {
    item: T;
    /** The first and last day index it covers, within `[0, days)`. */
    first: number;
    last: number;
    /** Its row, from the top. */
    row: number;
    /** It carries on before the first day, or after the last. */
    continuesBefore: boolean;
    continuesAfter: boolean;
}

/**
 * Packs events that cover whole days (all-day events, and every event in a
 * month's week) into rows over `days` days starting at `start`, so no two in
 * a row overlap. Longer events are placed first, as calendars do, so they run
 * along the top.
 */
export function layoutDaySpans<T>(items: readonly T[], range: (item: T) => { start: Date; end: Date }, start: Date, days: number): SpanPlacement<T>[] {
    const origin = startOfDay(start);
    const placed = items
        .map((item) => {
            const r = range(item);
            const firstDay = dayDiff(origin, r.start);
            // The end is exclusive: an event ending at midnight does not touch that day.
            const endDay = startOfDay(r.end).getTime() === r.end.getTime() ? dayDiff(origin, r.end) - 1 : dayDiff(origin, r.end);
            const lastDay = Math.max(firstDay, endDay);
            return { item, firstDay, lastDay, first: Math.max(0, firstDay), last: Math.min(days - 1, lastDay), s: r.start.getTime() };
        })
        .filter((p) => p.last >= 0 && p.first <= days - 1 && p.first <= p.last)
        .sort((a, b) => a.first - b.first || b.last - b.first - (a.last - a.first) || a.s - b.s);
    const rows: boolean[][] = [];
    return placed.map((p) => {
        let row = 0;
        for (; ; row++) {
            rows[row] ??= [];
            let free = true;
            for (let d = p.first; d <= p.last; d++) if (rows[row]![d]) free = false;
            if (free) break;
        }
        for (let d = p.first; d <= p.last; d++) rows[row]![d] = true;
        return { item: p.item, first: p.first, last: p.last, row, continuesBefore: p.firstDay < 0, continuesAfter: p.lastDay > days - 1 };
    });
}

export interface LanePlacement<T> {
    item: T;
    /** Fractions of the visible span. */
    left: number;
    width: number;
    lane: number;
    clippedStart: boolean;
    clippedEnd: boolean;
}

/** Packs events into lanes along a time axis: a resource's row in a timeline. */
export function layoutLanes<T>(items: readonly T[], range: (item: T) => { start: Date; end: Date }, from: Date, to: Date): LanePlacement<T>[] {
    const total = to.getTime() - from.getTime();
    if (total <= 0) return [];
    const ends: number[] = [];
    return items
        .map((item) => ({ item, r: range(item) }))
        .filter(({ r }) => r.end > from && r.start < to)
        .sort((a, b) => a.r.start.getTime() - b.r.start.getTime() || b.r.end.getTime() - a.r.end.getTime())
        .map(({ item, r }) => {
            const s = Math.max(r.start.getTime(), from.getTime());
            const e = Math.min(r.end.getTime(), to.getTime());
            let lane = ends.findIndex((end) => end <= s);
            if (lane < 0) lane = ends.push(e) - 1;
            else ends[lane] = e;
            return { item, left: (s - from.getTime()) / total, width: (e - s) / total, lane, clippedStart: r.start < from, clippedEnd: r.end > to };
        });
}

export interface BusinessHours {
    /** 0 = Sunday. Defaults to Monday to Friday. */
    daysOfWeek?: number[];
    /** `'09:00'` */
    startTime?: string;
    endTime?: string;
}

/** Whether `[start, end)` lies inside business hours. */
export function isBusinessTime(start: Date, end: Date, hours: BusinessHours | BusinessHours[] | false | null | undefined): boolean {
    if (!hours) return true;
    const list = Array.isArray(hours) ? hours : [hours];
    return list.some((h) => {
        const days = h.daysOfWeek ?? [1, 2, 3, 4, 5];
        if (!days.includes(start.getDay())) return false;
        const from = parseTime(h.startTime, 9 * 60);
        const to = parseTime(h.endTime, 17 * 60);
        const s = minutesOfDay(start);
        const e = isSameDay(start, end) ? minutesOfDay(end) : 24 * 60;
        return s >= from && e <= to;
    });
}

/** The fraction of `[from, to)` that `at` is at, or null outside it. For a "now" line. */
export function fractionOf(at: Date, from: Date, to: Date): number | null {
    const total = to.getTime() - from.getTime();
    if (total <= 0 || at < from || at >= to) return null;
    return (at.getTime() - from.getTime()) / total;
}

/**
 * Where a key moves the focused slot of a time grid (days across, slots down)
 * or a timeline (slots across): Up/Down by a slot, Left/Right by a day,
 * Home/End to the first and last slot of the day. Returns null for other keys.
 */
export function timeGridKeyTarget(at: Date, key: string, slotMinutes: number, bounds: { minMinutes: number; maxMinutes: number }, options: { horizontal?: boolean; rtl?: boolean } = {}): Date | null {
    const minutes = minutesOfDay(at);
    const lastSlot = bounds.maxMinutes - slotMinutes;
    let k = key;
    if (options.rtl && (k === 'ArrowLeft' || k === 'ArrowRight')) k = k === 'ArrowLeft' ? 'ArrowRight' : 'ArrowLeft';
    if (options.horizontal) {
        // A timeline runs time across, so Left/Right step slots and wrap into the neighbouring day.
        if (k === 'ArrowLeft') return minutes - slotMinutes < bounds.minMinutes ? atMinutes(addDays(at, -1), lastSlot) : addMinutes(at, -slotMinutes);
        if (k === 'ArrowRight') return minutes + slotMinutes > lastSlot ? atMinutes(addDays(at, 1), bounds.minMinutes) : addMinutes(at, slotMinutes);
    } else {
        if (k === 'ArrowUp') return minutes - slotMinutes < bounds.minMinutes ? at : addMinutes(at, -slotMinutes);
        if (k === 'ArrowDown') return minutes + slotMinutes > lastSlot ? at : addMinutes(at, slotMinutes);
        if (k === 'ArrowLeft') return shiftDays(at, -1);
        if (k === 'ArrowRight') return shiftDays(at, 1);
    }
    if (k === 'Home') return atMinutes(at, bounds.minMinutes);
    if (k === 'End') return atMinutes(at, lastSlot);
    return null;
}

const timeFormats = new Map<string, Intl.DateTimeFormat>();

/** A time of day in the locale's own style: `9:30 AM`, `09:30`. `hour12` overrides the locale's choice. */
export function formatTime(date: Date, locale?: string, hour12?: boolean): string {
    const key = `${locale ?? ''}|${hour12 ?? ''}`;
    let format = timeFormats.get(key);
    if (!format) {
        // A 24-hour clock reads best with two-digit hours (09:00); a 12-hour one without (9:00 AM).
        const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric', hour12 }).resolvedOptions().hourCycle;
        const hour = cycle === 'h23' || cycle === 'h24' ? '2-digit' : 'numeric';
        timeFormats.set(key, (format = new Intl.DateTimeFormat(locale, { hour, minute: '2-digit', hour12 })));
    }
    return format.format(date);
}
