/**
 * Times of day as minutes past midnight.
 *
 * A time picker is not a small calendar: it has no month to page through and
 * no zone to argue with — it is a number between 0 and 1439 and the words a
 * locale puts around it. Keeping it that way is what makes the list, the
 * clamping and the keyboard all one line each.
 */

export const MINUTES_IN_DAY = 1440;

/** Minutes past midnight, from a `Date`'s own clock. */
export const minutesOf = (date: Date): number => date.getHours() * 60 + date.getMinutes();

/** The same day with its clock set to `minutes`. */
export function atMinutesOfDay(day: Date, minutes: number): Date {
    const out = new Date(day);
    out.setHours(Math.floor(minutes / 60), minutes % 60, 0, 0);
    return out;
}

/** Inside the day, and inside `min`/`max` when they are given. */
export function clampMinutes(minutes: number, min?: number | null, max?: number | null): number {
    let value = Math.max(0, Math.min(MINUTES_IN_DAY - 1, Math.round(minutes)));
    if (min !== null && min !== undefined) value = Math.max(value, min);
    if (max !== null && max !== undefined) value = Math.min(value, max);
    return value;
}

/** Whether the locale writes the time with AM and PM rather than to twenty-four. */
export function usesHour12(locale?: string): boolean {
    const cycle = new Intl.DateTimeFormat(locale, { hour: 'numeric' }).resolvedOptions().hourCycle;
    return cycle === 'h11' || cycle === 'h12';
}

const formatters = new Map<string, Intl.DateTimeFormat>();

/**
 * Minutes as the words a reader expects: `9:30 AM`, `09:30`, `21:30:00`.
 * `hour12` overrides what the locale would have chosen.
 */
export function formatMinutes(minutes: number, options: { locale?: string; hour12?: boolean; seconds?: boolean } = {}): string {
    const { locale, hour12, seconds } = options;
    const key = `${locale ?? ''}|${hour12 ?? ''}|${seconds ? 's' : ''}`;
    let format = formatters.get(key);
    if (!format) {
        const twelve = hour12 ?? usesHour12(locale);
        format = new Intl.DateTimeFormat(locale, {
            hour: twelve ? 'numeric' : '2-digit',
            minute: '2-digit',
            second: seconds ? '2-digit' : undefined,
            hour12: twelve
        });
        formatters.set(key, format);
    }
    return format.format(atMinutesOfDay(new Date(2000, 0, 1), clampMinutes(minutes)));
}

/**
 * What someone typed, as minutes, or null when it is not a time.
 *
 * It is deliberately forgiving, because a time box is a place people type
 * rather than choose: `9`, `930`, `9:3`, `9.30`, `9h30`, `21:30`, `9 pm` and
 * `9:30PM` all land where they were meant to. What it will not do is guess at
 * something that names no hour at all.
 */
export function parseMinutes(text: string, hour12?: boolean): number | null {
    const raw = text.trim().toLowerCase();
    if (!raw) return null;
    const pm = /p\.?\s*m\.?/.test(raw);
    const am = /a\.?\s*m\.?/.test(raw);
    const digits = raw.replace(/[^\d:.h]/g, '');
    if (!digits) return null;

    let hours: number;
    let mins = 0;
    const parts = digits.split(/[:.h]/).filter((p) => p !== '');
    if (parts.length >= 2) {
        hours = Number(parts[0]);
        mins = Number(parts[1]!.slice(0, 2).padEnd(2, '0'));
    } else {
        const only = parts[0]!;
        // `930` is half past nine; `9` is nine o'clock.
        if (only.length >= 3) {
            hours = Number(only.slice(0, only.length - 2));
            mins = Number(only.slice(-2));
        } else {
            hours = Number(only);
        }
    }
    if (!Number.isFinite(hours) || !Number.isFinite(mins) || mins > 59) return null;

    if (pm || am) {
        if (hours > 12) return null;
        hours = hours % 12;
        if (pm) hours += 12;
    } else if (hour12 && hours === 24) {
        return null;
    }
    if (hours > 23) return hours === 24 && mins === 0 ? MINUTES_IN_DAY - 1 : null;
    return hours * 60 + mins;
}

export interface TimeOption {
    minutes: number;
    label: string;
}

/**
 * The times a list offers: every `step` minutes between `min` and `max`. The
 * list is what most people use, so it is built from the same numbers the
 * keyboard and the text box work in and can never disagree with them.
 */
export function timeOptions(options: { step?: number; min?: number | null; max?: number | null; locale?: string; hour12?: boolean; seconds?: boolean } = {}): TimeOption[] {
    const step = Math.max(1, Math.round(options.step ?? 30));
    const from = clampMinutes(options.min ?? 0);
    const to = clampMinutes(options.max ?? MINUTES_IN_DAY - 1);
    const out: TimeOption[] = [];
    for (let m = from; m <= to; m += step) out.push({ minutes: m, label: formatMinutes(m, options) });
    return out;
}

/** The option a value belongs to: the last one at or before it, for the list to mark. */
export function nearestOption(options: readonly TimeOption[], minutes: number | null): number {
    if (minutes === null) return -1;
    let found = -1;
    for (let i = 0; i < options.length; i++) if (options[i]!.minutes <= minutes) found = i;
    return found;
}

/** Where a key takes the time: one step, or an hour with Page Up and Page Down. */
export function timeKeyTarget(minutes: number, key: string, step: number, bounds: { min?: number | null; max?: number | null } = {}): number | null {
    const move = (by: number) => clampMinutes(minutes + by, bounds.min, bounds.max);
    switch (key) {
        case 'ArrowUp':
            return move(step);
        case 'ArrowDown':
            return move(-step);
        case 'PageUp':
            return move(60);
        case 'PageDown':
            return move(-60);
        case 'Home':
            return clampMinutes(bounds.min ?? 0, bounds.min, bounds.max);
        case 'End':
            return clampMinutes(bounds.max ?? MINUTES_IN_DAY - 1, bounds.min, bounds.max);
        default:
            return null;
    }
}
