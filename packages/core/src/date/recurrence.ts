import { addDays, daysInMonth, startOfDay } from './calendar';

/**
 * A practical subset of iCalendar's RRULE (RFC 5545): FREQ (DAILY, WEEKLY,
 * MONTHLY, YEARLY), INTERVAL, COUNT, UNTIL, BYDAY (with an ordinal such as
 * `2MO` or `-1FR` in monthly and yearly rules), BYMONTHDAY (negative counts
 * from the month's end), BYMONTH, WKST — plus EXDATE. Everything works on
 * local dates: an application that stores UTC converts before and after.
 */
export type RecurrenceFrequency = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY';

export interface RecurrenceWeekday {
    /** 0 = Sunday. */
    day: number;
    /** The nth such weekday of the month (or year); negative counts from the end. */
    nth?: number;
}

export interface RecurrenceRule {
    freq: RecurrenceFrequency;
    interval?: number;
    count?: number;
    /** Inclusive. */
    until?: Date;
    byDay?: RecurrenceWeekday[];
    byMonthDay?: number[];
    /** 1–12. */
    byMonth?: number[];
    /** The day a week starts on, for WEEKLY rules with an INTERVAL; 0 = Sunday. Defaults to Monday, as RFC 5545 does. */
    weekStart?: number;
}

const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

/** Reads `20260914`, `20260914T090000` or `20260914T090000Z` (the Z is read as local, see above). */
export function parseICalDate(text: string): Date | null {
    const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})?Z?)?$/.exec(text.trim());
    if (!m) return null;
    const [, y, mo, d, h = '0', mi = '0', s = '0'] = m;
    return new Date(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

const pad = (n: number) => String(n).padStart(2, '0');

export function formatICalDate(date: Date, withTime = true): string {
    const day = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
    return withTime ? `${day}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}` : day;
}

export interface ParsedRecurrence {
    rule: RecurrenceRule;
    /** From a `DTSTART:` line, when the text had one. */
    start?: Date;
    exdates: Date[];
}

/**
 * Reads an RRULE — `FREQ=WEEKLY;BYDAY=MO,WE`, with or without the `RRULE:`
 * prefix, optionally with `DTSTART:` and `EXDATE:` lines. Returns null when
 * there is no valid FREQ.
 */
export function parseRecurrence(text: string): ParsedRecurrence | null {
    let rule: RecurrenceRule | null = null;
    let start: Date | undefined;
    const exdates: Date[] = [];
    for (const raw of text.split(/\r?\n|(?=\bDTSTART[:;])|(?=\bEXDATE[:;])/)) {
        const line = raw.trim();
        if (!line) continue;
        const [head, value = ''] = splitOnce(line, ':');
        const name = value ? head.split(';')[0]!.toUpperCase() : 'RRULE';
        const body = value || head;
        if (name === 'DTSTART') start = parseICalDate(body) ?? undefined;
        else if (name === 'EXDATE') for (const part of body.split(',')) {
            const d = parseICalDate(part);
            if (d) exdates.push(d);
        }
        else if (name === 'RRULE') rule = parseRule(body);
    }
    return rule ? { rule, start, exdates } : null;
}

function splitOnce(text: string, sep: string): [string, string?] {
    const i = text.indexOf(sep);
    return i < 0 ? [text] : [text.slice(0, i), text.slice(i + 1)];
}

function parseRule(body: string): RecurrenceRule | null {
    const parts = Object.fromEntries(
        body
            .split(';')
            .map((p) => splitOnce(p, '='))
            .filter((p): p is [string, string] => p[1] !== undefined)
            .map(([k, v]) => [k.trim().toUpperCase(), v.trim()])
    );
    const freq = parts.FREQ?.toUpperCase();
    if (freq !== 'DAILY' && freq !== 'WEEKLY' && freq !== 'MONTHLY' && freq !== 'YEARLY') return null;
    const rule: RecurrenceRule = { freq };
    const int = (v: string | undefined) => (v !== undefined && /^-?\d+$/.test(v) ? Number(v) : undefined);
    if (int(parts.INTERVAL)) rule.interval = Math.max(1, int(parts.INTERVAL)!);
    if (int(parts.COUNT) !== undefined) rule.count = Math.max(0, int(parts.COUNT)!);
    if (parts.UNTIL) rule.until = parseICalDate(parts.UNTIL) ?? undefined;
    if (parts.BYDAY) {
        rule.byDay = parts.BYDAY.split(',')
            .map((code: string) => /^([+-]?\d{1,2})?(SU|MO|TU|WE|TH|FR|SA)$/i.exec(code.trim()))
            .filter((m: RegExpExecArray | null): m is RegExpExecArray => !!m)
            .map((m: RegExpExecArray) => (m[1] ? { day: DAY_CODES.indexOf(m[2]!.toUpperCase()), nth: Number(m[1]) } : { day: DAY_CODES.indexOf(m[2]!.toUpperCase()) }));
    }
    if (parts.BYMONTHDAY) rule.byMonthDay = parts.BYMONTHDAY.split(',').map(Number).filter((n: number) => Number.isInteger(n) && n !== 0);
    if (parts.BYMONTH) rule.byMonth = parts.BYMONTH.split(',').map(Number).filter((n: number) => n >= 1 && n <= 12);
    if (parts.WKST && DAY_CODES.includes(parts.WKST.toUpperCase())) rule.weekStart = DAY_CODES.indexOf(parts.WKST.toUpperCase());
    return rule;
}

/** The rule as RRULE text (no prefix) — what an editor writes back. */
export function formatRecurrence(rule: RecurrenceRule): string {
    const out = [`FREQ=${rule.freq}`];
    if (rule.interval && rule.interval > 1) out.push(`INTERVAL=${rule.interval}`);
    if (rule.count !== undefined) out.push(`COUNT=${rule.count}`);
    if (rule.until) out.push(`UNTIL=${formatICalDate(rule.until)}`);
    if (rule.byDay?.length) out.push(`BYDAY=${rule.byDay.map((d) => `${d.nth ?? ''}${DAY_CODES[d.day]}`).join(',')}`);
    if (rule.byMonthDay?.length) out.push(`BYMONTHDAY=${rule.byMonthDay.join(',')}`);
    if (rule.byMonth?.length) out.push(`BYMONTH=${rule.byMonth.join(',')}`);
    if (rule.weekStart !== undefined && rule.weekStart !== 1) out.push(`WKST=${DAY_CODES[rule.weekStart]}`);
    return out.join(';');
}

const withTime = (day: Date, time: Date) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());

