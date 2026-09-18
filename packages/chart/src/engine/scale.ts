/**
 * Scales. A 'nice' scale snaps its step to 1, 2 or 5 × 10ⁿ and widens its
 * ends onto the step: dividing 0–37 by five gives ticks at 0, 7.4, 14.8…,
 * which is arithmetic, where 0, 10, 20, 30, 40 is something a reader reads.
 */

export interface NiceScale {
    min: number;
    max: number;
    step: number;
    ticks: number[];
    /** Decimals the ticks need. */
    decimals: number;
}

/** The nice number nearest `value` (rounded), or the nice number at or above it. */
export function niceNumber(value: number, round: boolean): number {
    if (value <= 0 || !Number.isFinite(value)) return 0;
    const exponent = Math.floor(Math.log10(value));
    const fraction = value / 10 ** exponent;
    let nice: number;
    if (round) nice = fraction < 1.5 ? 1 : fraction < 3 ? 2 : fraction < 7 ? 5 : 10;
    else nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
    return nice * 10 ** exponent;
}

const decimalsOf = (step: number) => (step > 0 && step < 1 ? Math.min(20, Math.ceil(-Math.log10(step) - 1e-9)) : 0);
const clean = (n: number, decimals: number) => Number(n.toFixed(Math.min(20, decimals + 2))) || 0;

/**
 * A scale over `[low, high]` with about `targetTicks` intervals. Fixed ends
 * (`options.min`/`max`) are kept exactly; free ends are widened onto the step.
 * An empty or flat range still gets a usable scale around its value.
 */
export function niceScale(low: number, high: number, targetTicks = 5, options: { min?: number; max?: number; nice?: boolean } = {}): NiceScale {
    let lo = options.min ?? low;
    let hi = options.max ?? high;
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) {
        lo = 0;
        hi = 1;
    }
    if (lo > hi) [lo, hi] = [hi, lo];
    if (lo === hi) {
        const pad = lo === 0 ? 1 : Math.abs(lo) * 0.1;
        if (options.min === undefined) lo -= pad;
        if (options.max === undefined) hi += pad;
        if (lo === hi) hi = lo + 1;
    }
    const ticks = Math.max(1, Math.round(targetTicks));
    if (options.nice === false) {
        const step = (hi - lo) / ticks;
        const decimals = Math.max(decimalsOf(niceNumber(step, true)), 0);
        return { min: lo, max: hi, step, ticks: Array.from({ length: ticks + 1 }, (_, i) => clean(lo + i * step, decimals + 2)), decimals };
    }
    const range = niceNumber(hi - lo, false);
    const step = niceNumber(range / ticks, true);
    const decimals = decimalsOf(step);
    const min = options.min ?? Math.floor(lo / step) * step;
    const max = options.max ?? Math.ceil(hi / step) * step;
    const out: number[] = [];
    const first = Math.ceil(min / step - 1e-9) * step;
    for (let v = first, i = 0; v <= max + step * 1e-9 && i < 1000; v = first + ++i * step) out.push(clean(v, decimals));
    return { min: clean(min, decimals), max: clean(max, decimals), step, ticks: out, decimals };
}

/** Maps `[d0, d1]` onto `[r0, r1]`. */
export function linear(d0: number, d1: number, r0: number, r1: number) {
    const span = d1 - d0 || 1;
    const scale = (v: number) => r0 + ((v - d0) / span) * (r1 - r0);
    scale.invert = (p: number) => d0 + ((p - r0) / (r1 - r0 || 1)) * span;
    return scale;
}

export type TimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'month' | 'year';

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const INTERVALS: { unit: TimeUnit; count: number; ms: number }[] = [
    ...[1, 5, 15, 30].map((count) => ({ unit: 'second' as const, count, ms: count * SECOND })),
    ...[1, 5, 15, 30].map((count) => ({ unit: 'minute' as const, count, ms: count * MINUTE })),
    ...[1, 3, 6, 12].map((count) => ({ unit: 'hour' as const, count, ms: count * HOUR })),
    ...[1, 2, 7, 14].map((count) => ({ unit: 'day' as const, count, ms: count * DAY })),
    ...[1, 3, 6].map((count) => ({ unit: 'month' as const, count, ms: count * 30 * DAY })),
    { unit: 'year', count: 1, ms: 365 * DAY }
];

