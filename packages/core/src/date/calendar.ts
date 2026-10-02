export interface CalendarDay {
    date: Date;
    day: number;
    month: number;
    year: number;
    /** Belongs to the previous or next month, shown to fill the grid. */
    otherMonth: boolean;
    today: boolean;
}

export interface DateConstraints {
    min?: Date | null;
    max?: Date | null;
    disabledDates?: Date[];
    /** Days of the week, 0 = Sunday. */
    disabledDays?: number[];
}

export interface DateNames {
    monthNames: string[];
    monthNamesShort: string[];
    dayNames: string[];
    dayNamesShort: string[];
}

export function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
    return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function daysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

export function addDays(date: Date, days: number): Date {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
}

/** Adds months, clamping the day so 31 January plus one month is 28/29 February rather than early March. */
export function addMonths(date: Date, months: number): Date {
    const target = new Date(date.getFullYear(), date.getMonth() + months, 1, date.getHours(), date.getMinutes(), date.getSeconds());
    target.setDate(Math.min(date.getDate(), daysInMonth(target.getFullYear(), target.getMonth())));
    return target;
}

/** Weekday indices in display order, starting at `firstDayOfWeek`. */
export function weekdayOrder(firstDayOfWeek = 0): number[] {
    return Array.from({ length: 7 }, (_, i) => (firstDayOfWeek + i) % 7);
}

/**
 * The month as six weeks of seven days. Always six, so the calendar keeps its
 * height as the reader pages through months. A popup that resizes under the
 * pointer moves the next button away from the cursor.
 */
export function monthGrid(year: number, month: number, firstDayOfWeek = 0, today: Date = new Date()): CalendarDay[][] {
    const first = new Date(year, month, 1);
    const offset = (first.getDay() - firstDayOfWeek + 7) % 7;
    const start = addDays(first, -offset);
    const weeks: CalendarDay[][] = [];
    for (let w = 0; w < 6; w++) {
        const week: CalendarDay[] = [];
        for (let d = 0; d < 7; d++) {
            const date = addDays(start, w * 7 + d);
            week.push({ date, day: date.getDate(), month: date.getMonth(), year: date.getFullYear(), otherMonth: date.getMonth() !== month, today: isSameDay(date, today) });
        }
        weeks.push(week);
    }
    return weeks;
}

export function isDateSelectable(date: Date, constraints: DateConstraints = {}): boolean {
    const day = startOfDay(date);
    if (constraints.min && day < startOfDay(constraints.min)) return false;
    if (constraints.max && day > startOfDay(constraints.max)) return false;
    if (constraints.disabledDays?.includes(day.getDay())) return false;
    if (constraints.disabledDates?.some((d) => isSameDay(d, day))) return false;
    return true;
}

const TOKENS = /yyyy|yy|MMMM|MMM|MM|M|dd|d|EEEE|EEE|HH|H|mm|ss|'[^']*'/g;

const pad = (n: number) => String(n).padStart(2, '0');

/**
 * Formats with `yyyy yy MMMM MMM MM M dd d EEEE EEE`, and the 24-hour clock's
 * `HH H mm ss`; text in single quotes is literal. Month and day names come from the locale, so `dd 'de' MMMM` reads
 * "05 de março" under pt-BR.
 */
export function formatDate(date: Date | null | undefined, pattern: string, names: DateNames): string {
    if (!date || Number.isNaN(date.getTime())) return '';
    return pattern.replace(TOKENS, (token) => {
        switch (token) {
            case 'yyyy': return String(date.getFullYear());
            case 'yy': return pad(date.getFullYear() % 100);
            case 'MMMM': return names.monthNames[date.getMonth()] ?? '';
            case 'MMM': return names.monthNamesShort[date.getMonth()] ?? '';
            case 'MM': return pad(date.getMonth() + 1);
            case 'M': return String(date.getMonth() + 1);
            case 'dd': return pad(date.getDate());
            case 'd': return String(date.getDate());
            case 'EEEE': return names.dayNames[date.getDay()] ?? '';
            case 'EEE': return names.dayNamesShort[date.getDay()] ?? '';
            case 'HH': return pad(date.getHours());
            case 'H': return String(date.getHours());
            case 'mm': return pad(date.getMinutes());
            case 'ss': return pad(date.getSeconds());
            default: return token.slice(1, -1);
        }
    });
}

/**
 * Reads what a person typed against the numeric tokens of a pattern
 * (`yyyy yy MM M dd d`). Returns null for anything that is not a real date, so
 * 31/02 is refused rather than rolled into March.
 */
export function parseDate(text: string, pattern: string): Date | null {
    const order: string[] = [];
    let source = '';
    let last = 0;
    for (const match of pattern.matchAll(TOKENS)) {
        source += escape(pattern.slice(last, match.index));
        const token = match[0];
        if (token.startsWith("'")) source += escape(token.slice(1, -1));
        else if (token === 'yyyy') (order.push('y'), (source += '(\\d{4})'));
        else if (token === 'yy') (order.push('yy'), (source += '(\\d{2})'));
        else if (token === 'MM' || token === 'M') (order.push('m'), (source += '(\\d{1,2})'));
        else if (token === 'dd' || token === 'd') (order.push('d'), (source += '(\\d{1,2})'));
        else return null;
        last = match.index + token.length;
    }
    source += escape(pattern.slice(last));
    const match = new RegExp(`^\\s*${source}\\s*$`).exec(text);
    if (!match) return null;
    let year = NaN;
    let month = NaN;
    let day = NaN;
    order.forEach((kind, i) => {
        const n = Number(match[i + 1]);
        if (kind === 'y') year = n;
        else if (kind === 'yy') year = n + (n < 50 ? 2000 : 1900);
        else if (kind === 'm') month = n - 1;
        else day = n;
    });
    if ([year, month, day].some(Number.isNaN) || month < 0 || month > 11 || day < 1 || day > daysInMonth(year, month)) return null;
    return new Date(year, month, day);
}

function escape(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Tokens of a fixed width, each with the mask slots it takes. */
const FIXED_TOKENS: Record<string, string> = { yyyy: '9999', yy: '99', MM: '99', dd: '99', HH: '99', mm: '99', ss: '99' };

/**
 * A mask that fits what `formatDate` writes for a pattern, so a date box can
 * type into the shape it shows: `dd/MM/yyyy` gives `99/99/9999`. Null when the
 * pattern has a part of no fixed width — a month name, a day without its
 * leading zero — or a literal the mask would read as a slot.
 */
export function dateFormatMask(pattern: string): string | null {
    let mask = '';
    let last = 0;
    for (const match of pattern.matchAll(TOKENS)) {
        const literal = pattern.slice(last, match.index);
        last = match.index + match[0].length;
        const token = match[0];
        const slots = FIXED_TOKENS[token];
        const text = token.startsWith("'") ? token.slice(1, -1) : null;
        if (!slots && text === null) return null;
        mask += literal + (slots ?? text);
    }
    mask += pattern.slice(last);
    // Only the slots may be slot characters; a literal `9`, letter, `*` or `?` would be read as one.
    const literals = mask.replace(/9/g, '');
    if (/[0-9A-Za-z*?]/.test(literals) || !mask.includes('9')) return null;
    return mask;
}