/** The days in one month matching BYMONTHDAY/BYDAY, or `fallbackDay` when neither is given. */
function monthCandidates(year: number, month: number, rule: RecurrenceRule, fallbackDay: number): Date[] {
    const length = daysInMonth(year, month);
    const days = new Set<number>();
    const hasMonthDay = !!rule.byMonthDay?.length;
    const hasDay = !!rule.byDay?.length;
    if (!hasMonthDay && !hasDay) {
        if (fallbackDay <= length) days.add(fallbackDay);
    }
    const monthDays = hasMonthDay ? new Set(rule.byMonthDay!.map((d) => (d > 0 ? d : length + d + 1)).filter((d) => d >= 1 && d <= length)) : null;
    if (hasDay) {
        for (const { day, nth } of rule.byDay!) {
            const matches: number[] = [];
            for (let d = 1; d <= length; d++) if (new Date(year, month, d).getDay() === day) matches.push(d);
            const chosen = nth ? [matches[nth > 0 ? nth - 1 : matches.length + nth]].filter((d): d is number => d !== undefined) : matches;
            // BYMONTHDAY and BYDAY together narrow each other.
            for (const d of chosen) if (!monthDays || monthDays.has(d)) days.add(d);
        }
    } else if (monthDays) {
        monthDays.forEach((d) => days.add(d));
    }
    return [...days].sort((a, b) => a - b).map((d) => new Date(year, month, d));
}

/** The nth weekday of a whole year (`BYDAY=20MO` in a YEARLY rule with no BYMONTH). */
function yearCandidates(year: number, rule: RecurrenceRule, start: Date): Date[] {
    const out: Date[] = [];
    if (rule.byMonth?.length) {
        for (const m of [...rule.byMonth].sort((a, b) => a - b)) out.push(...monthCandidates(year, m - 1, rule, start.getDate()));
        return out;
    }
    if (rule.byDay?.some((d) => d.nth)) {
        for (const { day, nth } of rule.byDay) {
            const matches: Date[] = [];
            for (let d = new Date(year, 0, 1); d.getFullYear() === year; d = addDays(d, 1)) if (d.getDay() === day) matches.push(d);
            if (!nth) out.push(...matches);
            else {
                const hit = matches[nth > 0 ? nth - 1 : matches.length + nth];
                if (hit) out.push(hit);
            }
        }
        return out.sort((a, b) => a.getTime() - b.getTime());
    }
    if (rule.byDay?.length || rule.byMonthDay?.length) {
        for (let m = 0; m < 12; m++) out.push(...monthCandidates(year, m, rule, start.getDate()));
        return out;
    }
    return monthCandidates(year, start.getMonth(), rule, start.getDate());
}

