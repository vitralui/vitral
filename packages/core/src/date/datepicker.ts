import { addDays, addMonths, isDateSelectable, startOfDay, type DateConstraints } from './calendar';

/** The first day of the week `date` falls in, with weeks starting on `firstDayOfWeek` (0 = Sunday). */
export function startOfWeek(date: Date, firstDayOfWeek = 0): Date {
    return addDays(startOfDay(date), -((date.getDay() - firstDayOfWeek + 7) % 7));
}

/** The last day of the week `date` falls in. */
export function endOfWeek(date: Date, firstDayOfWeek = 0): Date {
    return addDays(startOfWeek(date, firstDayOfWeek), 6);
}

export function isSameMonth(a: Date | null | undefined, b: Date | null | undefined): boolean {
    return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** `date` moved inside `[min, max]`, compared by day. */
export function clampDate(date: Date, min?: Date | null, max?: Date | null): Date {
    const day = startOfDay(date);
    if (min && day < startOfDay(min)) return startOfDay(min);
    if (max && day > startOfDay(max)) return startOfDay(max);
    return day;
}

/**
 * The first selectable day at `date` or beyond it in the direction of `step`,
 * never leaving `[min, max]`; null when there is none within `limit` days.
 */
export function findSelectableDate(date: Date, step: 1 | -1, constraints: DateConstraints = {}, limit = 366): Date | null {
    let day = startOfDay(date);
    const min = constraints.min ? startOfDay(constraints.min) : null;
    const max = constraints.max ? startOfDay(constraints.max) : null;
    for (let n = 0; n <= limit; n++) {
        if ((min && day < min) || (max && day > max)) return null;
        if (isDateSelectable(day, constraints)) return day;
        day = addDays(day, step);
    }
    return null;
}

/**
 * The nearest selectable day to `date`: clamped into range, then searched in
 * `step`'s direction and, failing that, the other way. Null when the
 * constraints leave nothing to select nearby.
 */
export function nearestSelectableDate(date: Date, step: 1 | -1, constraints: DateConstraints = {}): Date | null {
    const day = startOfDay(date);
    const clamped = clampDate(day, constraints.min, constraints.max);
    // Clamped up to the minimum: the only way on is forwards, and the reverse at the maximum.
    const direction: 1 | -1 = clamped > day ? 1 : clamped < day ? -1 : step;
    return findSelectableDate(clamped, direction, constraints) ?? findSelectableDate(clamped, direction === 1 ? -1 : 1, constraints);
}

export interface CalendarKeyOptions {
    shiftKey?: boolean;
    firstDayOfWeek?: number;
    constraints?: DateConstraints;
}

/**
 * Where a key moves the focused day of a calendar grid, following the WAI-ARIA
 * date picker dialog: arrows by day and week, Home/End to the ends of the week,
 * PageUp/PageDown by month and, with Shift, by year. Unselectable days are
 * skipped in the direction of travel.
 *
 * Returns null for a key the grid does not handle, and `from` itself when the
 * key has nowhere selectable to go.
 */
export function calendarKeyTarget(from: Date, key: string, options: CalendarKeyOptions = {}): Date | null {
    const { shiftKey = false, firstDayOfWeek = 0, constraints = {} } = options;
    let target: Date;
    // Which way to look for a selectable day when the target is not one: along
    // the move for arrows and pages, back toward the week for Home and End.
    let step: 1 | -1;
    switch (key) {
        case 'ArrowLeft':
            target = addDays(from, -1);
            step = -1;
            break;
        case 'ArrowRight':
            target = addDays(from, 1);
            step = 1;
            break;
        case 'ArrowUp':
            target = addDays(from, -7);
            step = -1;
            break;
        case 'ArrowDown':
            target = addDays(from, 7);
            step = 1;
            break;
        case 'Home':
            target = startOfWeek(from, firstDayOfWeek);
            step = 1;
            break;
        case 'End':
            target = endOfWeek(from, firstDayOfWeek);
            step = -1;
            break;
        case 'PageUp':
            target = addMonths(from, shiftKey ? -12 : -1);
            step = -1;
            break;
        case 'PageDown':
            target = addMonths(from, shiftKey ? 12 : 1);
            step = 1;
            break;
        default:
            return null;
    }
    return nearestSelectableDate(target, step, constraints) ?? startOfDay(from);
}

/** How many years the year grid shows at once: five rows of four. */
export const YEARS_PER_PAGE = 20;

/**
 * The first year of the page `year` is on. Pages are aligned rather than
 * centred on the year, so paging from anywhere lands on the same years.
 */
export function yearPageStart(year: number, size = YEARS_PER_PAGE): number {
    return Math.floor(year / size) * size;
}

/** A month as one number, so that months can be compared and stepped across years. */
export function monthIndex(year: number, month: number): number {
    return year * 12 + month;
}

/**
 * Whether any day of the month is inside `[min, max]`. Disabled days and dates
 * are not looked at: a month with nothing left to choose in it still opens.
 */
export function isMonthInRange(year: number, month: number, constraints: DateConstraints = {}): boolean {
    const index = monthIndex(year, month);
    if (constraints.min && index < monthIndex(constraints.min.getFullYear(), constraints.min.getMonth())) return false;
    if (constraints.max && index > monthIndex(constraints.max.getFullYear(), constraints.max.getMonth())) return false;
    return true;
}

/** Whether any day of the year is inside `[min, max]`. */
export function isYearInRange(year: number, constraints: DateConstraints = {}): boolean {
    if (constraints.min && year < constraints.min.getFullYear()) return false;
    if (constraints.max && year > constraints.max.getFullYear()) return false;
    return true;
}

export interface PickerKeyOptions {
    /** Cells in a row. It has to divide what a page holds, so that a cell's column follows from its number. */
    columns: number;
    /** How far PageUp and PageDown go: twelve months, or a page of years. */
    page: number;
    min?: number | null;
    max?: number | null;
}

/**
 * Where a key moves the focused cell of the month or the year grid. The cells
 * are numbers — a `monthIndex`, or a year — so the arrows go one along and one
 * row up or down, Home and End to the ends of the row, and PageUp and PageDown
 * a page, which keeps the cell's place on it. The move stops at `min` and `max`.
 *
 * Returns null for a key the grid does not handle.
 */
export function pickerKeyTarget(from: number, key: string, options: PickerKeyOptions): number | null {
    const { columns, page, min, max } = options;
    const column = ((from % columns) + columns) % columns;
    let target: number;
    switch (key) {
        case 'ArrowLeft':
            target = from - 1;
            break;
        case 'ArrowRight':
            target = from + 1;
            break;
        case 'ArrowUp':
            target = from - columns;
            break;
        case 'ArrowDown':
            target = from + columns;
            break;
        case 'Home':
            target = from - column;
            break;
        case 'End':
            target = from + (columns - 1 - column);
            break;
        case 'PageUp':
            target = from - page;
            break;
        case 'PageDown':
            target = from + page;
            break;
        default:
            return null;
    }
    if (min != null && target < min) return min;
    if (max != null && target > max) return max;
    return target;
}