export interface TimeTick {
    value: number;
    /** The unit the tick falls on, for choosing its label's format. */
    unit: TimeUnit;
}

function floorTo(date: Date, unit: TimeUnit, count: number): Date {
    const d = new Date(date);
    switch (unit) {
        case 'second':
            d.setMilliseconds(0);
            d.setSeconds(Math.floor(d.getSeconds() / count) * count);
            break;
        case 'minute':
            d.setSeconds(0, 0);
            d.setMinutes(Math.floor(d.getMinutes() / count) * count);
            break;
        case 'hour':
            d.setMinutes(0, 0, 0);
            d.setHours(Math.floor(d.getHours() / count) * count);
            break;
        case 'day':
            d.setHours(0, 0, 0, 0);
            if (count === 7 || count === 14) d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
            break;
        case 'month':
            d.setHours(0, 0, 0, 0);
            d.setDate(1);
            d.setMonth(Math.floor(d.getMonth() / count) * count);
            break;
        case 'year': {
            d.setHours(0, 0, 0, 0);
            d.setMonth(0, 1);
            d.setFullYear(Math.floor(d.getFullYear() / count) * count);
            break;
        }
    }
    return d;
}

function step(date: Date, unit: TimeUnit, count: number): Date {
    const d = new Date(date);
    if (unit === 'second') d.setSeconds(d.getSeconds() + count);
    else if (unit === 'minute') d.setMinutes(d.getMinutes() + count);
    else if (unit === 'hour') d.setHours(d.getHours() + count);
    else if (unit === 'day') d.setDate(d.getDate() + count);
    else if (unit === 'month') d.setMonth(d.getMonth() + count);
    else d.setFullYear(d.getFullYear() + count);
    return d;
}

/** The coarsest unit at which a tick sits on a boundary: a tick at midnight on the 1st is a 'month' tick. */
function unitOf(d: Date, finest: TimeUnit): TimeUnit {
    const order: TimeUnit[] = ['second', 'minute', 'hour', 'day', 'month', 'year'];
    let unit = finest;
    for (let i = order.indexOf(finest) + 1; i < order.length; i++) {
        const u = order[i]!;
        const on =
            (u === 'minute' && d.getSeconds() === 0) ||
            (u === 'hour' && d.getSeconds() === 0 && d.getMinutes() === 0) ||
            (u === 'day' && d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0) ||
            (u === 'month' && d.getDate() === 1 && d.getHours() === 0 && d.getMinutes() === 0) ||
            (u === 'year' && d.getMonth() === 0 && d.getDate() === 1 && d.getHours() === 0 && d.getMinutes() === 0);
        if (!on) break;
        unit = u;
    }
    return unit;
}

/**
 * Ticks on calendar boundaries over `[from, to]` (milliseconds), about
 * `targetTicks` of them: whole hours, midnights, firsts of the month, not
 * every 3.7 days. Each tick names the coarsest boundary it is on, so a label
 * can show the month at a month's start and the day elsewhere.
 */
export function timeTicks(from: number, to: number, targetTicks = 6): TimeTick[] {
    if (!(to > from)) return [];
    const wanted = (to - from) / Math.max(1, targetTicks);
    const interval = INTERVALS.find((i) => i.ms >= wanted) ?? { unit: 'year' as const, count: Math.max(1, Math.ceil(wanted / (365 * DAY))), ms: wanted };
    let count = interval.count;
    if (interval.unit === 'year' && interval.ms < wanted) count = niceNumber(wanted / (365 * DAY), false);
    const out: TimeTick[] = [];
    let d = floorTo(new Date(from), interval.unit, count);
    if (d.getTime() < from) d = step(d, interval.unit, count);
    for (let i = 0; d.getTime() <= to && i < 500; i++) {
        out.push({ value: d.getTime(), unit: unitOf(d, interval.unit) });
        d = step(d, interval.unit, count);
    }
    return out;
}