export interface ExpandOptions {
    /** Occurrences starting before this are skipped (but still counted against COUNT). */
    from?: Date;
    /** Stop at occurrences starting at or after this. */
    to?: Date;
    exdates?: Date[];
    /** A hard stop against runaway rules. Defaults to 5000 occurrences. */
    limit?: number;
}

const sameInstant = (a: Date, b: Date) => a.getTime() === b.getTime();
const isDateOnly = (d: Date) => d.getHours() === 0 && d.getMinutes() === 0 && d.getSeconds() === 0 && d.getMilliseconds() === 0;
const sameDay = (a: Date, b: Date) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

/**
 * The start of every occurrence of `rule` beginning at `start`, in order. The
 * first occurrence is `start` itself when it matches the rule (as RFC 5545
 * has it), COUNT counts from there, and an EXDATE given as a bare date removes
 * every occurrence on that day.
 */
export function expandRecurrence(start: Date, rule: RecurrenceRule, options: ExpandOptions = {}): Date[] {
    const { from, to, exdates = [], limit = 5000 } = options;
    const interval = Math.max(1, rule.interval ?? 1);
    const out: Date[] = [];
    let produced = 0;
    const excluded = (d: Date) => exdates.some((x) => sameInstant(x, d) || (isDateOnly(x) && sameDay(x, d)));
    const accept = (day: Date): 'stop' | 'next' => {
        const at = withTime(day, start);
        if (at < start) return 'next';
        if (rule.until && at > rule.until) return 'stop';
        if (rule.count !== undefined && produced >= rule.count) return 'stop';
        if (to && at >= to) return 'stop';
        if (rule.byMonth?.length && rule.freq !== 'YEARLY' && !rule.byMonth.includes(at.getMonth() + 1)) return 'next';
        produced++;
        if (!excluded(at) && (!from || at >= from)) out.push(at);
        return out.length >= limit ? 'stop' : 'next';
    };

    const first = startOfDay(start);
    // A period that yields nothing (a 31st in a short month) must not end the
    // loop, but an endless run of them — a rule nothing can match — must.
    let idle = 0;
    for (let period = 0; idle < 1000; period++) {
        let candidates: Date[];
        switch (rule.freq) {
            case 'DAILY': {
                const day = addDays(first, period * interval);
                const ok = (!rule.byDay?.length || rule.byDay.some((d) => d.day === day.getDay())) && (!rule.byMonthDay?.length || monthCandidates(day.getFullYear(), day.getMonth(), { freq: 'MONTHLY', byMonthDay: rule.byMonthDay }, 0).some((c) => c.getDate() === day.getDate()));
                candidates = ok ? [day] : [];
                break;
            }
            case 'WEEKLY': {
                const weekStart = rule.weekStart ?? 1;
                const base = addDays(first, -((first.getDay() - weekStart + 7) % 7) + period * interval * 7);
                const days = rule.byDay?.length ? rule.byDay.map((d) => d.day) : [start.getDay()];
                candidates = [...new Set(days)].map((d) => addDays(base, (d - weekStart + 7) % 7)).sort((a, b) => a.getTime() - b.getTime());
                break;
            }
            case 'MONTHLY': {
                const month = new Date(first.getFullYear(), first.getMonth() + period * interval, 1);
                candidates = monthCandidates(month.getFullYear(), month.getMonth(), rule, start.getDate());
                break;
            }
            case 'YEARLY':
                candidates = yearCandidates(first.getFullYear() + period * interval, rule, start);
                break;
        }
        const before = produced;
        for (const day of candidates) if (accept(day) === 'stop') return out;
        idle = produced === before ? idle + 1 : 0;
    }
    return out;
}

/** Whether a rule never ends — no COUNT and no UNTIL. */
export function isInfiniteRecurrence(rule: RecurrenceRule): boolean {
    return rule.count === undefined && !rule.until;
}
