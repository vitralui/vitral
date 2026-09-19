import { errorValue, isError, isRangeValue, type Argument, type CellError, type Scalar } from './types';

/**
 * Turning one kind of value into another, the way a spreadsheet does it: text
 * that looks like a number is one where a number is wanted, an empty cell is
 * zero in arithmetic and nothing in text, and an error that goes into a sum
 * comes out of it.
 */

/** A date is a number of days since 1899-12-30, which is what every sheet counts in. */
const EPOCH = Date.UTC(1899, 11, 30);
const DAY = 86400000;

export const serialFromDate = (date: Date): number => (date.getTime() - date.getTimezoneOffset() * 60000 - EPOCH) / DAY;
export const dateFromSerial = (serial: number): Date => new Date(EPOCH + Math.round(serial * DAY));
export const serialFromParts = (year: number, month: number, day: number): number => (Date.UTC(year, month - 1, day) - EPOCH) / DAY;

/** Text that is a number, and nothing else: `' 12 '` is, `'12a'` is not. */
export function numberFromText(text: string): number | null {
    const trimmed = text.trim();
    if (!trimmed) return null;
    const percent = trimmed.endsWith('%');
    const body = percent ? trimmed.slice(0, -1).trim() : trimmed;
    if (!/^[+-]?(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?$/.test(body)) return null;
    const value = Number(body);
    return Number.isFinite(value) ? (percent ? value / 100 : value) : null;
}

export function toNumber(value: Scalar): number | CellError {
    if (isError(value)) return value;
    if (value === null) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : errorValue('#VALUE!');
    if (typeof value === 'boolean') return value ? 1 : 0;
    const parsed = numberFromText(value);
    return parsed === null ? errorValue('#VALUE!') : parsed;
}

export function toText(value: Scalar): string | CellError {
    if (isError(value)) return value;
    if (value === null) return '';
    if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
    return String(value);
}

export function toBoolean(value: Scalar): boolean | CellError {
    if (isError(value)) return value;
    if (value === null) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    const upper = value.trim().toUpperCase();
    if (upper === 'TRUE') return true;
    if (upper === 'FALSE') return false;
    const parsed = numberFromText(value);
    return parsed === null ? errorValue('#VALUE!') : parsed !== 0;
}

/** An argument as a flat list: a rectangle reads row by row, a value is a list of one. */
export const flatten = (arg: Argument): Scalar[] => (isRangeValue(arg) ? arg.values : [arg]);

/** The first error in a list, which is what a function returns instead of an answer. */
export function firstError(values: Iterable<Scalar>): CellError | null {
    for (const value of values) if (isError(value)) return value;
    return null;
}

/**
 * The numbers among a function's arguments. A rectangle contributes only the
 * cells that hold numbers — text and empties in a column are skipped, which is
 * what makes `SUM(B2:B9)` work over a column with a heading in it — while a
 * value written into the call itself must be a number, so `SUM(1, "x")` is an
 * error rather than a quiet 1.
 */
export function numbers(args: Argument[]): number[] | CellError {
    const out: number[] = [];
    for (const arg of args) {
        if (isRangeValue(arg)) {
            for (const value of arg.values) {
                if (isError(value)) return value;
                if (typeof value === 'number') out.push(value);
                else if (typeof value === 'boolean') continue;
            }
            continue;
        }
        const value = toNumber(arg);
        if (isError(value)) return value;
        out.push(value);
    }
    return out;
}

/** Where a value sits when it is compared with another kind: numbers, then text, then booleans. */
const rank = (value: Scalar): number => (typeof value === 'number' ? 0 : typeof value === 'string' ? 1 : 2);

/** `-1`, `0` or `1`, or an error that one of the two carried in. */
export function compare(left: Scalar, right: Scalar): number | CellError {
    const error = firstError([left, right]);
    if (error) return error;
    // An empty cell takes the shape of what it is compared with: `A1=0` and
    // `A1=""` are both true of one.
    const a = left === null ? (typeof right === 'string' ? '' : typeof right === 'boolean' ? false : 0) : left;
    const b = right === null ? (typeof a === 'string' ? '' : typeof a === 'boolean' ? false : 0) : right;
    if (rank(a) !== rank(b)) return rank(a) < rank(b) ? -1 : 1;
    if (typeof a === 'string' && typeof b === 'string') {
        const x = a.toUpperCase();
        const y = b.toUpperCase();
        return x === y ? 0 : x < y ? -1 : 1;
    }
    const x = typeof a === 'boolean' ? (a ? 1 : 0) : (a as number);
    const y = typeof b === 'boolean' ? (b ? 1 : 0) : (b as number);
    return x === y ? 0 : x < y ? -1 : 1;
}
